# Architecture

```mermaid
flowchart TD
  Web[Next.js Web] --> API[NestJS API]
  API --> DB[(PostgreSQL)]
  API -. future .-> Queue[Redis / BullMQ]
```

Current status: Foundation scaffold. Identity, tenant enforcement and business modules are not implemented.
