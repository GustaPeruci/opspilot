import { canAccessOrganization, hasOrganizationPermission } from './authorization';

describe('organization authorization policy', () => {
  it('grants owners all permissions', () => {
    expect(hasOrganizationPermission('OWNER', 'ownership:transfer')).toBe(true);
    expect(hasOrganizationPermission('OWNER', 'members:manage')).toBe(true);
  });

  it('prevents privilege escalation by non-owners', () => {
    expect(hasOrganizationPermission('ADMIN', 'ownership:transfer')).toBe(false);
    expect(hasOrganizationPermission('MEMBER', 'members:manage')).toBe(false);
    expect(hasOrganizationPermission('VIEWER', 'records:create')).toBe(false);
  });

  it('denies requests without a membership', () => {
    expect(canAccessOrganization(null, 'org-a', 'organization:read')).toBe(false);
  });

  it('rejects cross-tenant access even for an owner', () => {
    const membership = { organizationId: 'org-a', userId: 'user-1', role: 'OWNER' as const, status: 'ACTIVE' as const };
    expect(canAccessOrganization(membership, 'org-b', 'organization:read')).toBe(false);
    expect(canAccessOrganization(membership, 'org-a', 'organization:read')).toBe(true);
  });

  it('denies inactive memberships', () => {
    const membership = { organizationId: 'org-a', userId: 'user-1', role: 'ADMIN' as const, status: 'SUSPENDED' as const };
    expect(canAccessOrganization(membership, 'org-a', 'members:manage')).toBe(false);
  });
});
