"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Clock, MailCheck } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import GoldButton from "@/components/GoldButton";

export default function PendingApprovalPage() {
  const router = useRouter();

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-radial-luxury px-6 py-16">
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-radial opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 w-full max-w-lg"
      >
        <GlassCard className="flex flex-col items-center p-10 text-center" hover={false}>
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-imperial/50 bg-imperial/10">
            <Clock className="h-8 w-8 text-imperial" />
          </div>
          <h1 className="gold-text font-heading text-2xl font-semibold sm:text-3xl">
            Application Submitted
          </h1>
          <p className="mt-4 font-body text-sm leading-relaxed text-champagne/65">
            Thank you for registering with Khodiyar Diamonds. Your business
            profile and KYC documents have been received and are now{" "}
            <span className="text-imperial">pending compliance review</span>.
          </p>

          <div className="mt-8 w-full space-y-4 rounded-xl border border-imperial/20 bg-black/25 p-5 text-left">
            <div className="flex items-start gap-3">
              <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-imperial" />
              <p className="font-body text-xs leading-relaxed text-champagne/60">
                Our compliance team typically reviews new applications within
                24&ndash;48 business hours. You&apos;ll be able to sign in
                immediately once your account is approved.
              </p>
            </div>
          </div>

          <GoldButton
            onClick={() => router.push("/auth/login")}
            variant="outline"
            className="mt-10"
          >
            Return to Sign In
          </GoldButton>
        </GlassCard>
      </motion.div>
    </main>
  );
}
