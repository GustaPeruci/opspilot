import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { SessionService } from './session.service';

interface SessionRequest {
  headers: { authorization?: string | string[] };
  user?: { userId: string; sessionId: string };
}

/**
 * Authenticate a server-issued opaque bearer session before any organization
 * authorization guard. Never trust user identity from request parameters.
 */
@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly sessions: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<SessionRequest>();
    const header = request.headers.authorization;
    if (typeof header !== 'string') throw new UnauthorizedException('Session required');
    const match = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(header);
    if (!match) throw new UnauthorizedException('Invalid authorization header');

    const verified = await this.sessions.verify(match[1]);
    if (!verified) throw new UnauthorizedException('Invalid or expired session');

    request.user = { userId: verified.userId, sessionId: verified.sessionId };
    return true;
  }
}
