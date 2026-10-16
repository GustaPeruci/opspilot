import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from './password';

/**
 * Run in a trusted environment with DATABASE_URL configured:
 *   pnpm --filter @opspilot/api exec tsx src/identity/bootstrap-owner.ts <email> <org-slug> <org-name> < password-file
 * Never pass the password as a command-line argument.
 */
async function main() {
  const [emailArg, slugArg, ...nameParts] = process.argv.slice(2);
  const email = emailArg?.trim().toLowerCase();
  const slug = slugArg?.trim().toLowerCase();
  const name = nameParts.join(' ').trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !name) {
    throw new Error('Usage: bootstrap-owner <email> <org-slug> <org-name> < password-file');
  }
  if (process.stdin.isTTY) throw new Error('Provide password via redirected stdin, not CLI arguments');
  const password = readFileSync(0, 'utf8').replace(/\r?\n$/, '');
  const passwordHash = await hashPassword(password);
  const prisma = new PrismaClient();
  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { email, passwordHash } });
      const organization = await tx.organization.create({ data: { name, slug } });
      await tx.membership.create({
        data: { userId: user.id, organizationId: organization.id, role: 'OWNER', status: 'ACTIVE' },
      });
    });
    process.stdout.write('Owner and organization created.\n');
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  process.stderr.write(error instanceof Error ? error.message + '\n' : 'Bootstrap failed\n');
  process.exitCode = 1;
});
