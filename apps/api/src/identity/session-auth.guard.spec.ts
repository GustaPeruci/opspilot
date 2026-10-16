import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SessionAuthGuard } from './session-auth.guard';
import { SessionService } from './session.service';

describe('SessionAuthGuard', () => {
  const verify = jest.fn();
  const guard = new SessionAuthGuard({ verify } as unknown as SessionService);
  const token = 'A'.repeat(43);

  function requestWith(authorization?: string | string[]) {
    const request: { headers: { authorization?: string | string[] }; user?: unknown } = {
      headers: { authorization },
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    return { context, request };
  }

  beforeEach(() => verify.mockReset());

  it('rejects absent or malformed credentials without consulting sessions', async () => {
    for (const header of [undefined, 'Basic abc', 'Bearer invalid', 'Bearer ' + token + ' extra', [token]]) {
      await expect(guard.canActivate(requestWith(header).context)).rejects.toThrow(UnauthorizedException);
    }
    expect(verify).not.toHaveBeenCalled();
  });

  it('rejects unknown, expired or revoked sessions', async () => {
    verify.mockResolvedValue(null);
    const { context, request } = requestWith('Bearer ' + token);
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    expect(request.user).toBeUndefined();
  });

  it('establishes principal only from a verified server-side session', async () => {
    verify.mockResolvedValue({ userId: 'u1', sessionId: 's1' });
    const { context, request } = requestWith('Bearer ' + token);
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(verify).toHaveBeenCalledWith(token);
    expect(request.user).toEqual({ userId: 'u1', sessionId: 's1' });
  });
});
