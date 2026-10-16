import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/** Generate a cryptographically random bearer token. Return it only once at login. */
export function createSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

/** Persist only the digest, never the raw session credential. */
export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function sessionTokenMatches(token: string, expectedHash: string): boolean {
  if (!/^[a-f0-9]{64}$/.test(expectedHash)) return false;
  const actual = Buffer.from(hashSessionToken(token), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return timingSafeEqual(actual, expected);
}

export function isSessionActive(expiresAt: Date, revokedAt: Date | null, now = new Date()): boolean {
  return revokedAt === null && Number.isFinite(expiresAt.getTime()) && expiresAt.getTime() > now.getTime();
}
