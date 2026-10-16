# OpsPilot Operations UI

The Next.js 14 application at `apps/web` provides a live API-backed dashboard for the work-item workflow. It uses the Forge v1.2 CSS foundation copied from `GustaPeruci/forge-design-system/forge/packages/tokens/forge.css`, including semantic light/dark tokens and `fg-*` primitives.

## Local development

1. Start PostgreSQL and apply Prisma migrations.
2. Bootstrap a user and organization with `apps/api/src/identity/bootstrap-owner.ts` as described in `docs/architecture/authentication-plan.md`.
3. Start the API on port 4000 and web app on port 3000.
4. Set `NEXT_PUBLIC_API_URL=http://localhost:4000` for the web app; configure `WEB_ORIGIN=http://localhost:3000` on the API.
5. Log in with the bootstrapped credentials and enter the organization's UUID.

The app keeps the bearer token **in React memory only** (not localStorage or sessionStorage). A reload requires logging in again. API access is scoped to the supplied organization ID and validated server-side by the session and membership guards. The client cannot grant itself permissions.

## Boundaries

The GitHub Pages static demo under `docs/preview` remains separate, using fake in-memory data. GitHub Pages cannot host the live Next.js/API/PostgreSQL stack. This UI uses real API data and requires the local or separately deployed services.

Forge's CSS/tokens are integrated directly for this milestone; React component package consumption remains a separate follow-up, because Forge packages are currently distributed as release tarballs, not on npm.
