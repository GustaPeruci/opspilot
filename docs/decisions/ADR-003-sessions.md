# ADR-003: Session authentication

Status: Accepted for the initial API milestone

## Decision

Use server-managed, opaque 256-bit bearer session tokens for the initial API. Store only SHA-256 token hashes in PostgreSQL, enforce an eight-hour expiration, and revoke sessions server-side. Verify a session before checking organization membership.

Authenticate users with salted scrypt password hashes. No public registration is available; trusted server-side provisioning creates the initial owner. Keep all credentials out of logs and URLs.

## Trade-offs and follow-up

Bearer tokens must be protected from JavaScript injection and must only travel over HTTPS. For a browser-first product, prefer a future transition to Secure, HttpOnly, SameSite cookies with CSRF protection and carefully defined session renewal. A cookie migration requires its own review and tests; the current implementation does **not** set cookies.

Production deployment also requires gateway rate limits, secure credential storage, account recovery, security monitoring and operational session cleanup. These controls are not implied by this ADR.
