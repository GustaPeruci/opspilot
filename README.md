# OpsPilot

Open-source enterprise workflow and operations platform built with a modular NestJS backend and Next.js frontend.

> **Status:** Foundation checks verified in CI. This repository is not production-ready. Identity and tenant authorization primitives exist, but authentication, protected endpoints and operational workflows are not implemented.

## Technology

- pnpm workspaces and Turborepo
- Next.js App Router and TypeScript
- NestJS, Prisma and PostgreSQL
- Docker Compose for local PostgreSQL
- Jest, Supertest, ESLint and GitHub Actions

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

SQL migrations are versioned in `apps/api/prisma/migrations` and applied to the CI PostgreSQL service. Docker Compose PostgreSQL health was verified in GitHub Actions CI run #40. Local developer-machine startup has not been independently verified.

## Quality checks

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm test
pnpm --filter @opspilot/api test:e2e
```

The CI workflow completed successfully in [run #40](https://github.com/GustaPeruci/opspilot/actions/runs/38770967294), including frozen-lockfile installation, Prisma validation and migration deployment, lint, typecheck, build, unit tests, API health E2E and Docker Compose PostgreSQL health. The frontend test command is still a placeholder and does not provide application coverage. The authorization primitives are not wired to an authentication mechanism or exposed endpoints.

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
