import { Module } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { MembershipResolver } from './membership-resolver';
import { OrganizationAccessGuard } from './organization-access.guard';

/**
 * Provides authorization services for future authenticated controllers.
 * Authentication must verify request.user before OrganizationAccessGuard runs.
 */
@Module({
  providers: [PrismaService, MembershipResolver, OrganizationAccessGuard],
  exports: [MembershipResolver, OrganizationAccessGuard],
})
export class IdentityModule {}
