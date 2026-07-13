# Deploy FloodWatch in One Flow

Use this guide if you do not write code. You do not need to install SQLite,
open the Turso website separately, copy database credentials, or use a
terminal.

## Deploy

1. Select the button below.
2. Sign in to Vercel and connect your GitHub account when asked.
3. Approve **Turso Cloud**. Choose the free plan if it is available and suitable
   for your use, review the provider terms, and keep the suggested database
   name and region.
4. Select **Deploy** and wait for Vercel to finish.

[![Deploy with Vercel](https://vercel.com/button)][deploy-with-turso]

The flow creates a copy of this public repository in the recipient's GitHub
account and creates a new Turso database for the Vercel project. Vercel supplies
`TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` automatically. The application
creates its database tables on first use.

## Check the result

Open the deployment URL and add `/api/health` to the end. For example:

```text
https://your-project.vercel.app/api/health
```

It is ready when the page shows:

```json
{"status":"ok","database":"connected"}
```

If it returns `503`, open the Vercel project, select **Deployments**, open the
three-dot menu for the latest deployment, and select **Redeploy**. Check the
health URL again after it finishes.

## Let Codex handle the setup

The recipient can open Codex and paste this complete request:

```text
Deploy this GitHub repository to my Vercel account and finish the setup:

https://github.com/SuphakornP/floodwatch-dashboard

Use the GitHub and Vercel accounts that I authorize. Complete these steps:
1. Import or clone the repository into Vercel as a Next.js project.
2. Provision a new Turso Cloud database through the Vercel Marketplace. Use the
   Free plan when available and suitable; ask me before selecting any paid plan.
3. Connect the database to the Production environment. Also connect Preview if
   the project will use preview deployments.
4. Verify that Vercel created TURSO_DATABASE_URL and TURSO_AUTH_TOKEN. Never
   print, copy into source code, or commit either value.
5. Deploy or redeploy the project after the database is connected.
6. Open the production URL followed by /api/health. Continue troubleshooting
   until it returns HTTP 200 with {"status":"ok","database":"connected"}.
7. Return the production URL, health-check result, and a short list of anything
   that still needs a human decision.

Do not use a local SQLite file on Vercel. Do not create a paid resource, accept
provider terms, change DNS, configure a custom domain, enable cron jobs, or
rotate credentials without asking me first. Pause only when I must sign in,
approve permissions, accept terms, or confirm billing; after I approve, continue
until deployment and the health check are complete.
```

Codex can perform the mechanical setup after the recipient signs in to Vercel.
The recipient must personally approve any provider terms or billing decision.

For operational, privacy, optional push-notification, scheduler, and rollback
information, see the [full deployment handoff](VERCEL_DEPLOYMENT_HANDOFF.md).

[deploy-with-turso]: https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FSuphakornP%2Ffloodwatch-dashboard&project-name=floodwatch-dashboard&repository-name=floodwatch-dashboard&stores=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22tursocloud%22%2C%22productSlug%22%3A%22database%22%2C%22protocol%22%3A%22storage%22%2C%22allowConnectExistingProduct%22%3Afalse%7D%5D
