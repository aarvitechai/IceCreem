# Scoop Factory: Ice Cream Factory Management Platform

One platform for an ice cream factory: online shop, wedding and event bookings, orders with live tracking,
raw material and production, hawker (street vendor) accounts, delivery app and role based dashboards.

The full product plan is in [docs/PLAN.md](docs/PLAN.md).

## Tech stack

| Layer | Choice |
|---|---|
| Backend | .NET 10, ASP.NET Core Web API, Clean Architecture (Domain, Application, Infrastructure, Api) |
| Data | SQL Server, EF Core 10 (migrations, soft delete, audit log, filtered unique indexes) |
| Auth | JWT access token (15 min, memory only) + rotating refresh token (7 days, httpOnly cookie, hashed in DB) |
| Realtime | SignalR hub for order status and rider location |
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Redux Toolkit + RTK Query, React Hook Form + Zod, Swiper, Recharts |
| Ops | Docker, Nginx, GitHub Actions (build, test, audit, images to GHCR) |

## Features

| Area | What works |
|---|---|
| Storefront | Hero carousel, categories, featured slider, filters and search, product gallery with zoom, cart, coupons, checkout (cash or UPI on delivery) |
| Live tracking | Status timeline, delivery OTP, rider live map over SignalR |
| Weddings | Package pages, capacity calendar, 4 step enquiry, quote, accept, 30 percent advance, balance, close |
| Orders | Flow Placed, Confirmed, In production, Packed, Out for delivery, Delivered. Stock reserved on confirm, released on cancel, deducted on delivery |
| Inventory | Raw material ledger with low stock alerts, finished goods stock, manual adjustment |
| Production | Recipe (BOM) per pack, batch plan, start (auto deducts raw material), complete (adds finished stock) |
| Hawkers | Daily stock issue at wholesale rate, credit limit block, settlement (sold + returned + damaged = issued), commission, dues |
| Delivery app | Assigned tasks, pickup, call, navigate, GPS sharing every 15 seconds, OTP to deliver |
| Dashboards | KPI cards, revenue trend, top products, category sales, order status, live new order alerts |
| Super admin | Users and roles, activate or lock, audit log of every change |
| Security | Role policies, rate limits, account lockout, refresh token reuse detection, security headers, validation on every input |

## Run locally (no Docker)

Needs .NET SDK 10, Node 24 and SQL Server (local instance with Windows login).

```bash
# 1. API on http://localhost:5080 (creates the database and demo data on first run)
cd backend
dotnet run --project src/IceCream.Api --launch-profile http

# 2. Web on http://localhost:3100
cd frontend
npm ci
npm run dev -- -p 3100
```

API docs: http://localhost:5080/scalar/v1

The local connection string is in `backend/src/IceCream.Api/appsettings.Development.json`.
Change `Server=localhost` if your SQL Server has a different name.

## Deploy to Azure

Step by step guide with diagrams: [docs/deploy-azure.md](docs/deploy-azure.md).
One command from Azure Cloud Shell: `APP_ENV=staging bash deploy/azure/deploy.sh`.

## Run with Docker (full stack)

```bash
cp .env.example .env      # set strong DB_PASSWORD and JWT_KEY
docker compose up -d --build
# open http://localhost:8080
```

Nginx serves everything on one origin: `/api`, `/hubs`, `/uploads` go to the API, the rest to Next.js.
For a public server put HTTPS in front (the refresh cookie is `Secure` outside development).

## Demo accounts

Created on first start when a seed password is set. Password for all: `Admin@123`

| Role | Login | Lands on |
|---|---|---|
| Super admin | superadmin@icecream.local | /admin (plus users and audit) |
| Admin | admin@icecream.local | /admin |
| Staff | staff@icecream.local | /admin (orders, inventory, production, hawkers) |
| Delivery | delivery@icecream.local | /delivery |
| Hawker | hawker@icecream.local | /hawker |
| Customer | customer@icecream.local | /account/orders |

Coupons: `WELCOME10` (10 percent above Rs 300, max Rs 100) and `FLAT50` (Rs 50 above Rs 500).

### Try the full order flow

1. Shop as a guest or customer, place an order.
2. Admin: Orders, open it, Mark confirmed, Mark packed, assign rider.
3. Customer: the tracking page updates live and shows the OTP.
4. Delivery: Picked up, then enter the OTP, Mark delivered.

## Tests

```bash
cd backend && dotnet test                         # 22 unit + 9 integration tests
cd frontend && npx eslint src && npx tsc --noEmit && npm run build
```

## Project structure

```
backend/
  src/IceCream.Domain          Entities and business rules (no dependencies)
  src/IceCream.Application     Feature services, DTOs, validators, interfaces
  src/IceCream.Infrastructure  EF Core, migrations, JWT, password hashing, file storage, seed
  src/IceCream.Api             Controllers, SignalR hub, middleware, Program.cs
  tests/                       Unit tests (domain rules) and integration tests (real HTTP pipeline)
frontend/
  src/app                      Routes: (shop), admin, hawker, delivery
  src/features                 RTK Query endpoints per area
  src/components               UI, layout, product, order, booking, admin pieces
  src/store                    Redux store, auth, cart, API base with silent refresh
deploy/nginx.conf              Reverse proxy
.github/workflows/ci.yml       CI pipeline
```

### Design choices

| Choice | Why |
|---|---|
| Feature services instead of MediatR and AutoMapper | Both libraries are now commercial. Plain services and hand mapping are simpler to read and debug |
| DbContext as unit of work, no repository layer | EF Core DbSet already is a repository. One less layer to maintain |
| Business rules on entities | Order, Booking, Batch and Hawker rules are unit tested without a database |
| Same origin for browser and API | Refresh cookie stays first party, no CORS, SignalR works through one proxy |
| SEO pages server rendered, admin pages client rendered | Product pages are indexable; admin screens are fast and interactive |

## Branches and releases

| Branch | Purpose |
|---|---|
| `feature/*` | One feature per branch, merged into `dev` |
| `dev` | Integration. CI runs on every push |
| `staging` | Release candidate. CI publishes `:staging` images |
| `production` | Live release. CI publishes `:production` images |
| `main` | Mirror of production for the default branch |

Promotion flow: `feature/*` to `dev` to `staging` to `production` to `main`.

## Not included yet

These need external accounts or business decisions (see Open Questions in the plan):

- Online payment (Razorpay) and webhooks. Cash or UPI on delivery works today.
- SMS, WhatsApp and email notifications, mobile OTP login.
- PDF invoices and Excel exports.
- Redis backplane for running more than one API instance, Hangfire jobs.
- Cloud blob storage for uploads (swap `LocalFileStorage` for an Azure Blob or S3 implementation).
