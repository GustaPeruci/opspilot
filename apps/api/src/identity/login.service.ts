import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { verifyPassword } from './password';
import { SessionService } from './session.service';

const DUMMY_HASH = 'scrypt-v1$' + '0'.repeat(32) + '$' + '0'.repeat(128);
const INVALID = 'Invalid email or password';
const MAX_FAILURES = 5;
const LOCK_MS = 15 * 60 * 1000;
const SESSION_MS = 8 * 60 * 60 * 1000;

@Injectable()
export class LoginService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionService,
  ) {}

  async login(email: string, password: string): Promise<{ accessToken: string; tokenType: 'Bearer'; expiresIn: number }> {
    const normalized = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalized },
      select: {
        id: true, passwordHash: true, failedLoginAttempts: true, lockedUntil: true,
      },
    });
    const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
    const now = new Date();
    if (!user || !user.passwordHash || (user.lockedUntil !== null && user.lockedUntil > now)) {
      throw new UnauthorizedException(INVALID);
    }
    if (!valid) {
      const failures = user.failedLoginAttempts + 1;
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failures,
          lockedUntil: failures >= MAX_FAILURES ? new Date(now.getTime() + LOCK_MS) : null,
        },
      });
      throw new UnauthorizedException(INVALID);
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
    const accessToken = await this.sessions.issueForVerifiedUser(
      user.id, new Date(now.getTime() + SESSION_MS),
    );
    return { accessToken, tokenType: 'Bearer', expiresIn: SESSION_MS / 1000 };
  }
}
