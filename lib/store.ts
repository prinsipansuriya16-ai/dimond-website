import { supabase, DIAMOND_IMAGES_BUCKET, KYC_DOCUMENTS_BUCKET } from "./supabase";
import {
  Account,
  AccountStatus,
  DiamondListing,
  KycDocument,
  Role,
  SessionUser
} from "./types";

export interface RegisterInput {
  role: Role;
  companyName: string;
  contactName: string;
  email: string;
  password: string;
  phone: string;
  city: string;
  kycDocuments: File[];
}

export type NewDiamondInput = Omit<
  DiamondListing,
  "id" | "createdAt" | "status" | "sellerId" | "sellerCompany" | "sellerPhone"
> & {
  sellerPhone?: string;
};

interface ProfileRow {
  id: string;
  role: "buyer" | "seller" | "admin";
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  city: string;
  status: AccountStatus;
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
}

interface DiamondRow {
  id: string;
  seller_id: string;
  seller_company: string;
  seller_phone: string;
  stock_number: string;
  shape: DiamondListing["shape"];
  carat: number;
  clarity: DiamondListing["clarity"];
  color: DiamondListing["color"];
  cut: DiamondListing["cut"];
  cert_lab: DiamondListing["certLab"];
  cert_number: string;
  price_per_carat: number;
  location: string;
  fluorescence: string | null;
  measurements: string | null;
  image_url: string | null;
  status: DiamondListing["status"];
  created_at: string;
  seller?: {
    company_name: string;
    phone: string;
  } | null;
}

function mapProfile(row: ProfileRow, kycDocuments: KycDocument[] = []): Account {
  return {
    id: row.id,
    role: row.role,
    companyName: row.company_name,
    contactName: row.contact_name,
    email: row.email,
    phone: row.phone,
    city: row.city,
    status: row.status,
    kycDocuments,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at ?? undefined,
    rejectionReason: row.rejection_reason ?? undefined
  };
}

function mapDiamond(row: DiamondRow): DiamondListing {
  return {
    id: row.id,
    sellerId: row.seller_id,
    sellerCompany: row.seller_company || "Verified Seller",
    sellerPhone: row.seller_phone || "",
    stockNumber: row.stock_number,
    shape: row.shape,
    carat: Number(row.carat),
    clarity: row.clarity,
    color: row.color,
    cut: row.cut,
    certLab: row.cert_lab,
    certNumber: row.cert_number,
    pricePerCarat: Number(row.price_per_carat),
    location: row.location,
    fluorescence: row.fluorescence ?? "None",
    measurements: row.measurements ?? "",
    imageUrl: row.image_url ?? "",
    status: row.status,
    createdAt: row.created_at
  };
}

async function getCurrentProfile(): Promise<ProfileRow | null> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id,role,company_name,contact_name,email,phone,city,status,rejection_reason,reviewed_at,created_at")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (error || !data) return null;
  return data as ProfileRow;
}

/**
 * A public.profiles row for the authenticated user is created
 * automatically by the `handle_new_user` trigger on auth.users
 * (see supabase/03_fix_profile_duplicate_key.sql). The frontend
 * must never INSERT into "profiles" itself — doing so races the
 * trigger and causes:
 *   duplicate key value violates unique constraint "profiles_pkey"
 *
 * This only ever UPDATEs the row the trigger already created, by
 * the authenticated user's id (the primary key). An UPDATE can
 * never violate a uniqueness constraint, so this is safe to call
 * every time registerAccount() runs, including retries.
 */
async function syncProfileFields(userId: string, input: RegisterInput): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({
      role: input.role,
      company_name: input.companyName.trim(),
      contact_name: input.contactName.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      city: input.city.trim()
    })
    .eq("id", userId);

  if (error) throw error;
}

function isAlreadyRegisteredError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const message = "message" in error ? String((error as { message?: unknown }).message ?? "") : "";
  const status = "status" in error ? (error as { status?: unknown }).status : undefined;
  const normalized = message.toLowerCase();
  return (
    normalized.includes("already registered") ||
    normalized.includes("already exists") ||
    normalized.includes("user_already_exists") ||
    status === 422
  );
}

