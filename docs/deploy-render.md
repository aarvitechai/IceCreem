# Free Hosting on Render + Neon

Runs Desired Ice Cream at `https://desiredicecream.redstarvibe.com` on free plans that do not expire:

- **Render** runs the website and the API (free web services).
- **Neon** runs the PostgreSQL database (free plan, no expiry).
- **Cloudflare** keeps the domain.

For a paid, always-on production setup, use [deploy-azure.md](deploy-azure.md).

## How it fits together

```mermaid
flowchart LR
    U["Visitor"] --> CF["Cloudflare DNS<br/>desiredicecream.redstarvibe.com"]
    CF --> WEB["Render: desiredicecream-web<br/>Next.js"]
    WEB -- "/api, /hubs, /uploads<br/>(proxied)" --> API["Render: desiredicecream-api<br/>.NET 10"]
    API -- "SSL" --> DB[("Neon<br/>PostgreSQL")]
    GH["GitHub<br/>production branch"] -. "auto deploy on push" .-> WEB
    GH -. "auto deploy on push" .-> API
```

| Piece | Where | Notes |
|---|---|---|
| Website | Render `desiredicecream-web` | Forwards API calls, so visitors see one address |
| API | Render `desiredicecream-api` | Creates tables and starter data on first start |
| Database | Neon project `desired-ice-cream` | PostgreSQL. The API supports SQL Server and PostgreSQL |

Render settings live in [`render.yaml`](../render.yaml) at the repository root.

## Free plan limits

Free plans change from time to time. Check the Render and Neon pricing pages when you sign up.

| Limit | What it means |
|---|---|
| Render services sleep after 15 idle minutes | The first visit after a break takes about 1 minute, then it is fast |
| Neon database sleeps after a few idle minutes | Wakes up in about a second, the API retries by itself |
| Neon free storage is about 0.5 GB | Plenty for products, orders and bookings of a small shop |
| No persistent disk on Render free | Product images uploaded in admin are lost on restart or redeploy. Built in images are fine |

## The order of steps

```mermaid
flowchart TD
    A["1. Neon: create database<br/>copy connection string"] --> B["2. Render: sign up<br/>with GitHub"]
    B --> C["3. Render: New Blueprint<br/>paste connection string + password"]
    C --> D["4. Wait for build<br/>check API health"]
    D --> E["5. Test on<br/>onrender.com address"]
    E --> F["6. Cloudflare: point<br/>desiredicecream to Render"]
    F --> G["7. Render: verify<br/>custom domain"]
```

## Step 1: Create the Neon database

1. Go to https://neon.tech and **Sign up** (GitHub or Google login works, no card).
2. Create a project:

   | Field | Value |
   |---|---|
   | Project name | `desired-ice-cream` |
   | Postgres version | latest offered |
   | Region | **AWS Asia Pacific (Singapore)**, close to Render Singapore |
   | Database name | `neondb` (default is fine) |

3. On the project dashboard click **Connect**.
4. Turn **Connection pooling OFF**. The API runs database migrations on start, which need a direct connection.
5. Copy the connection string. It looks like:

   ```
   postgresql://neondb_owner:npg_xxxxxxxx@ep-xxxx-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```

   Keep it secret. It contains the database password.

You do not create any tables. The API does that on its first start.

## Step 2: Create the Render account

Go to https://render.com → **Get Started** → **Sign up with GitHub**. No card is needed for free services.

## Step 3: Create the services from the Blueprint

1. In Render: **+ New → Blueprint**.
2. **Connect GitHub**. If `aarvitechai/IceCreem` is not listed, click **Configure GitHub** and give Render access to it.
3. Choose the repository, branch **`production`**, Blueprint name `desired-ice-cream`.
4. Render lists two services: `desiredicecream-api` and `desiredicecream-web`.
5. Render asks for two values:

   | Variable | What to enter |
   |---|---|
   | `ConnectionStrings__Default` | the Neon connection string from Step 1 |
   | `Seed__DefaultPassword` | a strong password (8+ characters, a capital letter and a number). This is the first admin password |

6. Click **Apply**.

## Step 4: Wait for the build and check the API

The first build takes 10 to 15 minutes. Watch it in each service under **Events** and **Logs**.

When both show **Live**, open:

```
https://desiredicecream-api.onrender.com/health/ready
```

It should say `Healthy`. In Neon, **Tables** now shows about 22 tables.

If Render gave the API a different address (for example `desiredicecream-api-x7k2.onrender.com`):
open `desiredicecream-web` → **Environment**, set `API_INTERNAL_URL` to that address, then **Save, rebuild and deploy**.

## Step 5: Test on the Render address

Open `https://desiredicecream-web.onrender.com`:

- Home page, products and wedding pages load.
- Log in at `/login` with `superadmin@icecream.local` and your `Seed__DefaultPassword`.
- Place a test order and open the admin Orders page.

## Step 6: Point the domain to Render

Cloudflare → **redstarvibe.com** → **DNS → Records** → edit the `desiredicecream` record:

| Field | Value |
|---|---|
| Type | `CNAME` |
| Name | `desiredicecream` |
| Target | `desiredicecream-web.onrender.com` |
| Proxy status | **DNS only** (grey cloud) |

