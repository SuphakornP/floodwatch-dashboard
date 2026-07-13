# Deploy FloodWatch in One Flow

Use this guide if you do not write code. You do not need to install SQLite,
open the Turso website separately, copy database credentials, or use a
terminal.

The original repository is only the starting source:

```text
https://github.com/SuphakornP/floodwatch-dashboard
```

The recipient will create and own a separate GitHub repository, Vercel project,
and Turso database. They do not need write access to the original repository.
The original must remain public until the copy and first deployment finish.

## Deploy

1. Select the button below.
2. Sign in to Vercel and connect the GitHub account or organization that will
   own the new repository.
3. Choose the destination GitHub account and a name for the new repository.
4. Approve **Turso Cloud**. Choose the free plan if it is available and suitable
   for your use, review the provider terms, and keep the suggested database
   name and region.
5. Select **Deploy** and wait for Vercel to finish.

[![Deploy with Vercel](https://vercel.com/button)][deploy-with-turso]

The flow creates a copy of this public repository in the recipient's GitHub
account and creates a new Turso database for the Vercel project. Vercel supplies
`TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` automatically. The application
creates its database tables on first use.

## Confirm ownership

Before considering the handoff complete, confirm all five items:

- The new GitHub repository URL belongs to the recipient's account or
  organization.
- **Vercel > Project Settings > Git** points to the recipient's new repository,
  not `SuphakornP/floodwatch-dashboard`.
- The Turso database is owned through the recipient's Vercel scope.
- A push to the new repository's `main` branch creates a Vercel deployment.
- Codex has replaced the source GitHub URL in `README.md`, deployment buttons,
  and handoff documents with the recipient's new repository URL, then committed
  those changes to the recipient's repository only.

The two repositories are independent after the copy. Future changes to the
original repository are not added to the recipient's repository automatically,
and the recipient's deployment does not depend on continued write access to it.

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
Use this GitHub repository only as the read-only starting source:

https://github.com/SuphakornP/floodwatch-dashboard

Create a fully independent handoff under the GitHub and Vercel accounts that I
authorize. Do not request write access to the source repository and do not push
or open a pull request there. Complete these steps:

1. Read the latest main branch from the source repository.
2. Create a new repository in the GitHub account or organization that I
   authorize. Ask me to confirm its owner, name, and visibility before creating
   it.
3. Copy the project into the new repository, use main as its production branch,
   and make the new repository the Git origin. The SuphakornP repository must
   not remain the origin used for pushes or deployments.
4. Update every hard-coded repository URL in README.md and docs to the new
   GitHub URL, including the repository-url value in the Deploy with Vercel
   button. Commit and push those ownership updates only to the new repository.
5. Create a Vercel Next.js project connected to the new repository. Confirm that
   future pushes to its main branch trigger Vercel deployments.
6. Provision a new Turso Cloud database through the Vercel Marketplace. Use the
   Free plan when available and suitable; ask me before selecting any paid plan.
7. Connect the database to the Production environment. Also connect Preview if
   the project will use preview deployments.
8. Verify that Vercel created TURSO_DATABASE_URL and TURSO_AUTH_TOKEN. Never
   print, copy into source code, or commit either value.
9. Deploy or redeploy the project after the database is connected.
10. Open the production URL followed by /api/health. Continue troubleshooting
   until it returns HTTP 200 with {"status":"ok","database":"connected"}.
11. Return the new GitHub repository URL, production URL, health-check result,
    and a short list of anything that still needs a human decision.

Do not use a local SQLite file on Vercel. Do not create a paid resource, accept
provider terms, change DNS, configure a custom domain, enable cron jobs, or
rotate credentials without asking me first. Do not change or delete the original
SuphakornP repository. Pause only when I must sign in, approve permissions,
accept terms, or confirm billing; after I approve, continue until the independent
repository, deployment, and health check are complete.
```

Codex can perform the mechanical setup after the recipient signs in to Vercel.
The recipient must personally approve any provider terms or billing decision.

For operational, privacy, optional push-notification, scheduler, and rollback
information, see the [full deployment handoff](VERCEL_DEPLOYMENT_HANDOFF.md).

[deploy-with-turso]: https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FSuphakornP%2Ffloodwatch-dashboard&project-name=floodwatch-dashboard&repository-name=floodwatch-dashboard&stores=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22tursocloud%22%2C%22productSlug%22%3A%22database%22%2C%22protocol%22%3A%22storage%22%2C%22allowConnectExistingProduct%22%3Afalse%7D%5D
