import { MembershipResolver } from './membership-resolver';

describe('MembershipResolver', () => {
  const findUnique = jest.fn();
  const resolver = new MembershipResolver({
    membership: { findUnique },
  } as never);

  beforeEach(() => findUnique.mockReset());

  it('loads only the authenticated user and requested organization', async () => {
    findUnique.mockResolvedValue({ userId: 'u1', organizationId: 'org-a', role: 'MEMBER', status: 'ACTIVE' });
    await expect(resolver.resolve('u1', 'org-a')).resolves.toEqual({
      userId: 'u1', organizationId: 'org-a', role: 'MEMBER', status: 'ACTIVE',
    });
    expect(findUnique).toHaveBeenCalledWith({
      where: { userId_organizationId: { userId: 'u1', organizationId: 'org-a' } },
      select: { userId: true, organizationId: true, role: true, status: true },
    });
  });

  it('rejects suspended memberships', async () => {
    findUnique.mockResolvedValue({ userId: 'u1', organizationId: 'org-a', role: 'ADMIN', status: 'SUSPENDED' });
    await expect(resolver.resolve('u1', 'org-a')).resolves.toBeNull();
  });

  it('rejects missing memberships', async () => {
    findUnique.mockResolvedValue(null);
    await expect(resolver.resolve('u1', 'org-b')).resolves.toBeNull();
  });

  it('does not query the database for missing identifiers', async () => {
    await expect(resolver.resolve('', 'org-a')).resolves.toBeNull();
    expect(findUnique).not.toHaveBeenCalled();
  });
});
