# Local Database Files

This directory exists in Git only to explain local database behavior. The
database files themselves are generated and must not be committed.

During `npm run dev`, the application uses `data/floodwatch.sqlite` only when
`TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are not configured. SQLite may also
create these companion files while the local server is running:

- `floodwatch.sqlite-wal`
- `floodwatch.sqlite-shm`

These files can contain help requests, damage assessments, warning records,
push subscriptions, names, phone numbers, and locations. Deleted records may
also remain recoverable inside a database or WAL file. Never commit or share
them, even when the visible tables appear empty.

Government weather, water, road, shelter, and population sources are not stored
in this SQLite file. The server fetches those open-data sources separately.

Vercel production deployments do not use this directory. They require the
recipient's Turso database. The application applies the checked-in migrations
to Turso automatically when a database-backed route is first used.

To reset local development data, stop the development server before deleting
`floodwatch.sqlite`, `floodwatch.sqlite-wal`, and `floodwatch.sqlite-shm`. Run
`npm run db:migrate` or restart the development server to create a fresh local
database.
