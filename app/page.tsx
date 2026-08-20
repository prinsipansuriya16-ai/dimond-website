"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Gem, ShieldCheck, Sparkles } from "lucide-react";
import DiamondIntro from "@/components/DiamondIntro";
import GoldButton from "@/components/GoldButton";
import GlassCard from "@/components/GlassCard";

export default function LandingPage() {
  const router = useRouter();
  const [introDone, setIntroDone] = useState(false);

  const highlights = [
    {
      icon: ShieldCheck,
      title: "Verified Trade Network",
      description:
        "Every buyer and seller passes a manual KYC review before a single carat changes hands."
    },
    {
      icon: Gem,
      title: "GIA / IGI Certified Stock",
      description:
        "Browse live, lab-certified inventory sourced directly from Surat's finest cutting houses."
    },
    {
      icon: Sparkles,
      title: "Discreet, Direct Dealing",
      description:
        "Negotiate carat-for-carat with verified counterparties, without a public marketplace."
    }
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-radial-luxury">
      {!introDone && <DiamondIntro onComplete={() => setIntroDone(true)} />}

      {/* Background glow layers moved to z-0 so they never obscure interactive elements */}
      <div className="pointer-events-none absolute -top-40 left-1/2 z-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-gold-radial opacity-30 blur-2xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 z-0 h-[400px] w-[400px] translate-x-1/3 translate-y-1/3 rounded-full bg-gold-radial opacity-20 blur-2xl" />

      {introDone && (
        <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center px-6 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="gold-shimmer-sweep relative mb-8 h-28 w-28 overflow-hidden rounded-full border-2 border-imperial shadow-gold animate-float"
          >
            <Image
              src="/logo.jpg"
              alt="Khodiyar Diamonds crest"
              fill
              sizes="112px"
              className="object-cover"
              priority
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.7 }}
            className="mb-3 font-body text-xs uppercase tracking-[0.5em] text-imperial"
          >
            Est. Surat &middot; Global B2B Diamond Trade
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.8 }}
            className="gold-text font-heading text-4xl font-semibold leading-tight sm:text-6xl md:text-7xl"
          >
            Khodiyar Diamonds
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.8 }}
            className="mt-3 font-heading text-lg tracking-[0.35em] text-champagne/90 sm:text-xl"
          >
            B2B TRADING PORTAL
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.8 }}
            className="mt-6 max-w-2xl font-body text-base leading-relaxed text-champagne/70 sm:text-lg"
          >
            A private exchange for certified diamonds, built exclusively for
            verified wholesalers, manufacturers and export houses. Register,
            get approved, and trade with confidence.
          </motion.p>

          {/* Button Container with High Z-Index & No Backdrop Filter */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="relative z-50 mt-10"
          >
            <GoldButton
              onClick={() => router.push("/portal/select-role")}
            >
              Enter B2B Portal
            </GoldButton>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.9 }}
            className="mt-20 grid w-full grid-cols-1 gap-6 sm:grid-cols-3"
          >
            {highlights.map((item) => (
              <GlassCard key={item.title} className="p-6 text-left">
                <item.icon className="mb-4 h-7 w-7 text-imperial" />
                <h3 className="font-heading text-base font-semibold text-champagne">
                  {item.title}
                </h3>
                <p className="mt-2 font-body text-sm leading-relaxed text-champagne/60">
                  {item.description}
                </p>
              </GlassCard>
            ))}
          </motion.div>

          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="mt-20 pb-4 font-body text-xs tracking-[0.3em] text-champagne/40"
          >
            KHODIYAR DIAMONDS &middot; TRUST &middot; PURITY &middot; BRILLIANCE
          </motion.footer>
        </div>
      )}
    </main>
  );
}