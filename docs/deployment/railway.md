# OpsPilot — Railway deployment runbook (PR #5)

This repository contains two Docker build contexts rooted at the monorepo root. The authenticated web application cannot run on GitHub Pages: it requires a live NestJS API and persistent PostgreSQL.

## Provision

1. Connect the repository to a Railway project.
2. Create a **PostgreSQL** database service with persistent storage, backups and a strong generated password.
3. Create **API** service from the repo root, using `Dockerfile.api`. Set `DATABASE_URL` to the database's **private** connection URL; `WEB_ORIGIN` to the HTTPS web domain; `NODE_ENV=production`. Railway injects `PORT`. Generate a public HTTPS domain.
4. Create **Web** service from the repo root using `Dockerfile.web`. Configure Docker build argument `NEXT_PUBLIC_API_URL` to the API's public HTTPS URL, **without trailing slash**. This value must be available **at Docker build time**, not only runtime; the Dockerfile deliberately fails if it is missing. Generate a public HTTPS domain.
5. Update `WEB_ORIGIN` on the API service to match the exact web HTTPS origin. Redeploy both services after any domain change.
6. Verify `GET https://<api-domain>/health` returns healthy and that the web homepage loads. Test login and task workflow with a bootstrap account.

## First owner

Provision the initial owner through a **one-off trusted command in the API service** with the production `DATABASE_URL` already injected:

`pnpm --filter @opspilot/api exec tsx src/identity/bootstrap-owner.ts <email> <slug> <name> < password-file`

Do not pass a password in command arguments, CI logs or chat. This command needs `tsx` and source files, which the current image retains; execute only in an authorized private service shell. The script creates a new user and organization; repeated execution with the same values fails on uniqueness constraints.

**Current limitation:** the web login form requires the organization's UUID, while the bootstrap command only prints a success message. Retrieve the organization UUID using an authenticated database administration tool before handing credentials to the owner.

## Security and operations

- Use Railway managed HTTPS and private database networking. Do not expose PostgreSQL publicly.
- Restrict project access and keep `DATABASE_URL` out of source control.
- Configure service restart and health checks; use `/health` for API readiness.
- Back up the database and test restore procedures before handling important data.
- The API image runs `prisma migrate deploy` on startup. For multiple API replicas, move migrations to a single controlled release job.
- The current auth is a minimal custom bearer-session flow; before hosting sensitive customer data, perform security review, rate limiting, audit logging, monitoring and recovery testing.
- `NEXT_PUBLIC_API_URL` is compiled into the browser bundle; changing the API URL requires rebuilding the web image.
- The static GitHub Pages demo remains separate and is **not** a production deployment.

## Go/no-go verification

- [ ] PostgreSQL persistent volume and backup policy
- [ ] API HTTPS and health check passing
- [ ] Web HTTPS and API CORS origin matching
- [ ] Database migrations successful
- [ ] Owner bootstrapped securely and organization UUID retrieved
- [ ] Browser login, create task, filter and status transitions verified
- [ ] Service logs show no errors
- [ ] No secrets in public repo, Pages demo or CI output

Do not mark production live until all checks are verified against the actual provider deployment.
