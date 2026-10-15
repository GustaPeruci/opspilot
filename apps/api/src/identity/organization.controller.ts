import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OrganizationAccessGuard } from './organization-access.guard';
import { RequireOrganizationPermission } from './require-organization-permission.decorator';
import { SessionAuthGuard } from './session-auth.guard';

/** Both guards are mandatory: authenticate first, authorize tenant second. */
@Controller('organizations')
@UseGuards(SessionAuthGuard, OrganizationAccessGuard)
export class OrganizationController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':organizationId')
  @RequireOrganizationPermission('organization:read')
  async getOrganization(@Param('organizationId') organizationId: string) {
    return this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
      select: { id: true, name: true, slug: true },
    });
  }
}
