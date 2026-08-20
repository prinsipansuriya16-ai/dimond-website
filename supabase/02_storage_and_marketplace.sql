-- =========================================================
-- KHODIYAR DIAMONDS - STEP 4
-- STORAGE + MARKETPLACE CONTACT FIELDS + STORAGE RLS
-- Run this AFTER your Step 3 SQL.
-- =========================================================

-- ---------------------------------------------------------
-- 1. Marketplace seller contact snapshot
-- ---------------------------------------------------------
-- We intentionally keep only business-facing seller details on
-- each listing. This prevents buyers from needing SELECT access
-- to the private profiles table just to render WhatsApp contact.

alter table public.diamonds
  add column if not exists seller_company text not null default '',
  add column if not exists seller_phone text not null default '';

-- ---------------------------------------------------------
-- 2. Storage buckets
-- ---------------------------------------------------------
-- Diamond images are intentionally public because they are
-- marketplace listing images. KYC remains private.

insert into storage.buckets (id, name, public)
values
  ('diamond-images', 'diamond-images', true),
  ('kyc-documents', 'kyc-documents', false)
on conflict (id) do update
set public = excluded.public;

-- ---------------------------------------------------------
-- 3. Remove old policies if this script is re-run
-- ---------------------------------------------------------

drop policy if exists "diamond_images_public_read" on storage.objects;
drop policy if exists "diamond_images_seller_insert" on storage.objects;
drop policy if exists "diamond_images_seller_update" on storage.objects;
drop policy if exists "diamond_images_seller_delete" on storage.objects;

drop policy if exists "kyc_user_insert_own" on storage.objects;
drop policy if exists "kyc_user_read_own" on storage.objects;
drop policy if exists "kyc_user_delete_own" on storage.objects;
drop policy if exists "kyc_admin_read_all" on storage.objects;
drop policy if exists "kyc_admin_delete_all" on storage.objects;

-- ---------------------------------------------------------
-- 4. DIAMOND IMAGES
-- ---------------------------------------------------------

-- Anyone can view marketplace images. The actual database
-- listing rows remain protected by diamonds RLS.
create policy "diamond_images_public_read"
on storage.objects
for select
to public
using (
  bucket_id = 'diamond-images'
);

-- Approved sellers may upload only into their own folder:
-- diamond-images/<their-auth-user-id>/<file>
create policy "diamond_images_seller_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'diamond-images'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.is_approved_seller()
);

create policy "diamond_images_seller_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'diamond-images'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.is_approved_seller()
)
with check (
  bucket_id = 'diamond-images'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.is_approved_seller()
);

create policy "diamond_images_seller_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'diamond-images'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.is_approved_seller()
);

-- ---------------------------------------------------------
-- 5. KYC DOCUMENTS - PRIVATE
-- ---------------------------------------------------------

-- A buyer/seller can upload only into their own folder.
create policy "kyc_user_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'kyc-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- User can see only their own KYC files.
create policy "kyc_user_read_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'kyc-documents'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
  )
);

create policy "kyc_user_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'kyc-documents'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
  )
);

create policy "kyc_admin_read_all"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'kyc-documents'
  and public.is_admin()
);

create policy "kyc_admin_delete_all"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'kyc-documents'
  and public.is_admin()
);

-- ---------------------------------------------------------
-- 6. Optional data backfill
-- ---------------------------------------------------------
-- If diamonds already exist in Supabase, this copies seller
-- business fields from profiles into each listing.

update public.diamonds d
set
  seller_company = coalesce(p.company_name, ''),
  seller_phone = coalesce(p.phone, '')
from public.profiles p
where p.id = d.seller_id
  and (d.seller_company = '' or d.seller_phone = '');

-- ---------------------------------------------------------
-- 7. SECURITY PATCH: NEVER TRUST CLIENT-SUPPLIED ADMIN ROLE
-- ---------------------------------------------------------
-- The signup form is public, so the trigger must only create
-- buyer/seller accounts. Admin is assigned manually by you.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    role,
    company_name,
    contact_name,
    email,
    phone,
    city,
    status
  )
  values (
    new.id,
    case
      when lower(coalesce(new.raw_user_meta_data ->> 'role', 'buyer')) = 'seller'
        then 'seller'::public.user_role
      else 'buyer'::public.user_role
    end,
    coalesce(new.raw_user_meta_data ->> 'company_name', ''),
    coalesce(new.raw_user_meta_data ->> 'contact_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'city', ''),
    'PENDING_APPROVAL'
  );

  return new;
end;
$$;
