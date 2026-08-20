"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Briefcase, Diamond, ArrowRight } from "lucide-react";
import GlassCard from "@/components/GlassCard";

export default function SelectRolePage() {
  const router = useRouter();

  const roles = [
    {
      role: "buyer",
      icon: Briefcase,
      title: "B2B Buyer",
      description:
        "Wholesalers, retailers and export houses sourcing certified loose diamonds at trade pricing.",
      points: [
        "Live certified inventory access",
        "Filter by carat, clarity, cut & color",
        "Direct negotiation with verified sellers"
      ]
    },
    {
      role: "seller",
      icon: Diamond,
      title: "B2B Seller",
      description:
        "Manufacturers and cutting houses listing certified stock for verified trade buyers.",
      points: [
        "List single stones or bulk CSV upload",
        "Manage live stock & sales overview",
        "Reach a vetted buyer network"
      ]
    }
  ];

  return (
    <main className="relative min-h-screen bg-radial-luxury px-6 py-16">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-gold-radial opacity-50" />

      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <motion.p
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-3 font-body text-xs uppercase tracking-[0.5em] text-imperial"
        >
          Step 1 of 3
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="gold-text font-heading text-3xl font-semibold sm:text-5xl"
        >
          How will you trade with us?
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mx-auto mt-4 max-w-xl font-body text-sm text-champagne/60 sm:text-base"
        >
          Choose your role to continue to registration. Every account is
          reviewed by our compliance team before activation.
        </motion.p>

        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2">
          {roles.map((item, index) => (
            <motion.div
              key={item.role}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.15, duration: 0.7 }}
            >
              <GlassCard
                className="group flex h-full cursor-pointer flex-col items-center p-10 text-center"
                hover
              >
                <button
                  onClick={() =>
                    router.push(`/auth/register?role=${item.role}`)
                  }
                  className="focus-gold flex h-full w-full flex-col items-center"
                  aria-label={`Continue as ${item.title}`}
                >
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-imperial/50 bg-imperial/5 transition-all duration-300 group-hover:shadow-gold">
                    <item.icon className="h-8 w-8 text-imperial" />
                  </div>
                  <h2 className="font-heading text-2xl font-semibold text-champagne">
                    {item.title}
                  </h2>
                  <p className="mt-3 font-body text-sm leading-relaxed text-champagne/60">
                    {item.description}
                  </p>
                  <ul className="mt-6 space-y-2 text-left">
                    {item.points.map((point) => (
                      <li
                        key={point}
                        className="flex items-start gap-2 font-body text-xs text-champagne/50"
                      >
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-imperial" />
                        {point}
                      </li>
                    ))}
                  </ul>
                  <span className="mt-8 inline-flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-[0.25em] text-imperial transition-all duration-300 group-hover:gap-3">
                    Continue as {item.title}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </button>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-12"
        >
          <button
            onClick={() => router.push("/auth/login?role=buyer")}
            className="focus-gold font-body text-xs uppercase tracking-[0.2em] text-champagne/40 underline-offset-4 hover:text-imperial hover:underline"
          >
            Already have an approved account? Sign in
          </button>
        </motion.div>
      </div>
    </main>
  );
}
