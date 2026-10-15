import { SetMetadata } from '@nestjs/common';
import { ORGANIZATION_PERMISSION_KEY } from './organization-access.guard';
import { OrganizationPermission } from './authorization';

export const RequireOrganizationPermission = (permission: OrganizationPermission): MethodDecorator & ClassDecorator =>
  SetMetadata(ORGANIZATION_PERMISSION_KEY, permission);
