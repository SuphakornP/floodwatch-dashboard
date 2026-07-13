# FloodWatch Tak

FloodWatch Tak is a multilingual flood operations dashboard for Mae Sot,
Umphang, Tha Song Yang, Mae Ramat, and Phop Phra districts in Tak Province,
Thailand. It combines official data feeds with help requests, damage reports,
staff-reviewed warnings, and browser push notifications.

## Easiest Vercel deployment

[![Deploy with Vercel](https://vercel.com/button)][deploy-with-turso]

This button includes Turso Cloud in the Vercel setup flow. The recipient signs
in, approves the Turso plan and terms, and selects **Deploy**. They do not need
to open the Turso website separately, copy database credentials, or run a
migration command. Start with the
[short deployment guide](docs/QUICK_DEPLOY.md); the
[full handoff guide](docs/VERCEL_DEPLOYMENT_HANDOFF.md) is for maintainers.

This repository is the public, read-only starting source for the handoff. The
deployment flow creates an independent repository in the recipient's GitHub
account or organization. That new repository becomes the source for their
future changes and Vercel deployments; they do not need write access to
`SuphakornP/floodwatch-dashboard`. Changes made here do not automatically sync
to the recipient's copy. Keep this source public until the recipient's copy and
first deployment are complete.

The app deliberately refuses to use a local database file in production
because a Vercel Function cannot preserve that file reliably.

## What the dashboard provides

- English, Burmese, and Thai dashboard content.
- Current weather, rainfall, water-level, road-flood, shelter, and population
  context for the five target districts.
- Map layers using OpenStreetMap and Esri World Imagery.
- Public help-request and damage-assessment forms.
- Staff-created and government-feed-generated warning drafts.
- Staff review before any warning is published.
- District- and language-specific Web Push subscriptions.

The dashboard is decision support, not an emergency dispatch system. Confirm
conditions with the responsible agency before issuing public instructions.

## Data sources

| Source | Data shown | Update behavior |
| --- | --- | --- |
| [Thai Meteorological Department](https://data.tmd.go.th/dataset/index.php) | Three-hour weather observations | Fetched by the server at request time |
| [ThaiWater](https://www.thaiwater.net/) | Water levels and 24-hour rainfall | Fetched by the server at request time |
| [Department of Rural Roads](https://datagov.mot.go.th/dataset/fms2_flood) | Road-flood locations | Historical 2022 dataset, not a live incident feed |
| [Department of Disaster Prevention and Mitigation](https://catalog.disaster.go.th/dataset/dpm-gd002) | Temporary-shelter records | Current catalog resource fetched by the server |
| [Department of Provincial Administration](https://stat.bora.dopa.go.th/new_stat/webPage/statByMooBan.php?month=06&year=69) | District population context | Fixed June 2026 snapshot in the source code |

The server fetches external sources independently, so one unavailable source
does not prevent the remaining sources from being returned. Source URLs and
normalization logic are in
[`app/api/government-data/route.ts`](app/api/government-data/route.ts).
Raw feed responses are not synchronized into the application database. The
evaluator stores only a derived warning draft when a qualifying ThaiWater
observation is found.

## Technology

- Next.js 16 App Router and React 19
- TypeScript and Tailwind CSS 4
- Leaflet for maps
- Node.js Route Handlers for server APIs
- Turso/libSQL for durable Vercel storage, with a local SQLite development file
- Web Push with VAPID authentication

## Local development

### Requirements

- Node.js 22.13 or newer
- npm

### Start the app

```bash
npm install
cp .env.example .env.local
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The copied environment
file contains safe empty placeholders. Add real secrets only for the features
you need to test.

`.env.example` is a committed template and is not loaded by the application.
Next.js loads `.env.local`, which is why the setup step copies the template.

When Turso variables are blank, `npm run dev` and `npm run db:migrate` use
`data/floodwatch.sqlite`. The migration command creates or updates its schema.
Database-backed routes also apply and verify all registered migrations when
first used. Generated database files and `.env.local` are ignored by Git.
Production mode, including `npm start` and Vercel, requires Turso credentials.

The local SQLite file stores application submissions and may contain personal
information; it does not contain the government open-data feeds. Never commit
the database, WAL, or SHM files. See [`data/README.md`](data/README.md) for the
local-data lifecycle and reset instructions.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `TURSO_DATABASE_URL` | Vercel | Remote Turso database URL; injected by the Vercel integration |
| `TURSO_AUTH_TOKEN` | Vercel | Server-only Turso credential; never use a `NEXT_PUBLIC_` prefix |
| `DATABASE_FILENAME` | Local database routes | SQLite file name inside `data/`; local development only |
| `VAPID_PUBLIC_KEY` | Push notifications | Public key returned to subscribed browsers |
| `VAPID_PRIVATE_KEY` | Push notifications | Private key used to sign push messages |
| `VAPID_SUBJECT` | Push notifications | HTTPS URL or `mailto:` contact for the VAPID identity |
| `ALERT_ADMIN_TOKEN` | Staff warning desk | Bearer token for creating, publishing, and expiring warnings |
| `CRON_SECRET` | Automated evaluation | Bearer token for `/api/alerts/evaluate` |

Generate a VAPID key pair when push notifications are needed:

```bash
npx web-push generate-vapid-keys
```

Use long, independently generated values for `ALERT_ADMIN_TOKEN` and
`CRON_SECRET`. Never commit `.env.local`, database files, or real secrets.

## API routes

| Route | Method | Purpose | Access |
| --- | --- | --- | --- |
| `/api/government-data` | `GET` | Normalize external government datasets | Public |
| `/api/health` | `GET` | Verify the database connection and latest schema | Public |
| `/api/help-requests` | `POST` | Record a request for assistance | Public |
| `/api/damage-assessments` | `POST` | Record a field damage assessment | Public |
| `/api/alerts` | `GET` | Return active published warnings | Public |
| `/api/alert-config` | `GET` | Return the public VAPID configuration | Public |
| `/api/alert-subscriptions` | `POST`, `DELETE` | Manage a browser push subscription | Public |
| `/api/alerts-admin` | `GET`, `POST`, `PATCH` | Review and manage warnings | `ALERT_ADMIN_TOKEN` |
| `/api/alerts/evaluate` | `GET`, `POST` | Turn qualifying ThaiWater readings into drafts | `CRON_SECRET` or admin token |

Automated evaluation creates draft warnings only. A staff member must review
and publish a draft before subscribers receive it.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Create a production build |
| `npm start` | Serve the production build; Turso credentials are required |
| `npm run lint` | Run ESLint across the repository |
| `npm run db:migrate` | Apply pending schema migrations to the configured database |

## Data and operational safety

Help requests and damage assessments contain names, phone numbers, precise
locations, and vulnerability information. Before real-world use, define who
may access this data, how long it is retained, how it is backed up, and how a
person can request correction or deletion. Add rate limiting and operational
monitoring before exposing public submission routes.

Upstream feeds may be delayed, incomplete, or unavailable. FloodWatch keeps
warning publication under staff control; preserve that review step in future
changes.

## Vercel deployment

Use the one-click button at the top of this README and visit `/api/health` after
deployment. Complete the remaining environment, security, scheduler,
smoke-test, and rollback steps in
[`docs/VERCEL_DEPLOYMENT_HANDOFF.md`](docs/VERCEL_DEPLOYMENT_HANDOFF.md).

[deploy-with-turso]: https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FSuphakornP%2Ffloodwatch-dashboard&project-name=floodwatch-dashboard&repository-name=floodwatch-dashboard&stores=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22tursocloud%22%2C%22productSlug%22%3A%22database%22%2C%22protocol%22%3A%22storage%22%2C%22allowConnectExistingProduct%22%3Afalse%7D%5D
