import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrganizationAccessGuard } from './organization-access.guard';
import { MembershipResolver } from './membership-resolver';

describe('OrganizationAccessGuard', () => {
  const reflector = new Reflector();
  const resolve = jest.fn();
  const guard = new OrganizationAccessGuard(reflector, { resolve } as unknown as MembershipResolver);

  function context(user?: unknown, organizationId = 'org-a'): ExecutionContext {
    return {
      getHandler: () => ({}) as never,
      getClass: () => class TestController {},
      switchToHttp: () => ({ getRequest: () => ({ user, params: { organizationId } }) }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    resolve.mockReset();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('members:manage');
  });
  afterEach(() => jest.restoreAllMocks());

  it('rejects unauthenticated callers without querying memberships', async () => {
    await expect(guard.canActivate(context())).rejects.toThrow(UnauthorizedException);
    expect(resolve).not.toHaveBeenCalled();
  });

  it('rejects cross-tenant access even for owners', async () => {
    resolve.mockResolvedValue(null);
    await expect(guard.canActivate(context({ userId: 'u1' }, 'org-b'))).rejects.toThrow(ForbiddenException);
    expect(resolve).toHaveBeenCalledWith('u1', 'org-b');
  });

  it('rejects suspended or missing memberships', async () => {
    resolve.mockResolvedValue(null);
    await expect(guard.canActivate(context({ userId: 'u1' }))).rejects.toThrow(ForbiddenException);
  });

  it('allows an active administrator from the database', async () => {
    resolve.mockResolvedValue({ userId: 'u1', organizationId: 'org-a', role: 'ADMIN', status: 'ACTIVE' });
    await expect(guard.canActivate(context({ userId: 'u1' }))).resolves.toBe(true);
  });

  it('denies access without declared permission metadata', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    await expect(guard.canActivate(context())).rejects.toThrow(ForbiddenException);
  });
});
