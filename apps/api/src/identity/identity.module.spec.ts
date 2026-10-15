import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { IdentityModule } from './identity.module';
import { MembershipResolver } from './membership-resolver';
import { OrganizationAccessGuard } from './organization-access.guard';

describe('IdentityModule', () => {
  const findUnique = jest.fn();
  const prisma = { membership: { findUnique } };

  beforeEach(() => findUnique.mockReset());

  it('wires the guard to database-backed membership resolution', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [IdentityModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    const resolver = moduleRef.get(MembershipResolver);
    const guard = moduleRef.get(OrganizationAccessGuard);
    expect(resolver).toBeDefined();
    expect(guard).toBeDefined();

    const context = {
      getHandler: () => function handler() {},
      getClass: () => class TestController {},
      switchToHttp: () => ({
        getRequest: () => ({
          user: { userId: 'user-a', role: 'OWNER', membership: { role: 'OWNER' } },
          params: { organizationId: 'org-b' },
        }),
      }),
    } as unknown as ExecutionContext;

    // Without permission metadata, access must fail closed before any DB query.
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    expect(findUnique).not.toHaveBeenCalled();
    await moduleRef.close();
  });
});
