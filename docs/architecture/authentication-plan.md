# Authentication and organization access

## Implemented boundary

- `POST /auth/login` validates email/password credentials using salted Node.js scrypt hashes.
- `POST /auth/logout` revokes the current opaque bearer session.
- `GET /organizations/:organizationId` requires `SessionAuthGuard` followed by `OrganizationAccessGuard`.
- Sessions are stored as SHA-256 digests; raw tokens are returned only at login.
- Session tokens expire after eight hours. Suspended organization memberships are denied immediately.
- Five failed password attempts lock the account for fifteen minutes.
- Passwords are never accepted from headers or URL parameters. The server derives identity from verified session storage.
- There is no public sign-up endpoint. Initial OWNER accounts and organizations are created by a trusted server-side bootstrap script.

## Local bootstrap

Apply migrations before provisioning:

```bash
pnpm --filter @opspilot/api exec prisma migrate deploy
pnpm --filter @opspilot/api exec tsx src/identity/bootstrap-owner.ts admin@example.com demo-org "Demo Organization" < /secure/password-file
```

Use a temporary, access-restricted password file and remove it securely after provisioning. Never commit credentials, place them in shell command arguments, or run the bootstrap script from a public HTTP endpoint. The script creates a new user and organization, and fails if either unique identifier already exists.

## Production hardening before deployment

- Enforce TLS and an ingress/API-gateway rate limit for `/auth/login` (including unknown emails); account lockout alone is insufficient, especially across concurrent requests and multiple replicas.
- Store and rotate secrets using the deployment platform's secret manager; do not log bearer tokens.
- Configure strict allowed origins and avoid browser token storage accessible to injected scripts.
- Add security monitoring, password reset, compromised-session revocation and periodic cleanup of expired sessions.
- Consider stronger account recovery/MFA and independent security review before handling real customer data.

## Validation

Unit tests cover password hashing, login decisions, session issuance and revocation, guard behavior and tenant permissions. PostgreSQL E2E tests exercise login, logout, cross-tenant access and suspended memberships. The PR should remain a draft until the latest CI succeeds and the diff contains only identity changes.