export async function registerAccount(input: RegisterInput): Promise<Account> {
  const email = input.email.trim().toLowerCase();

  const signUpResult = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      data: {
        role: input.role,
        company_name: input.companyName.trim(),
        contact_name: input.contactName.trim(),
        phone: input.phone.trim(),
        city: input.city.trim()
      }
    }
  });

  let user = signUpResult.data.user;
  let session = signUpResult.data.session;

  if (signUpResult.error) {
    // If this email already has an auth account (e.g. the user's
    // first registration attempt succeeded but a later step like
    // the KYC upload failed, and they are retrying), do NOT treat
    // this as a fresh signup — resume the existing account instead
    // of ever attempting to create a second profile row for it.
    if (!isAlreadyRegisteredError(signUpResult.error)) throw signUpResult.error;

    const signInResult = await supabase.auth.signInWithPassword({ email, password: input.password });
    if (signInResult.error || !signInResult.data.user) {
      throw new Error(
        "An account with this email already exists. Sign in instead, or use a different email to register."
      );
    }
    user = signInResult.data.user;
    session = signInResult.data.session;
  }

  if (!user) throw new Error("Account could not be created.");
  if (!session) {
    throw new Error(
      "Your account was created, but Supabase email confirmation is enabled. Disable email confirmation in Supabase Auth settings, then register again."
    );
  }

  // The handle_new_user trigger has already created the profile row
  // by this point (it runs inside the same auth.users insert
  // transaction that signUp() awaits). Sync the submitted business
  // details onto that existing row with an UPDATE — never an INSERT.
  await syncProfileFields(user.id, input);

  const uploadedDocuments: KycDocument[] = [];

  try {
    for (const file of input.kycDocuments) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${user.id}/${crypto.randomUUID()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from(KYC_DOCUMENTS_BUCKET)
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || undefined
        });

      if (uploadError) throw uploadError;

      const label = file.name.includes("pan")
        ? "PAN / Identity Document"
        : file.name.includes("gst")
          ? "GST / Tax Document"
          : "KYC Document";

      const { data: docRow, error: docError } = await supabase
        .from("kyc_documents")
        .insert({
          account_id: user.id,
          document_type: label,
          file_name: file.name,
          storage_path: storagePath
        })
        .select("id,document_type,file_name,storage_path,uploaded_at")
        .single();

      if (docError) throw docError;

      uploadedDocuments.push({
        id: docRow.id,
        label: docRow.document_type,
        fileName: docRow.file_name,
        storagePath: docRow.storage_path,
        uploadedAt: docRow.uploaded_at
      });
    }
  } catch (error) {
    // Do not leave an auth account without its submitted KYC if an upload fails.
    // The user can retry safely after fixing the storage issue; the account stays pending.
    throw error;
  }

  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Account was created, but the profile could not be loaded.");

  return mapProfile(profile, uploadedDocuments);
}

export async function loginAccount(
  email: string,
  password: string
): Promise<{ success: boolean; message: string; account?: Account }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password
  });

  if (error || !data.user) {
    return { success: false, message: error?.message || "Unable to sign in." };
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    await supabase.auth.signOut();
    return { success: false, message: "Your account profile is not available yet. Please try again." };
  }

  const account = mapProfile(profile);

  if (profile.status === "PENDING_APPROVAL") {
    await supabase.auth.signOut();
    return { success: false, message: "Your application is still pending admin approval." };
  }

  if (profile.status === "REJECTED") {
    await supabase.auth.signOut();
    return {
      success: false,
      message: profile.rejection_reason || "Your application was rejected. Contact support for details."
    };
  }

  if (profile.role === "admin") {
    await supabase.auth.signOut();
    return { success: false, message: "Use the administrator console to sign in." };
  }

  return { success: true, message: "Login successful.", account };
}

export async function setSession(_user: SessionUser): Promise<void> {
  // Supabase Auth owns the session. This function remains as a compatibility no-op.
}

export async function getSession(): Promise<SessionUser | null> {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== "APPROVED" || (profile.role !== "buyer" && profile.role !== "seller")) {
    return null;
  }

  return {
    id: profile.id,
    role: profile.role,
    companyName: profile.company_name,
    email: profile.email,
    status: profile.status
  };
}

export async function clearSession(): Promise<void> {
  await supabase.auth.signOut();
}

export async function adminLogin(email: string, password: string): Promise<{ success: boolean; message: string }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password
  });

  if (error || !data.user) {
    return { success: false, message: error?.message || "Invalid administrator credentials." };
  }

  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin" || profile.status !== "APPROVED") {
    await supabase.auth.signOut();
    return { success: false, message: "This account is not authorized for the administrator console." };
  }

  return { success: true, message: "Administrator authenticated." };
}

export async function isAdminAuthed(): Promise<boolean> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return false;
  const profile = await getCurrentProfile();
  return profile?.role === "admin" && profile.status === "APPROVED";
}

export async function adminLogout(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getAccounts(): Promise<Account[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,role,company_name,contact_name,email,phone,city,status,rejection_reason,reviewed_at,created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const profiles = (data ?? []) as ProfileRow[];
  if (profiles.length === 0) return [];

  const ids = profiles.map((profile) => profile.id);
  const { data: docs, error: docsError } = await supabase
    .from("kyc_documents")
    .select("id,account_id,document_type,file_name,storage_path,uploaded_at")
    .in("account_id", ids)
    .order("uploaded_at", { ascending: true });

  if (docsError) throw docsError;

  const docsByAccount = new Map<string, KycDocument[]>();
  for (const doc of docs ?? []) {
    const current = docsByAccount.get(doc.account_id) ?? [];
    current.push({
      id: doc.id,
      label: doc.document_type,
      fileName: doc.file_name,
      storagePath: doc.storage_path,
      uploadedAt: doc.uploaded_at
    });
    docsByAccount.set(doc.account_id, current);
  }

  return profiles.map((profile) => mapProfile(profile, docsByAccount.get(profile.id) ?? []));
}

export async function getPendingAccounts(): Promise<Account[]> {
  const accounts = await getAccounts();
  return accounts.filter((account) => account.status === "PENDING_APPROVAL");
}

export async function getAccountByEmail(email: string): Promise<Account | undefined> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,role,company_name,contact_name,email,phone,city,status,rejection_reason,reviewed_at,created_at")
    .ilike("email", email.trim())
    .maybeSingle();

  if (error || !data) return undefined;
  return mapProfile(data as ProfileRow);
}

