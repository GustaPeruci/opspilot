import { UnauthorizedException } from '@nestjs/common';
import { LoginService } from './login.service';
import { hashPassword } from './password';

describe('LoginService', () => {
  const findUnique = jest.fn();
  const update = jest.fn();
  const issueForVerifiedUser = jest.fn();
  const service = new LoginService(
    { user: { findUnique, update } } as never,
    { issueForVerifiedUser } as never,
  );

  beforeEach(() => {
    findUnique.mockReset();
    update.mockReset().mockResolvedValue({});
    issueForVerifiedUser.mockReset().mockResolvedValue('issued-token');
  });

  it('rejects unknown users without issuing sessions', async () => {
    findUnique.mockResolvedValue(null);
    await expect(service.login('missing@example.test', 'some-password-long')).rejects.toThrow(UnauthorizedException);
    expect(issueForVerifiedUser).not.toHaveBeenCalled();
  });

  it('issues a session only for a verified password', async () => {
    findUnique.mockResolvedValue({
      id: 'u1', passwordHash: await hashPassword('valid-password-123'),
      failedLoginAttempts: 0, lockedUntil: null,
    });
    await expect(service.login('USER@EXAMPLE.TEST', 'valid-password-123')).resolves.toEqual({
      accessToken: 'issued-token', tokenType: 'Bearer', expiresIn: 28800,
    });
    expect(findUnique).toHaveBeenCalledWith({
      where: { email: 'user@example.test' },
      select: { id: true, passwordHash: true, failedLoginAttempts: true, lockedUntil: true },
    });
    expect(issueForVerifiedUser).toHaveBeenCalledWith('u1', expect.any(Date));
  });

  it('locks an account after five failed attempts', async () => {
    findUnique.mockResolvedValue({
      id: 'u1', passwordHash: await hashPassword('valid-password-123'),
      failedLoginAttempts: 4, lockedUntil: null,
    });
    await expect(service.login('user@example.test', 'invalid-password-123')).rejects.toThrow(UnauthorizedException);
    expect(update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { failedLoginAttempts: 5, lockedUntil: expect.any(Date) },
    });
    expect(issueForVerifiedUser).not.toHaveBeenCalled();
  });
});
