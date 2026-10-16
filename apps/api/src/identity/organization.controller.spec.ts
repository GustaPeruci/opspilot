import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ORGANIZATION_PERMISSION_KEY, OrganizationAccessGuard } from './organization-access.guard';
import { OrganizationController } from './organization.controller';
import { SessionAuthGuard } from './session-auth.guard';

describe('OrganizationController security metadata', () => {
  it('requires session authentication before organization authorization', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, OrganizationController);
    expect(guards).toEqual([SessionAuthGuard, OrganizationAccessGuard]);
  });

  it('requires explicit organization:read permission on its route', () => {
    const handler = Object.getOwnPropertyDescriptor(
      OrganizationController.prototype,
      'getOrganization',
    )?.value;
    expect(Reflect.getMetadata(ORGANIZATION_PERMISSION_KEY, handler)).toBe('organization:read');
  });

  it('queries the requested organization without exposing membership records', async () => {
    const findUniqueOrThrow = jest.fn().mockResolvedValue({
      id: 'org-1', name: 'Test', slug: 'test',
    });
    const controller = new OrganizationController({
      organization: { findUniqueOrThrow },
    } as never);
    await expect(controller.getOrganization('org-1')).resolves.toEqual({
      id: 'org-1', name: 'Test', slug: 'test',
    });
    expect(findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 'org-1' },
      select: { id: true, name: true, slug: true },
    });
  });
});
