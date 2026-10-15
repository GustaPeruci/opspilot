import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { canAccessOrganization, OrganizationPermission } from './authorization';
import { MembershipResolver } from './membership-resolver';

export const ORGANIZATION_PERMISSION_KEY = 'organization_permission';

interface AuthenticatedPrincipal {
  /** Must be assigned by a verified authentication guard, never from request body/headers. */
  userId: string;
}

interface OrganizationRequest {
  user?: AuthenticatedPrincipal;
  params?: Record<string, string | undefined>;
}

/**
 * Database-backed authorization boundary. Register this guard only after a
 * trusted authentication guard that verifies credentials and sets request.user.
 */
@Injectable()
export class OrganizationAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly memberships: MembershipResolver,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.getAllAndOverride<OrganizationPermission | undefined>(
      ORGANIZATION_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!permission) {
      throw new ForbiddenException('Organization permission metadata is required');
    }

    const request = context.switchToHttp().getRequest<OrganizationRequest>();
    if (!request.user?.userId) {
      throw new UnauthorizedException('Authentication required');
    }

    const organizationId = request.params?.organizationId;
    if (!organizationId) {
      throw new ForbiddenException('Organization identifier required');
    }

    const membership = await this.memberships.resolve(request.user.userId, organizationId);
    if (!canAccessOrganization(membership, organizationId, permission)) {
      throw new ForbiddenException('Insufficient organization permissions');
    }
    return true;
  }
}
