# AuraBaseBD Reseller Place

A full-stack SaaS Reseller & Wholesale platform with Admin, Reseller, and Customer roles.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/mockup-sandbox run dev` — run the frontend (port 8081, path `/__mockup`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `SESSION_SECRET` — secret for express-session

## Default Admin Credentials

- Email: `admin@aurabasebd.com`
- Password: `Admin@1234`
- (Auto-seeded on first server start)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + express-session + bcryptjs
- DB: PostgreSQL + Drizzle ORM
- Frontend: React + Vite + Tailwind CSS + Radix UI
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/` — DB tables: users, products, orders, order_items, payments
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `artifacts/api-server/src/routes/` — Express routes (auth, users, products, orders, payments)
- `artifacts/api-server/src/middlewares/requireAuth.ts` — Auth + role middleware
- `artifacts/api-server/src/lib/seed.ts` — Admin user seeding
- `artifacts/mockup-sandbox/src/` — React SPA frontend
  - `context/AuthContext.tsx` — Session auth context
  - `pages/admin/` — Admin dashboard, products, orders, users, payments
  - `pages/reseller/` — Reseller dashboard and orders
  - `pages/customer/` — Customer storefront and orders
  - `components/Layout.tsx` — Sidebar layout shared across all dashboards

## Architecture decisions

- Role-based access enforced on the server via session middleware; each role sees only their data
- express-session with HTTP-only cookie; SESSION_SECRET required at startup
- Admin user auto-seeded on startup if not present
- Frontend is a single React SPA with state-based routing (no react-router dependency needed)
- Products API is public for listing; write operations require admin role
- Manual payment flow: user submits bKash/Nagad/Rocket transaction ID, admin verifies

## Product

**Admin Panel:** Manage products (CRUD), view all orders and update status flow (Pending → Processing → Shipped → Delivered → Cancelled), manage users (all roles), verify/reject manual payments.

**Reseller Dashboard:** View orders assigned to the reseller, see revenue stats.

**Customer Storefront:** Browse products, add to cart, place orders with shipping address, submit payment via bKash/Nagad/Rocket with transaction ID, track order status, cancel pending orders.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm --filter @workspace/db run push` after any schema changes before starting the server
- Run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`
- The `mockup-sandbox` artifact has been repurposed as the main AuraBaseBD frontend
- Support number displayed site-wide: 01858406619
