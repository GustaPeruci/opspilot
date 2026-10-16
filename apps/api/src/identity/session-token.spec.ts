import { createSessionToken, hashSessionToken, isSessionActive, sessionTokenMatches } from './session-token';

describe('session token primitives', () => {
  it('creates independent high-entropy tokens', () => {
    const first = createSessionToken();
    const second = createSessionToken();
    expect(first).not.toBe(second);
    expect(Buffer.from(first, 'base64url')).toHaveLength(32);
    expect(Buffer.from(second, 'base64url')).toHaveLength(32);
  });

  it('hashes credentials and compares digests safely', () => {
    const token = createSessionToken();
    const digest = hashSessionToken(token);
    expect(digest).toMatch(/^[a-f0-9]{64}$/);
    expect(digest).not.toContain(token);
    expect(sessionTokenMatches(token, digest)).toBe(true);
    expect(sessionTokenMatches('incorrect', digest)).toBe(false);
    expect(sessionTokenMatches(token, 'invalid')).toBe(false);
  });

  it('rejects expired, revoked and invalid sessions', () => {
    const now = new Date('2026-10-15T12:00:00.000Z');
    expect(isSessionActive(new Date('2026-10-15T12:01:00.000Z'), null, now)).toBe(true);
    expect(isSessionActive(now, null, now)).toBe(false);
    expect(isSessionActive(new Date('2026-10-15T11:59:00.000Z'), null, now)).toBe(false);
    expect(isSessionActive(new Date('2026-10-15T12:01:00.000Z'), now, now)).toBe(false);
    expect(isSessionActive(new Date('invalid'), null, now)).toBe(false);
  });
});
