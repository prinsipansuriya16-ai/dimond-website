"use client";

import { ChangeEvent, FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, UploadCloud } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import GoldButton from "@/components/GoldButton";
import { registerAccount } from "@/lib/store";
import { Role } from "@/lib/types";

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = (searchParams.get("role") as Role) === "seller" ? "seller" : "buyer";
  const [role, setRole] = useState<Role>(initialRole);
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [documents, setDocuments] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleDocuments(event: ChangeEvent<HTMLInputElement>) {
    setDocuments(Array.from(event.target.files ?? []));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (loading) return; // guard against double-submit (double click / repeated Enter)
    setError("");
    if (documents.length === 0) {
      setError("Please upload at least one KYC document.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      await registerAccount({ role, companyName, contactName, email, password, phone, city, kycDocuments: documents });
      router.push("/auth/pending");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-radial-luxury px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <p className="font-body text-xs uppercase tracking-[0.4em] text-imperial">Step 2 of 3</p>
          <h1 className="mt-3 gold-text font-heading text-3xl font-semibold sm:text-5xl">Trade Account Registration</h1>
          <p className="mx-auto mt-4 max-w-2xl font-body text-sm text-champagne/60">Submit your business details and KYC. Every application is reviewed before marketplace access.</p>
        </div>

        <GlassCard className="p-8" hover={false}>
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-full border border-imperial/30 bg-black/40 p-1">
            {(["buyer", "seller"] as const).map((item) => (
              <button key={item} type="button" onClick={() => setRole(item)} className={`rounded-full py-2.5 font-heading text-xs font-semibold tracking-wider ${role === item ? "bg-gradient-to-r from-[#FFD700] via-[#D4AF37] to-[#B8860B] text-black" : "text-champagne/60"}`}>
                {item === "buyer" ? "B2B BUYER" : "B2B SELLER"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
            <Field label="Company Name" value={companyName} onChange={setCompanyName} required />
            <Field label="Contact Person" value={contactName} onChange={setContactName} required />
            <Field label="Business Email" value={email} onChange={setEmail} type="email" required />
            <Field label="Phone / WhatsApp" value={phone} onChange={setPhone} required />
            <Field label="City" value={city} onChange={setCity} required />
            <Field label="Password" value={password} onChange={setPassword} type="password" required />

            <div className="sm:col-span-2 rounded-xl border border-imperial/20 bg-black/20 p-5">
              <div className="flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-imperial" />
                <div>
                  <p className="font-heading text-sm font-semibold text-champagne">KYC Documents</p>
                  <p className="font-body text-xs text-champagne/45">Upload KYC Documents (Aadhaar Card / PAN Card)</p>
                </div>
              </div>
              <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleDocuments} className="mt-4 block w-full text-xs text-champagne/60 file:mr-4 file:rounded-full file:border file:border-imperial/30 file:bg-imperial/10 file:px-4 file:py-2 file:text-xs file:text-imperial" />
              {documents.length > 0 && <div className="mt-4 space-y-2">{documents.map((file) => <div key={`${file.name}-${file.lastModified}`} className="flex items-center gap-2 text-xs text-champagne/65"><FileText className="h-4 w-4 text-imperial" />{file.name}</div>)}</div>}
            </div>

            {error && <div className="sm:col-span-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">{error}</div>}

            <div className="sm:col-span-2 flex flex-wrap gap-3 pt-2">
              <GoldButton type="submit" disabled={loading}>{loading ? "SUBMITTING…" : "SUBMIT APPLICATION"}</GoldButton>
              <GoldButton type="button" variant="outline" onClick={() => router.push("/auth/login")}>Back to Sign In</GoldButton>
            </div>
          </form>
        </GlassCard>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block font-body text-xs font-medium uppercase tracking-wider text-champagne/60">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} className="w-full rounded-lg border border-imperial/25 bg-black/30 px-4 py-3 font-body text-sm text-champagne outline-none focus:border-imperial" />
    </label>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterPageContent />
    </Suspense>
  );
}