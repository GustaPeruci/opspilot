import { hashPassword, verifyPassword } from './password';

describe('password credentials', () => {
  it('uses unique salts and validates only the matching password', async () => {
    const first = await hashPassword('very-strong-passphrase-123');
    const second = await hashPassword('very-strong-passphrase-123');
    expect(first).not.toEqual(second);
    expect(first).not.toContain('very-strong-passphrase-123');
    await expect(verifyPassword('very-strong-passphrase-123', first)).resolves.toBe(true);
    await expect(verifyPassword('incorrect-password', first)).resolves.toBe(false);
    await expect(verifyPassword('very-strong-passphrase-123', 'invalid')).resolves.toBe(false);
  });

  it('rejects short or oversized passwords', async () => {
    await expect(hashPassword('short')).rejects.toThrow();
    await expect(hashPassword('a'.repeat(1025))).rejects.toThrow();
  });
});
