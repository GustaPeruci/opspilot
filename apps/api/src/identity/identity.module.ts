import { Module } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { MembershipResolver } from './membership-resolver';
import { OrganizationAccessGuard } from './organization-access.guard';
import { SessionService } from './session.service';
import { SessionAuthGuard } from './session-auth.guard';

/**
 * Provides authorization services for future authenticated controllers.
 * Authentication must verify request.user before OrganizationAccessGuard runs.
 */
@Module({
  providers: [PrismaService, MembershipResolver, OrganizationAccessGuard, SessionService, SessionAuthGuard],
  exports: [MembershipResolver, OrganizationAccessGuard, SessionService],
})
export class IdentityModule {}
