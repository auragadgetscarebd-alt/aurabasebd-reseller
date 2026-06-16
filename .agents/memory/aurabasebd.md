---
name: AuraBaseBD Platform
description: Architecture decisions and gotchas for the AuraBaseBD Reseller Place platform.
---

## Key decisions

- The `mockup-sandbox` artifact (kind: design, path `/__mockup`) was repurposed as the main React SPA frontend. Its App.tsx was completely replaced.
- Auth: express-session + bcryptjs. No JWT. SESSION_SECRET env var required at startup or server throws.
- Admin user is auto-seeded to `admin@aurabasebd.com` / `Admin@1234` on first boot via `src/lib/seed.ts`.
- Frontend uses simple React state-based routing (no react-router-dom). Page is a `useState` string in each role-specific App sub-component.
- API base URL in frontend is `/api` (absolute path, works via the shared proxy).
- Fetch calls use `credentials: "include"` for session cookies.

**Why:** Kept dependencies minimal; state routing avoids hash/history complexity in an iframe-proxied environment.

**How to apply:** Adding a new page = add nav item + conditional render in the role App component in `App.tsx`.

## Payment flow

Manual only: bKash, Nagad, Rocket. Customer submits transaction ID + amount → status `pending`. Admin reviews and sets `verified` or `rejected`. No automated payment gateway.

## Role permissions

- `admin`: full access to everything
- `reseller`: sees only orders where resellerId = their userId
- `customer`: sees only their own orders/payments; can only cancel (not change status otherwise)
- Products listing is public (no auth required); write ops require admin
