# ADR-002: Tenant isolation

Status: Proposed

Every tenant-owned record will have an organization identifier. The API must verify organization membership and authorization before accessing tenant-owned data. Cross-tenant tests are required before Identity is considered complete.
