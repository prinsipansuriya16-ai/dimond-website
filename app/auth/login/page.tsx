"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import GlassCard from "@/components/GlassCard";
import GoldButton from "@/components/GoldButton";
import { clearSession, loginAccount } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = (searchParams.get("role") as "buyer" | "seller") || "buyer";
  const [role, setRole] = useState<"buyer" | "seller">(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const result = await loginAccount(email, password);
      if (!result.success || !result.account) {
        setError(result.message);
        return;
      }

      if (result.account.role !== role) {
        await clearSession();
        setError(`This account is registered as a B2B ${result.account.role}. Please select the correct role.`);
        return;
      }

      router.push(role === "buyer" ? "/buyer/dashboard" : "/seller/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-radial-luxury px-6 py-12">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="font-heading text-3xl font-semibold text-champagne">Welcome back</h1>
        <p className="font-body text-xs text-champagne/60">Sign in to access your trading dashboard.</p>

        <div className="grid grid-cols-2 gap-1 rounded-full border border-imperial/30 bg-black/40 p-1">
          {(["buyer", "seller"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRole(item)}
              className={`rounded-full py-2.5 font-heading text-xs font-semibold tracking-wider transition-all ${
                role === item
                  ? "bg-gradient-to-r from-[#FFD700] via-[#D4AF37] to-[#B8860B] text-black shadow-md"
                  : "text-champagne/60 hover:text-champagne"
              }`}
            >
              {item === "buyer" ? "B2B BUYER" : "B2B SELLER"}
            </button>
          ))}
        </div>

        <GlassCard className="p-8 text-left" hover={false}>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1 block font-body text-xs font-medium uppercase tracking-wider text-champagne/60">Registered Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-imperial/25 bg-black/30 px-4 py-3 font-body text-sm text-champagne placeholder:text-champagne/25 focus:border-imperial outline-none" placeholder="name@company.com" required />
            </div>
            <div>
              <label className="mb-1 block font-body text-xs font-medium uppercase tracking-wider text-champagne/60">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-imperial/25 bg-black/30 px-4 py-3 font-body text-sm text-champagne placeholder:text-champagne/25 focus:border-imperial outline-none" placeholder="••••••••" required />
            </div>

            {error && <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 font-body text-xs text-red-300">{error}</div>}

            <GoldButton type="submit" disabled={loading} className="mt-4 w-full">
              {loading ? "SIGNING IN…" : "SIGN IN →"}
            </GoldButton>

            <button type="button" onClick={() => router.push(`/auth/register?role=${role}`)} className="w-full pt-2 font-body text-xs uppercase tracking-wider text-champagne/45 hover:text-imperial">
              New to Khodiyar Diamonds? Create an account
            </button>
          </form>
        </GlassCard>
      </div>
    </main>
  );
}
