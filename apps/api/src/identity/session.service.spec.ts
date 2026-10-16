import { SessionService } from './session.service';
import { hashSessionToken } from './session-token';

describe('SessionService', () => {
  const create = jest.fn();
  const findUnique = jest.fn();
  const updateMany = jest.fn();
  const service = new SessionService({
    session: { create, findUnique, updateMany },
  } as never);

  beforeEach(() => {
    create.mockReset();
    findUnique.mockReset();
    updateMany.mockReset();
  });

  it('stores only a token hash and returns the credential once', async () => {
    create.mockResolvedValue({ id: 's1' });
    const token = await service.issueForVerifiedUser('u1', new Date(Date.now() + 60000));
    expect(token).toBeTruthy();
    expect(create).toHaveBeenCalledWith({
      data: { userId: 'u1', tokenHash: hashSessionToken(token), expiresAt: expect.any(Date) },
    });
    expect(JSON.stringify(create.mock.calls)).not.toContain(token);
  });

  it('rejects invalid issuance arguments', async () => {
    await expect(service.issueForVerifiedUser('', new Date(Date.now() + 60000))).rejects.toThrow();
    await expect(service.issueForVerifiedUser('u1', new Date(0))).rejects.toThrow();
    expect(create).not.toHaveBeenCalled();
  });

  it('verifies only active persisted sessions', async () => {
    const expiresAt = new Date(Date.now() + 60000);
    findUnique.mockResolvedValue({ id: 's1', userId: 'u1', expiresAt, revokedAt: null });
    await expect(service.verify('secret-token')).resolves.toEqual({ sessionId: 's1', userId: 'u1' });
    expect(findUnique).toHaveBeenCalledWith({
      where: { tokenHash: hashSessionToken('secret-token') },
      select: { id: true, userId: true, expiresAt: true, revokedAt: true },
    });
    findUnique.mockResolvedValue({ id: 's1', userId: 'u1', expiresAt, revokedAt: new Date() });
    await expect(service.verify('secret-token')).resolves.toBeNull();
  });

  it('revokes only the session belonging to the authenticated user', async () => {
    updateMany.mockResolvedValue({ count: 1 });
    await expect(service.revoke('s1', 'u1')).resolves.toBe(true);
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 's1', userId: 'u1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });
});
