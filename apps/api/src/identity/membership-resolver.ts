import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { OrganizationMembershipContext } from './authorization';

/**
 * Database-backed membership resolution. The caller must supply a user ID
 * already established by a trusted authentication mechanism.
 */
@Injectable()
export class MembershipResolver {
  constructor(private readonly prisma: PrismaClient) {}

  async resolve(userId: string, organizationId: string): Promise<OrganizationMembershipContext | null> {
    if (!userId || !organizationId) return null;

    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
      select: { userId: true, organizationId: true, role: true, status: true },
    });

    if (!membership || membership.status !== 'ACTIVE') return null;
    return membership;
  }
}
