"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Gem, RotateCcw, SlidersHorizontal } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import GlassCard from "@/components/GlassCard";
import { getDiamonds, getSession } from "@/lib/store";
import { DiamondListing, SessionUser } from "@/lib/types";

type DiamondCertLocal = DiamondListing["certLab"];

const SHAPES: DiamondListing["shape"][] = [
  "Round",
  "Princess",
  "Emerald",
  "Oval",
  "Pear",
  "Cushion",
  "Marquise",
  "Radiant"
];
const CLARITIES: DiamondListing["clarity"][] = [
  "FL",
  "IF",
  "VVS1",
  "VVS2",
  "VS1",
  "VS2",
  "SI1",
  "SI2"
];
const COLORS: DiamondListing["color"][] = ["D", "E", "F", "G", "H", "I", "J"];
const CUTS: DiamondListing["cut"][] = ["Excellent", "Very Good", "Good", "Fair"];
const LABS: DiamondCertLocal[] = ["GIA", "IGI", "HRD", "FGA"];

function sanitizePhoneForWhatsApp(rawPhone: string): string {
  return rawPhone.replace(/[^\d]/g, "");
}

function buildWhatsAppLink(diamond: DiamondListing): string | null {
  const phone = sanitizePhoneForWhatsApp(diamond.sellerPhone || "");
  if (!phone) return null;

  const totalPrice = diamond.carat * diamond.pricePerCarat;
  const message = [
    `Hello ${diamond.sellerCompany}, I'm enquiring about the following stone on Khodiyar Diamonds:`,
    `Stock #: ${diamond.stockNumber}`,
    `Shape: ${diamond.shape}`,
    `Carat: ${diamond.carat}ct`,
    `Clarity: ${diamond.clarity}`,
    `Color: ${diamond.color}`,
    `Cert: ${diamond.certLab} ${diamond.certNumber}`,
    `Total Price: $${totalPrice.toLocaleString(undefined, {
      maximumFractionDigits: 0
    })}`,
    "Please share availability and best terms."
  ].join("\n");

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

interface Filters {
  shape: string;
  clarity: string;
  color: string;
  cut: string;
  certLab: string;
  minCarat: string;
  maxCarat: string;
  minPrice: string;
  maxPrice: string;
}

const EMPTY_FILTERS: Filters = {
  shape: "",
  clarity: "",
  color: "",
  cut: "",
  certLab: "",
  minCarat: "",
  maxCarat: "",
  minPrice: "",
  maxPrice: ""
};

export default function BuyerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [diamonds, setDiamonds] = useState<DiamondListing[]>([]);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await getSession();
        if (!session || session.role !== "buyer") {
          router.replace("/auth/login?role=buyer");
          return;
        }
        const inventory = await getDiamonds();
        if (!cancelled) {
          setUser(session);
          setDiamonds(inventory);
        }
      } catch (error) {
        console.error(error);
        router.replace("/auth/login?role=buyer");
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  const filteredDiamonds = useMemo(() => {
    return diamonds.filter((d) => {
      if (filters.shape && d.shape !== filters.shape) return false;
      if (filters.clarity && d.clarity !== filters.clarity) return false;
      if (filters.color && d.color !== filters.color) return false;
      if (filters.cut && d.cut !== filters.cut) return false;
      if (filters.certLab && d.certLab !== filters.certLab) return false;
      if (filters.minCarat && d.carat < Number(filters.minCarat)) return false;
      if (filters.maxCarat && d.carat > Number(filters.maxCarat)) return false;
      const totalPrice = d.carat * d.pricePerCarat;
      if (filters.minPrice && totalPrice < Number(filters.minPrice)) return false;
      if (filters.maxPrice && totalPrice > Number(filters.maxPrice)) return false;
      return d.status === "AVAILABLE";
    });
  }, [diamonds, filters]);

  if (!user) return null;

  return (
    <main className="min-h-screen bg-radial-luxury px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <DashboardHeader user={user} subtitle="Verified B2B Buyer" />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <GlassCard className="sticky top-6 p-6" hover={false}>
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-imperial" />
                  <h2 className="font-heading text-sm font-semibold uppercase tracking-widest text-champagne">
                    Filters
                  </h2>
                </div>
                <button
                  onClick={() => setFilters(EMPTY_FILTERS)}
                  className="focus-gold flex items-center gap-1 font-body text-[11px] text-champagne/40 hover:text-imperial"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </button>
              </div>

              <div className="space-y-5">
                <SelectFilter
                  label="Shape"
                  value={filters.shape}
                  options={SHAPES}
                  onChange={(v) => setFilters((f) => ({ ...f, shape: v }))}
                />
                <SelectFilter
                  label="Clarity"
                  value={filters.clarity}
                  options={CLARITIES}
                  onChange={(v) => setFilters((f) => ({ ...f, clarity: v }))}
                />
                <SelectFilter
                  label="Color"
                  value={filters.color}
                  options={COLORS}
                  onChange={(v) => setFilters((f) => ({ ...f, color: v }))}
                />
                <SelectFilter
                  label="Cut"
                  value={filters.cut}
                  options={CUTS}
                  onChange={(v) => setFilters((f) => ({ ...f, cut: v }))}
                />
                <SelectFilter
                  label="Certificate"
                  value={filters.certLab}
                  options={LABS}
                  onChange={(v) => setFilters((f) => ({ ...f, certLab: v }))}
                />

                <div>
                  <p className="mb-2 font-body text-xs font-medium uppercase tracking-wider text-champagne/60">
                    Carat Range
                  </p>
                  <div className="flex gap-2">
                    <RangeInput
                      placeholder="Min"
                      value={filters.minCarat}
                      onChange={(v) => setFilters((f) => ({ ...f, minCarat: v }))}
                    />
                    <RangeInput
                      placeholder="Max"
                      value={filters.maxCarat}
                      onChange={(v) => setFilters((f) => ({ ...f, maxCarat: v }))}
                    />
                  </div>
                </div>

                <div>
                  <p className="mb-2 font-body text-xs font-medium uppercase tracking-wider text-champagne/60">
                    Total Price (USD)
                  </p>
                  <div className="flex gap-2">
                    <RangeInput
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(v) => setFilters((f) => ({ ...f, minPrice: v }))}
                    />
                    <RangeInput
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(v) => setFilters((f) => ({ ...f, maxPrice: v }))}
                    />
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="lg:col-span-3">
            <div className="mb-5 flex items-center justify-between">
              <p className="font-body text-sm text-champagne/50">
                {filteredDiamonds.length} certified stones available
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredDiamonds.map((diamond, index) => (
                <motion.div
                  key={diamond.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.5 }}
                >
                  <GlassCard className="overflow-hidden">
                    <div className="relative h-44 w-full">
                      <Image
                        src={diamond.imageUrl}
                        alt={`${diamond.shape} ${diamond.carat}ct diamond`}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                      <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 font-body text-[10px] uppercase tracking-wider text-imperial">
                        {diamond.certLab} &middot; {diamond.certNumber}
                      </span>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center justify-between">
                        <h3 className="font-heading text-base font-semibold text-champagne">
                          {diamond.shape} {diamond.carat}ct
                        </h3>
                        <Gem className="h-4 w-4 text-imperial" />
                      </div>
                      <p className="mt-1 font-body text-xs text-champagne/50">
                        {diamond.sellerCompany} &middot; {diamond.location}
                      </p>
                      <div className="mt-4 grid grid-cols-2 gap-y-2 font-body text-xs text-champagne/70">
                        <span>Clarity: {diamond.clarity}</span>
                        <span>Color: {diamond.color}</span>
                        <span>Cut: {diamond.cut}</span>
                        <span>Fluor: {diamond.fluorescence}</span>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-imperial/15 pt-4">
                        <div>
                          <p className="font-heading text-lg font-semibold text-imperial">
                            ${(diamond.carat * diamond.pricePerCarat).toLocaleString(
                              undefined,
                              { maximumFractionDigits: 0 }
                            )}
                          </p>
                          <p className="font-body text-[10px] text-champagne/40">
                            ${diamond.pricePerCarat.toLocaleString()}/ct
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            const link = buildWhatsAppLink(diamond);
                            if (link) {
                              window.open(link, "_blank", "noopener,noreferrer");
                            }
                          }}
                          disabled={!buildWhatsAppLink(diamond)}
                          title={
                            buildWhatsAppLink(diamond)
                              ? "Contact seller on WhatsApp"
                              : "Seller has no verified phone number on file"
                          }
                          className="focus-gold rounded-full border border-imperial/50 px-4 py-2 font-body text-[11px] font-semibold uppercase tracking-wider text-imperial transition-colors hover:bg-imperial/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                        >
                          Enquire
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>

            {filteredDiamonds.length === 0 && (
              <GlassCard className="p-12 text-center" hover={false}>
                <p className="font-body text-sm text-champagne/50">
                  No stones match your current filters. Try widening your
                  search.
                </p>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function SelectFilter({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-body text-xs font-medium uppercase tracking-wider text-champagne/60">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="focus-gold w-full rounded-lg border border-imperial/25 bg-black/30 px-3 py-2 font-body text-sm text-champagne focus:border-imperial"
      >
        <option value="" className="bg-[#1a1816] text-champagne">
          All
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-[#1a1816] text-champagne">
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

function RangeInput({
  placeholder,
  value,
  onChange
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="number"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="focus-gold w-full rounded-lg border border-imperial/25 bg-black/30 px-3 py-2 font-body text-sm text-champagne placeholder:text-champagne/30 focus:border-imperial"
    />
  );
}