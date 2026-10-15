# Identity and multi-tenancy design (proposal)

Status: design only. No authentication or tenant isolation is implemented yet.

## Domain

- **User**: globally unique identity, normalized email, lifecycle state.
- **Organization**: tenant boundary, name, slug, lifecycle state.
- **Membership**: join table for user ↔ organization, with role and status; a user can belong to multiple organizations.
- **Role**: initially `OWNER`, `ADMIN`, `MEMBER`, `VIEWER`. Roles apply to a membership, not globally to a user.

## Authentication

Use a server-side authentication mechanism with short-lived access credentials and rotation/revocation for refresh credentials. Passwords, if supported, must be salted and hashed using a modern password hashing algorithm; never store plaintext passwords or tokens. Define session expiration, account recovery, email verification and rate limiting before exposing registration publicly.

## Authorization and tenant isolation

Every tenant-owned record must carry an `organizationId` foreign key. Authenticated API requests must resolve the active organization from trusted server-side membership checks, never solely from a client-provided organization identifier. Every read, update and delete must be scoped to the active organization. A valid user without membership receives a denied response, not cross-tenant data. Default deny on missing organization context.

Permission examples:

| Action | Owner | Admin | Member | Viewer |
| --- | --- | --- | --- | --- |
| Read organization data | Yes | Yes | Yes | Yes |
| Create operational records | Yes | Yes | Yes | No |
| Invite/manage members | Yes | Yes | No | No |
| Transfer ownership | Yes | No | No | No |

Ownership transfer requires explicit safeguards to prevent leaving an organization without an owner.

## Migration plan

1. Add Organization and Membership models and a migration without changing the current health endpoint.
2. Implement identity/session primitives and authorization guards with tests.
3. Add organization creation and membership APIs with validation and negative authorization tests.
4. Introduce a shared tenant-scoping convention for repositories and enforce it in every business module.
5. Add integration tests proving users in tenant A cannot access tenant B's data, even with guessed IDs.
6. Audit events for login, invitation, role changes and organization ownership changes.

## Acceptance criteria

- Unauthenticated calls to protected endpoints return 401.
- Authenticated users without membership return 403 (or a deliberate 404 where non-disclosure is required).
- Tenant-scoped queries never return data from other organizations.
- Role changes and revoked sessions take effect consistently.
- API integration tests cover cross-tenant access, role escalation and organization switching.

Do not consider this design implemented until migration, code and tests pass CI.
