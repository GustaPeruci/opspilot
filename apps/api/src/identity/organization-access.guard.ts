import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { canAccessOrganization, OrganizationMembershipContext, OrganizationPermission } from './authorization';

export const ORGANIZATION_PERMISSION_KEY = 'organization_permission';

export interface VerifiedOrganizationPrincipal {
  userId: string;
  /** Membership must have been loaded and verified server-side. */
  membership: OrganizationMembershipContext | null;
}

interface OrganizationRequest {
  user?: VerifiedOrganizationPrincipal;
  params?: Record<string, string | undefined>;
}

/**
 * Authorization boundary only. A separate authentication guard must verify
 * credentials and populate request.user before this guard runs.
 */
@Injectable()
export class OrganizationAccessGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permission = this.reflector.getAllAndOverride<OrganizationPermission | undefined>(
      ORGANIZATION_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!permission) {
      throw new ForbiddenException('Organization permission metadata is required');
    }

    const request = context.switchToHttp().getRequest<OrganizationRequest>();
    if (!request.user) {
      throw new UnauthorizedException('Authentication required');
    }

    const organizationId = request.params?.organizationId;
    if (!organizationId || !request.user.membership || request.user.membership.userId !== request.user.userId) {
      throw new ForbiddenException('Active organization membership required');
    }

    if (!canAccessOrganization(request.user.membership, organizationId, permission)) {
      throw new ForbiddenException('Insufficient organization permissions');
    }
    return true;
  }
}
