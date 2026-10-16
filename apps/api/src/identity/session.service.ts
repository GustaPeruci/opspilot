import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { createSessionToken, hashSessionToken, isSessionActive } from './session-token';

export interface VerifiedSession {
  sessionId: string;
  userId: string;
}

/**
 * Internal session persistence only. Session issuance must be called solely
 * after a trusted identity provider has authenticated the user.
 */
@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async issueForVerifiedUser(userId: string, expiresAt: Date): Promise<string> {
    if (!userId || !Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
      throw new Error('A verified user and future expiration are required');
    }
    const token = createSessionToken();
    await this.prisma.session.create({
      data: { userId, tokenHash: hashSessionToken(token), expiresAt },
    });
    return token;
  }

  async verify(token: string): Promise<VerifiedSession | null> {
    if (!token || token.length > 256) return null;
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: hashSessionToken(token) },
      select: { id: true, userId: true, expiresAt: true, revokedAt: true },
    });
    if (!session || !isSessionActive(session.expiresAt, session.revokedAt)) return null;
    return { sessionId: session.id, userId: session.userId };
  }

  async revoke(sessionId: string, userId: string): Promise<boolean> {
    if (!sessionId || !userId) return false;
    const result = await this.prisma.session.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return result.count > 0;
  }
}
