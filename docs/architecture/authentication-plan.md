# Authentication and organization access

## Trust boundary

The existing organization guard resolves active membership from PostgreSQL, but it must only run **after** authentication verifies the caller's identity. Never accept a user ID, role, or membership from a request header, URL parameter, or body as proof of identity.

## Implementation milestones

1. Choose and configure a server-side authentication provider/session mechanism with signed, expiring credentials and explicit issuer/audience validation where applicable.
2. Establish a trusted principal (`request.user.userId`) using a NestJS authentication guard; fail closed for missing or invalid credentials.
3. Register a lifecycle-managed Prisma client and the membership resolver through NestJS dependency injection.
4. Require both authentication and organization authorization on routes with `organizationId` parameters.
5. Add tests for missing, expired, tampered credentials; suspended memberships; role restrictions; cross-organization requests; and membership revocation.
6. Document environment variables, secret rotation, and deployment requirements before enabling production use.

## Current limitation

The authorization guard and resolver are not wired to an authentication guard or application routes. They are not a complete security boundary yet. Do not expose protected data until the milestones above are implemented and tested.

## Integration status

The identity branch is based on the merged foundation. Session verification and tenant authorization exist, but no trusted login issuer is exposed yet. Keep the PR in draft until credential verification, abuse controls, integration tests and a clean CI run are complete.
