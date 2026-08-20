"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { clearSession } from "@/lib/store";
import { SessionUser } from "@/lib/types";

interface DashboardHeaderProps {
  user: SessionUser;
  subtitle: string;
}

export default function DashboardHeader({ user, subtitle }: DashboardHeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    await clearSession();
    router.push("/auth/login");
  }

  return (
    <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-imperial/15 pb-6">
      <div className="flex items-center gap-4">
        <div className="relative h-12 w-12 overflow-hidden rounded-full border border-imperial/50 shadow-gold">
          <Image src="/logo.jpg" alt="Khodiyar Diamonds" fill sizes="48px" className="object-cover" />
        </div>
        <div>
          <h1 className="font-heading text-xl font-semibold text-champagne">
            {user.companyName}
          </h1>
          <p className="font-body text-xs uppercase tracking-widest text-imperial">
            {subtitle}
          </p>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="focus-gold flex items-center gap-2 rounded-full border border-imperial/30 px-4 py-2 font-body text-xs uppercase tracking-widest text-champagne/60 transition-colors hover:border-imperial hover:text-champagne"
      >
        <LogOut className="h-3.5 w-3.5" />
        Sign Out
      </button>
    </header>
  );
}
