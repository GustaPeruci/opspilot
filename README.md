# OpsPilot

Open-source enterprise workflow and operations platform built with a modular NestJS backend and Next.js frontend.

> **Status:** Foundation in progress. This repository is not production-ready. Authentication, multi-tenancy and workflow features are not implemented.

## Technology

- pnpm workspaces and Turborepo
- Next.js App Router and TypeScript
- NestJS, Prisma and PostgreSQL
- Docker Compose for local PostgreSQL
- Jest, Supertest, ESLint and GitHub Actions (configuration pending verification)

## Local development

Requirements: Node.js 22, pnpm 9.15.9 and Docker Compose.

```bash
cp .env.example .env
pnpm install
pnpm db:generate
docker compose up -d
pnpm --filter @opspilot/api prisma:migrate
pnpm dev
```

The web application uses `http://localhost:3000`; the API defaults to `http://localhost:4000` and exposes `GET /health` and Swagger at `/docs`.

An initial SQL migration is versioned in `apps/api/prisma/migrations`. Database application has not yet been verified against a running PostgreSQL instance.

## Quality checks

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm test
```

These commands have **not yet been verified in CI**. The initial frontend test command is a placeholder and does not provide application coverage.

## Architecture

See [architecture](docs/architecture/overview.md) and [decisions](docs/decisions/ADR-001-modular-monolith.md).

## Roadmap

1. Foundation and reproducible CI
2. Identity, organizations and RBAC
3. Requests, workflows, tasks and audit
4. Frontend operations workspace
5. Notifications and automation
6. Production hardening and public demo

## License

MIT. See [LICENSE](LICENSE).
