import { Body, Controller, Get, Header, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { WorkItemStatus } from '@prisma/client';
import { OrganizationAccessGuard } from '../identity/organization-access.guard';
import { RequireOrganizationPermission } from '../identity/require-organization-permission.decorator';
import { SessionAuthGuard } from '../identity/session-auth.guard';
import { WorkItemsService } from './work-items.service';

class CreateWorkItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

class TransitionWorkItemDto {
  @IsEnum(WorkItemStatus)
  status!: WorkItemStatus;
}

@Controller('organizations/:organizationId/work-items')
@UseGuards(SessionAuthGuard, OrganizationAccessGuard)
export class WorkItemsController {
  constructor(private readonly items: WorkItemsService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  @RequireOrganizationPermission('records:read')
  list(@Param('organizationId') organizationId: string) {
    return this.items.list(organizationId);
  }

  @Get(':id')
  @Header('Cache-Control', 'no-store')
  @RequireOrganizationPermission('records:read')
  get(@Param('organizationId') organizationId: string, @Param('id') id: string) {
    return this.items.get(organizationId, id);
  }

  @Post()
  @RequireOrganizationPermission('records:create')
  create(@Param('organizationId') organizationId: string, @Body() body: CreateWorkItemDto) {
    return this.items.create(organizationId, body.title, body.description);
  }

  @Patch(':id/status')
  @RequireOrganizationPermission('records:update')
  transition(
    @Param('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body() body: TransitionWorkItemDto,
  ) {
    return this.items.transition(organizationId, id, body.status);
  }
}
