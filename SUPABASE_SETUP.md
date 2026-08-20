# Khodiyar Diamonds — Supabase Cloud Migration

This project has been changed from browser `localStorage` storage to Supabase Auth, PostgreSQL and Storage.

## 1. Install dependencies

From the project root:

```bash
npm install
```

This installs `@supabase/supabase-js` from `package.json`.

## 2. Create `.env.local`

Copy `.env.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

Do not put a `service_role` key in this Next.js browser application.

## 3. Supabase Auth settings

In Supabase Dashboard:

Authentication → Providers → Email

For the current registration workflow, turn **Confirm email** OFF. The application already has a separate manual KYC/admin approval step.

If you later want email verification, the registration flow should be extended before turning it back on.

## 4. Step 3 SQL

You already ran the main database/RLS SQL from the previous step.

## 5. Step 4 SQL

Open:

`supabase/02_storage_and_marketplace.sql`

Run the entire file once in Supabase SQL Editor.

It does four things:

- adds seller business contact fields to marketplace listings
- creates `diamond-images` public bucket
- creates `kyc-documents` private bucket
- adds Storage RLS policies and patches signup so a public user can never self-assign the `admin` role

## 6. Create the administrator

Supabase Dashboard → Authentication → Users → Add user.

Create the admin email/password manually.

Then run:

```sql
update public.profiles
set
  role = 'admin',
  status = 'APPROVED',
  company_name = 'Khodiyar Diamonds',
  contact_name = 'Administrator'
where email = 'YOUR_ADMIN_EMAIL';
```

Never put the admin password in source code.

## 7. Run locally

```bash
npm run dev
```

Open the local URL shown by Next.js.

Test in this order:

1. Register a buyer with KYC.
2. Confirm the row appears in `profiles` and the files appear in `kyc_documents` / private Storage.
3. Open the admin console at `/sys-admin-kd-7789`.
4. Sign in with the manually created admin.
5. Approve the buyer.
6. Register/approve a seller.
7. Log in as seller and add a diamond with an image.
8. Log in as buyer and confirm the diamond appears.
9. Open the buyer dashboard from another browser/device and confirm the same cloud listing appears.

## 8. Important security model

- Public visitors cannot read the database.
- Pending/rejected accounts cannot access marketplace inventory.
- Approved buyers can read only available diamonds.
- Approved sellers can read available marketplace diamonds and manage only their own diamonds.
- Admin can manage profiles, diamonds and KYC.
- KYC files are private and are opened using short-lived signed URLs.
- Diamond listing images are public because they are marketplace imagery.
- User passwords are handled by Supabase Auth, not by the application database.
- Admin cannot be created through the public signup form.

## 9. Deployment

Push the project to GitHub and import it into Vercel.

Add these Vercel Environment Variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Then deploy.

Do not upload `.env.local` to GitHub.

## 10. Old browser data

The previous localStorage data is intentionally no longer used. Existing browser-only accounts and diamonds do not automatically migrate to Supabase.

If you have real data in the old browser storage that must be preserved, export/migrate it before clearing the old project.
