import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrganizationAccessGuard } from './organization-access.guard';

describe('OrganizationAccessGuard', () => {
  const reflector = new Reflector();
  const guard = new OrganizationAccessGuard(reflector);

  function context(user?: unknown, organizationId = 'org-a'): ExecutionContext {
    return {
      getHandler: () => ({}) as never,
      getClass: () => class TestController {},
      switchToHttp: () => ({
        getRequest: () => ({ user, params: { organizationId } }),
      }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('members:manage');
  });

  afterEach(() => jest.restoreAllMocks());

  it('rejects unauthenticated callers', () => {
    expect(() => guard.canActivate(context())).toThrow(UnauthorizedException);
  });

  it('rejects mismatched tenant identifiers', () => {
    const user = { userId: 'u1', membership: { userId: 'u1', organizationId: 'org-a', role: 'OWNER', status: 'ACTIVE' } };
    expect(() => guard.canActivate(context(user, 'org-b'))).toThrow(ForbiddenException);
  });

  it('rejects mismatched user identities', () => {
    const user = { userId: 'u1', membership: { userId: 'u2', organizationId: 'org-a', role: 'OWNER', status: 'ACTIVE' } };
    expect(() => guard.canActivate(context(user))).toThrow(ForbiddenException);
  });

  it('allows a verified administrator membership', () => {
    const user = { userId: 'u1', membership: { userId: 'u1', organizationId: 'org-a', role: 'ADMIN', status: 'ACTIVE' } };
    expect(guard.canActivate(context(user))).toBe(true);
  });

  it('denies access without declared permission metadata', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(() => guard.canActivate(context())).toThrow(ForbiddenException);
  });
});
