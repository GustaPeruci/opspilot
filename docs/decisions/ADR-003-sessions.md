# ADR-003: Session authentication

Status: Proposed

Prefer server-managed sessions using HttpOnly cookies, Secure in production, SameSite restrictions and CSRF protection for state-changing requests. Store reset tokens as hashes.