export async function approveAccount(id: string): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({
      status: "APPROVED",
      reviewed_at: new Date().toISOString(),
      rejection_reason: null
    })
    .eq("id", id);

  if (error) throw error;
}

export async function rejectAccount(id: string, reason: string): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({
      status: "REJECTED",
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason.trim()
    })
    .eq("id", id);

  if (error) throw error;
}

export async function getDiamonds(): Promise<DiamondListing[]> {
  const { data, error } = await supabase
    .from("diamonds")
    .select(`
      id,
      seller_id,
      stock_number,
      shape,
      carat,
      clarity,
      color,
      cut,
      cert_lab,
      cert_number,
      price_per_carat,
      location,
      fluorescence,
      measurements,
      image_url,
      status,
      created_at,
      seller_company,
      seller_phone
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as unknown as DiamondRow[]).map(mapDiamond);
}

export async function getDiamondsBySeller(sellerId: string): Promise<DiamondListing[]> {
  const { data, error } = await supabase
    .from("diamonds")
    .select(`
      id,
      seller_id,
      stock_number,
      shape,
      carat,
      clarity,
      color,
      cut,
      cert_lab,
      cert_number,
      price_per_carat,
      location,
      fluorescence,
      measurements,
      image_url,
      status,
      created_at,
      seller_company,
      seller_phone
    `)
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as unknown as DiamondRow[]).map(mapDiamond);
}

async function uploadDiamondImage(file: File, sellerId: string): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${sellerId}/${crypto.randomUUID()}-${safeName}`;

  const { error } = await supabase.storage
    .from(DIAMOND_IMAGES_BUCKET)
    .upload(path, file, {
      cacheControl: "31536000",
      upsert: false,
      contentType: file.type || "image/jpeg"
    });

  if (error) throw error;

  const { data } = supabase.storage.from(DIAMOND_IMAGES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function addDiamond(
  input: NewDiamondInput,
  sellerId: string,
  _sellerCompany: string,
  imageFile?: File | null
): Promise<DiamondListing> {
  let imageUrl = input.imageUrl || "";
  if (imageFile) imageUrl = await uploadDiamondImage(imageFile, sellerId);

  const { data, error } = await supabase
    .from("diamonds")
    .insert({
      seller_id: sellerId,
      seller_company: _sellerCompany,
      seller_phone: input.sellerPhone?.trim() || "",
      stock_number: input.stockNumber,
      shape: input.shape,
      carat: input.carat,
      clarity: input.clarity,
      color: input.color,
      cut: input.cut,
      cert_lab: input.certLab,
      cert_number: input.certNumber,
      price_per_carat: input.pricePerCarat,
      location: input.location,
      fluorescence: input.fluorescence,
      measurements: input.measurements,
      image_url: imageUrl || null,
      status: "AVAILABLE"
    })
    .select(`
      id,
      seller_id,
      stock_number,
      shape,
      carat,
      clarity,
      color,
      cut,
      cert_lab,
      cert_number,
      price_per_carat,
      location,
      fluorescence,
      measurements,
      image_url,
      status,
      created_at,
      seller_company,
      seller_phone
    `)
    .single();

  if (error) throw error;
  return mapDiamond(data as unknown as DiamondRow);
}

export async function addBulkDiamonds(
  inputs: NewDiamondInput[],
  sellerId: string,
  _sellerCompany: string
): Promise<DiamondListing[]> {
  const rows = inputs.map((input) => ({
    seller_id: sellerId,
    seller_company: _sellerCompany,
    seller_phone: input.sellerPhone?.trim() || "",
    stock_number: input.stockNumber,
    shape: input.shape,
    carat: input.carat,
    clarity: input.clarity,
    color: input.color,
    cut: input.cut,
    cert_lab: input.certLab,
    cert_number: input.certNumber,
    price_per_carat: input.pricePerCarat,
    location: input.location,
    fluorescence: input.fluorescence,
    measurements: input.measurements,
    image_url: input.imageUrl || null,
    status: "AVAILABLE" as const
  }));

  const { data, error } = await supabase
    .from("diamonds")
    .insert(rows)
    .select(`
      id,
      seller_id,
      stock_number,
      shape,
      carat,
      clarity,
      color,
      cut,
      cert_lab,
      cert_number,
      price_per_carat,
      location,
      fluorescence,
      measurements,
      image_url,
      status,
      created_at,
      seller_company,
      seller_phone
    `);

  if (error) throw error;
  return ((data ?? []) as unknown as DiamondRow[]).map(mapDiamond);
}

export async function getKycDocumentUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(KYC_DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, 300);

  if (error) throw error;
  return data.signedUrl;
}
