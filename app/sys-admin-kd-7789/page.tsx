"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, ShieldAlert } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import { adminLogin } from "@/lib/store";

export default function AdminGatePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await adminLogin(email, password);
      if (!result.success) {
        setError(result.message);
        return;
      }
      router.push("/sys-admin-kd-7789/approvals");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to authenticate.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-radial-luxury px-6">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="w-full max-w-sm">
        <GlassCard className="p-8 text-center" hover={false}>
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-imperial/50 bg-imperial/10">
            <Lock className="h-6 w-6 text-imperial" />
          </div>
          <h1 className="font-heading text-xl font-semibold text-champagne">Restricted Access</h1>
          <p className="mt-2 font-body text-xs text-champagne/50">Administrator console. Supabase Auth protected.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4 text-left">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-imperial/25 bg-black/30 px-4 py-2.5 font-body text-sm text-champagne outline-none" placeholder="admin@company.com" required />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-imperial/25 bg-black/30 px-4 py-2.5 font-body text-sm text-champagne outline-none" placeholder="Password" required />
            {error && <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 font-body text-xs text-red-300"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}
            <button type="submit" disabled={loading} className="mt-4 w-full rounded-full border border-white bg-gradient-to-r from-[#FFD700] via-[#D4AF37] to-[#B8860B] py-3 font-heading text-sm font-bold text-black shadow-[0_0_20px_rgba(212,175,55,0.6)] transition-all hover:scale-[1.02] disabled:opacity-50">
              {loading ? "AUTHENTICATING…" : "AUTHENTICATE"}
            </button>
          </form>
        </GlassCard>
      </motion.div>
    </main>
  );
}