Grey cloud matters: Render must reach the site directly to create the HTTPS certificate.
If the record pointed to a Cloudflare Tunnel before, edit it; do not add a second one.

## Step 7: Verify the domain in Render

1. `desiredicecream-web` → **Settings → Custom Domains**.
2. Next to `desiredicecream.redstarvibe.com` click **Verify**.
3. After 5 to 10 minutes it shows **Certificate issued**.

`https://desiredicecream.redstarvibe.com` now runs on Render and Neon.

## Two environments: live and test

```mermaid
flowchart LR
    DEV["dev"] -- "merge" --> ST["staging branch"]
    ST -- "auto deploy" --> T["Test site<br/>test-desiredicecream.redstarvibe.com<br/>Neon db: icecream_staging"]
    ST -- "promote after testing" --> PR["production branch"]
    PR -- "auto deploy" --> L["Live site<br/>desiredicecream.redstarvibe.com<br/>Neon db: neondb"]
```

| | Live | Test |
|---|---|---|
| Address | `desiredicecream.redstarvibe.com` | `test-desiredicecream.redstarvibe.com` |
| Branch | `production` | `staging` |
| Render services | `desiredicecream-web`, `desiredicecream-api` | `desiredicecream-web-staging`, `desiredicecream-api-staging` |
| Database (Neon project `desired-ice-cream`) | `neondb` | `icecream_staging` |
| Demo login buttons | Off | On (password `Admin@123`) |
| API docs | Off | `https://desiredicecream-api-staging.onrender.com/scalar/v1` |
| Search engines | Indexed | Blocked (`NEXT_PUBLIC_NOINDEX=true`) |

Test site web settings that differ from live: `API_INTERNAL_URL` points to the staging API,
`NEXT_PUBLIC_SITE_URL=https://test-desiredicecream.redstarvibe.com`, `NEXT_PUBLIC_NOINDEX=true`,
`NEXT_PUBLIC_SHOW_DEMO_LOGINS=true`. Test site API: `Api__EnableDocs=true`, `Seed__DefaultPassword=Admin@123`.

Render free plans allow 2 custom domains per workspace without a payment method.

## CI/CD: push, test, deploy

Every push is tested by GitHub Actions. Render deploys only when those tests pass
(Render setting **Auto-Deploy: After CI checks pass**, `autoDeployTrigger: checksPass` in `render.yaml`).

```mermaid
flowchart LR
    C["git push"] --> CI{"GitHub Actions CI<br/>backend tests<br/>frontend lint, types, build<br/>security audit"}
    CI -- "fail" --> X["No deploy<br/>site stays on last good version"]
    CI -- "pass on staging" --> T["Render deploys<br/>test site"]
    CI -- "pass on production" --> L["Render deploys<br/>live site"]
```

| You push to | CI runs | If CI passes | Site |
|---|---|---|---|
| `feature/*` (pull request) | Yes | Nothing deploys | none |
| `dev` | Yes | Nothing deploys | none |
| `staging` | Yes | Render deploys | test-desiredicecream.redstarvibe.com |
| `production` | Yes | Render deploys | desiredicecream.redstarvibe.com |

What the checks cover (`.github/workflows/ci.yml`):

| Job | Steps |
|---|---|
| Backend | restore, build (warnings are errors), unit and integration tests, vulnerable package check |
| Frontend | install, ESLint, TypeScript, production build, `npm audit` for high severity issues |

### Daily release flow

```bash
git checkout dev && git pull
git checkout -b feature/my-change
# ...work, commit...
git push -u origin feature/my-change      # open a pull request into dev, CI runs

# after merge into dev:
git checkout staging && git pull && git merge dev && git push      # CI, then test site updates
# check the test site, then:
git checkout production && git pull && git merge staging && git push   # CI, then live site updates
```

A deploy takes about 5 minutes for CI plus about 8 minutes for Render.
Watch CI in GitHub **Actions** and the deploy in Render **Events**.

### If something breaks

| Situation | What to do |
|---|---|
| CI failed | Open the failed run in GitHub Actions, fix, push again. The site keeps the last good version |
| Deploy failed on Render | Render keeps the previous version live. Read Render **Logs**, fix, push again |
| Bad version went live | Render → service → **Events** → previous deploy → **Rollback** |

New database migrations run when the API starts.

## Backups

Neon keeps a short restore window on the free plan. For your own copy, run from any PC with PostgreSQL tools:

```bash
pg_dump "<neon connection string>" > desired-ice-cream-backup.sql
```

## Troubleshooting

| Problem | Fix |
|---|---|
| Site takes a minute to open | Normal on the Render free plan after 15 idle minutes |
| API logs: `password authentication failed` | Copy the Neon connection string again and update `ConnectionStrings__Default` in the API **Environment** |
| API logs mention a pooler or lock error | Use the connection string with **Connection pooling OFF** (no `-pooler` in the host name) |
| Website shows "Something went wrong" | API is still waking up, or `API_INTERNAL_URL` is wrong (Step 4) |
| Domain stuck on "Verifying" | Cloudflare record must be **grey cloud** and point to `desiredicecream-web.onrender.com` |
| Logged out on every refresh | Use the `https://` address |
