# ADR-005: Transactional outbox

Status: Proposed

For critical asynchronous events, write domain changes and outbox entries in one database transaction. A worker will publish and process pending events with idempotency keys, retries and backoff. BullMQ is not part of the current foundation implementation.
