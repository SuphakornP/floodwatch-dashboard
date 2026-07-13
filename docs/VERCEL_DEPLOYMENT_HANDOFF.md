# Vercel Deployment Handoff

This guide is written for the person receiving the GitHub repository. The
initial Vercel deployment does not require them to rewrite the database code.

## Fastest route for a non-programmer

Use the [one-flow deployment guide](QUICK_DEPLOY.md). Its **Deploy with
Vercel** button makes Turso Cloud part of project creation, so the recipient
does not need to visit Turso separately or copy credentials. The remaining
sections below are reference material for a maintainer or operator.

## Handoff status

The project is **technically ready for a Vercel test deployment**. Database
features become ready after Turso is connected and the project is redeployed.
The code now includes:

- A Turso/libSQL database adapter for Vercel Functions
- Local SQLite development through the same adapter
- Explicit failure on Vercel when Turso credentials are missing
- A versioned initial schema migration for all five application tables
- Atomic database batches and duplicate-warning protection
- A public `/api/health` database check
- A Vercel Function region set to Singapore (`sin1`)

It is **not yet approved for collecting real emergency or personal data**.
Before a public operational launch, assign staff who can respond to
submissions and complete the security and operations checklist in this guide.

## Repository

- GitHub: [github.com/SuphakornP/floodwatch-dashboard](https://github.com/SuphakornP/floodwatch-dashboard)
- Production branch: `main`
- Framework: Next.js
- Package manager: npm
- Build command: `npm run build`
- Vercel configuration: [`vercel.json`](../vercel.json)

## What Turso does

Turso is the durable hosted database for Vercel. It stores:

- Help requests
- Damage assessments
- Warning drafts and published warnings
- Browser push subscriptions
- Push-delivery history

Government weather, water, rainfall, road, and shelter data are still fetched
from their official sources. Raw government feeds are not copied into Turso;
only derived warning drafts are stored.

The local `data/floodwatch.sqlite` file is for development only. It is ignored
by Git and is never used as a fallback on Vercel.

## Deploy in Vercel

### 1. Import the repository

1. Sign in to Vercel with the GitHub account that can access the repository.
2. Select **Add New**, then **Project**.
3. Import `SuphakornP/floodwatch-dashboard`.
4. Keep the automatically detected Next.js settings.
5. Allow Vercel to create the project and its initial deployment. Database
   routes may return `503` until Turso is connected.

Expected project settings:

| Setting | Value |
| --- | --- |
| Framework preset | Next.js |
| Root directory | `.` |
| Install command | Default |
| Build command | `npm run build` |
| Output directory | Default |
| Production branch | `main` |
| Function region | Singapore (`sin1`), already set in `vercel.json` |

### 2. Connect Turso Cloud

1. Open the project's **Storage** page or the Vercel Marketplace.
2. Find **Turso Cloud** and select **Install**.
3. Create a Turso database and connect it to this Vercel project.
4. Select the Preview and Production environments that need the database.
5. For a real launch, use separate Preview and Production databases so test
   submissions cannot mix with real records.

The integration should add these variables automatically:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

Confirm both names under **Project Settings > Environment Variables**. Never
paste either value into GitHub, a document, chat, or a variable beginning with
`NEXT_PUBLIC_`.

### 3. Add optional feature secrets

Only the two Turso variables are required for the database and public forms.
The remaining values enable additional features:

| Variable | Needed for | Handling |
| --- | --- | --- |
| `ALERT_ADMIN_TOKEN` | Temporary staff warning desk access | Generate a long random secret and share through a password manager |
| `CRON_SECRET` | Scheduled warning evaluation | Generate a different random secret of at least 16 characters |
| `VAPID_PUBLIC_KEY` | Browser push subscription | Generate with the matching private key |
| `VAPID_PRIVATE_KEY` | Browser push delivery | Keep server-only |
| `VAPID_SUBJECT` | VAPID identity | Use a monitored `mailto:` address or the production HTTPS URL |

Push keys can be generated on a developer machine with:

```bash
npx web-push generate-vapid-keys
```

For a visual test deployment, push and scheduler variables can remain blank.
Do not configure a cron job until its plan, monitoring owner, and response
process are decided.

### 4. Deploy and verify the database

1. Open the Vercel project, select **Deployments**, open the three-dot menu for
   the latest deployment, and select **Redeploy**. Redeploy the same environment
   for which the Turso variables were enabled.
2. Open `https://YOUR-DEPLOYMENT.vercel.app/api/health`.
3. Continue only when it returns HTTP `200` with:

```json
{
  "status": "ok",
  "database": "connected"
}
```

The health request safely applies and verifies all registered migrations. If it
returns `503`, check that both Turso variables are enabled for that deployment
environment, then redeploy. Runtime logs contain the database error but never
intentionally print the credentials.

Developers can explicitly apply the checked-in migration with:

```bash
npm run db:migrate
```

The migration runner reads `.env.local` when present and records applied
migrations in `schema_migrations`. The initial deployment does not require the
non-programmer receiving this repository to run the command manually.

### 5. Deployment smoke test

Use synthetic information only:

- [ ] `/api/health` reports a connected database.
- [ ] The dashboard loads in English, Burmese, and Thai.
- [ ] Government-data source status and timestamps appear.
- [ ] Both map styles load.
- [ ] A clearly labeled test help request returns a reference number.
- [ ] A clearly labeled test damage assessment returns a reference number.
- [ ] A developer or authorized database operator confirms the test records
  exist in Turso and removes them after testing.
- [ ] Records remain after a Vercel redeploy.
- [ ] `/api/alerts-admin` returns `401` without the staff token.
- [ ] Mobile navigation and forms work over HTTPS.

There is currently no staff screen for viewing help requests or damage
assessments. A developer or authorized database operator must verify and remove
test records directly in Turso.

## Optional scheduled warning evaluation

The evaluator at `/api/alerts/evaluate` converts qualifying ThaiWater readings
into staff-review drafts. It never publishes a warning automatically.

Vercel Hobby cron jobs run at most once daily, which is unsuitable for
time-sensitive flood monitoring. If the organization approves a paid plan or
another scheduler, add the cron configuration without removing the existing
Singapore region:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "regions": ["sin1"],
  "crons": [
    {
      "path": "/api/alerts/evaluate",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

The ten-minute interval is an example for a paid plan. Schedules use UTC and
run only on the production deployment. With `CRON_SECRET` configured, Vercel
sends `Authorization: Bearer <secret>` automatically. Vercel does not retry a
failed invocation, so someone must monitor runtime logs.

## Requirements before collecting real submissions

- [ ] Assign staff and a response-time expectation for help requests.
- [ ] Build or provide an authorized workflow for staff to view and update help
  requests and damage assessments.
- [ ] Define database access, retention, correction, deletion, backup, and
  restore procedures.
- [ ] Add rate limiting or equivalent abuse protection to public write routes.
- [ ] Replace the shared `ALERT_ADMIN_TOKEN` with staff identities and roles,
  or formally approve it only for a tightly controlled pilot.
- [ ] Ensure logs and analytics do not capture form bodies, authorization
  headers, push credentials, or database credentials.
- [ ] Test database backup and restoration.
- [ ] Assign owners for upstream-source failures and incorrect warnings.
- [ ] Resolve the existing ESLint findings and add automated tests or explicitly
  document the accepted release risk.

The submitted forms contain names, phone numbers, locations, household
details, and vulnerability information. Do not invite real submissions until
these controls and an actual response workflow exist.

## Known gaps

- A real Turso Cloud connection has not been verified from this local checkout
  because no Turso credentials are stored in the repository. `/api/health` is
  the required deployment check.
- Staff cannot yet list or manage help requests and damage assessments in the
  application.
- Public write routes do not have robust rate limiting.
- The warning desk uses one shared bearer token.
- Push delivery does not yet use a durable outbox, so partial provider or
  logging failures can make delivery status ambiguous.
- The repository has no automated test suite or CI release workflow.
- `npm run lint` has existing UI and government-feed typing findings, although
  `npm run build` succeeds.
- At the July 13, 2026 handoff snapshot, `npm audit --omit=dev` reports two
  moderate advisories through Next.js's bundled PostCSS dependency. Recheck
  for an upstream framework update before public production use.
- The road-flood source is historical, and population values are a fixed June
  2026 snapshot.

## Rollback

1. Disable the cron job first if warning evaluation is involved.
2. Use Vercel to roll back to the last known-good deployment.
3. Keep Turso available and back up data before reversing any schema change.
4. Recheck `/api/health`, public warnings, and forms.
5. Rotate any Turso, cron, admin, or VAPID credential that may have been
   exposed.
6. Record lost or delayed submissions and notify the operational owner.

Vercel Instant Rollback does not automatically change the active cron
configuration. Check it separately.

## Copyable handoff message

> The repository is configured for Next.js on Vercel and Turso Cloud. Import
> the GitHub project, install the Turso Cloud integration, confirm
> `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`, redeploy, and check `/api/health`.
> Do not collect real emergency information until staff access, response
> ownership, privacy, retention, rate limiting, and backup procedures are in
> place. Full instructions are in `docs/VERCEL_DEPLOYMENT_HANDOFF.md`.

## Official references

- [Turso Cloud for Vercel](https://vercel.com/marketplace/tursocloud)
- [Turso Next.js guide](https://docs.turso.tech/sdk/ts/guides/nextjs)
- [Turso TypeScript client reference](https://docs.turso.tech/sdk/ts/reference)
- [Vercel Function filesystem behavior](https://vercel.com/docs/functions/runtimes)
- [Managing Vercel environment variables](https://vercel.com/docs/environment-variables/managing-environment-variables)
- [Managing and securing Vercel Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs)
