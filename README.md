# Khodiyar Diamonds — B2B Trading Portal

Ultra-luxury B2B diamond trading platform built with Next.js 14 (App Router),
TypeScript, Tailwind CSS and Framer Motion.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Routes

| Route | Description |
|---|---|
| `/` | Landing page with diamond-burst intro animation |
| `/portal/select-role` | Buyer / Seller role selection (no admin link) |
| `/auth/login?role=buyer\|seller&tab=login\|register` | Adaptive login + KYC registration |
| `/auth/pending` | Shown after registration, account is `PENDING_APPROVAL` |
| `/buyer/dashboard` | Certified inventory grid with filters (buyer only) |
| `/seller/dashboard` | Single + bulk CSV listing, sales overview (seller only) |
| `/sys-admin-kd-7789` | **Hidden** admin passcode gate — not linked anywhere in the UI |
| `/sys-admin-kd-7789/approvals` | Approval console — review KYC docs, approve/reject accounts |

## Demo admin passcode

The hidden console at `/sys-admin-kd-7789` is gated by a passcode defined in
`lib/store.ts` (`ADMIN_PASSCODE`). Default demo value:

```
Khodiyar@Trident7789
```

**Change this before deploying**, and move it to a server-side check /
environment variable rather than shipping it in client bundle — see
"Production hardening" below.

## Data layer

This build ships with a **client-side mock persistence layer**
(`lib/store.ts`) backed by `localStorage`, so the entire flow — registration,
KYC upload, admin approval, login, inventory — works end-to-end in the
browser with zero backend setup, for demo and design-review purposes.

Diamond inventory is seeded automatically on first load (24 sample certified
stones). Accounts start empty; register a buyer or seller, approve them from
the hidden admin console, then log in.

## Production hardening checklist

Before shipping this to real users, replace the mock layer with:

- A real database (Postgres/Prisma, Supabase, etc.) for accounts and
  inventory instead of `localStorage`.
- Server-side authentication (NextAuth.js or a custom JWT/session flow) with
  hashed passwords — passwords are currently stored in plain text in the mock
  layer, which is **only acceptable for local prototyping**.
- File storage (S3, Cloudflare R2, etc.) for KYC documents instead of
  base64 data URLs.
- Server-side route protection (middleware checking a signed session cookie)
  for `/buyer/*`, `/seller/*` and `/sys-admin-kd-7789/*`, rather than the
  current client-side `useEffect` redirect checks.
- Move the admin passcode to a server-side environment variable and gate the
  admin routes behind real authentication + IP allow-listing if possible.

## Brand tokens

- Imperial Gold `#D4AF37`, Champagne `#F3E5AB`
- Background: `radial-gradient(circle, #18090C 0%, #080506 70%, #000000 100%)`
- Headings: Cinzel — Body/UI: Poppins
