# FloodWatch Tak

FloodWatch is a multilingual flood operations dashboard for five districts in
Tak Province, Thailand. It combines official government feeds with help
requests, damage assessments, staff-reviewed warnings, and browser push alerts.

## Requirements

- Node.js 22.13 or newer
- npm

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000` after the development server starts.

## Local data

The app creates a SQLite database at `data/floodwatch.sqlite` on first use. Set
`DATABASE_FILENAME` to use a different file inside `data/`. The `data/`
directory and `.env.local` are ignored by Git.

## Environment variables

- `DATABASE_FILENAME`: SQLite file name inside the local `data/` directory.
- `VAPID_PUBLIC_KEY`: public Web Push key.
- `VAPID_PRIVATE_KEY`: matching private Web Push key.
- `VAPID_SUBJECT`: HTTPS URL or `mailto:` contact for Web Push.
- `ALERT_ADMIN_TOKEN`: private token for the alert administration page.
- `CRON_SECRET`: private token for the warning evaluation endpoint.

Generate VAPID keys with `npx web-push generate-vapid-keys` before enabling push
notifications. Keep all private values out of source control.

## Commands

- `npm run dev`: start local development.
- `npm run build`: create a production build.
- `npm start`: run the production build.
- `npm run lint`: check the source with ESLint.

## Operational note

Government feeds may be delayed or unavailable. Treat dashboard flags as
decision support, confirm the latest agency bulletin, and require authorized
staff review before publishing public warnings.
