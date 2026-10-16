# Operations MVP — PR #3

## Scope

Implement the first tenant-scoped operational workflow: organizations create work items, list their own work items, inspect one item and move it through a controlled status lifecycle.

## Invariants

- Every work item belongs to exactly one organization; the organization identifier is derived from the protected route.
- Authentication precedes database-backed membership authorization.
- VIEWER can read but cannot create or change records; OWNER, ADMIN and MEMBER may create.
- All record reads and updates include the organization ID in their database predicates, including guessed IDs.
- Invalid transitions and malformed input fail without modifying persisted state.
- Use a transactional or conditional update to prevent concurrent state changes from silently overwriting one another.

## First increment

Prisma model and migration, NestJS service/controller, explicit permission checks, validation and PostgreSQL E2E coverage. A real Next.js UI and richer workflow definitions follow after API validation.

This PR remains a draft until CI, tenant isolation and transition tests pass.
