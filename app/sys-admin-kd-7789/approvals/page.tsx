"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  FileText,
  LogOut,
  ShieldCheck,
  XCircle
} from "lucide-react";
import GlassCard from "@/components/GlassCard";
import GoldButton from "@/components/GoldButton";
import {
  adminLogout,
  approveAccount,
  getAccounts,
  isAdminAuthed,
  rejectAccount,
  getKycDocumentUrl
} from "@/lib/store";
import { Account } from "@/lib/types";

export default function ApprovalsConsole() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [filter, setFilter] = useState<"ALL" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED">(
    "PENDING_APPROVAL"
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await isAdminAuthed();
      if (!ok) {
        router.replace("/sys-admin-kd-7789");
        return;
      }
      if (!cancelled) {
        setAuthed(true);
        await refreshAccounts();
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  async function refreshAccounts() {
    try {
      setAccounts(await getAccounts());
    } catch (error) {
      console.error(error);
    }
  }

  async function handleApprove(id: string) {
    try {
      await approveAccount(id);
      await refreshAccounts();
      setSelectedId(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not approve account.");
    }
  }

  async function handleReject(id: string) {
    if (!rejectReason.trim()) return;
    try {
      await rejectAccount(id, rejectReason.trim());
      setRejectReason("");
      await refreshAccounts();
      setSelectedId(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not reject account.");
    }
  }

  async function handleLogout() {
    await adminLogout();
    router.replace("/sys-admin-kd-7789");
  }

  if (!authed) {
    return null;
  }

  const filteredAccounts = accounts.filter((a) =>
    filter === "ALL" ? true : a.status === filter
  );
  const selected = accounts.find((a) => a.id === selectedId) || null;

  return (
    <main className="min-h-screen bg-radial-luxury px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-imperial" />
            <div>
              <h1 className="font-heading text-2xl font-semibold text-champagne">
                Approval Console
              </h1>
              <p className="font-body text-xs text-champagne/50">
                {accounts.filter((a) => a.status === "PENDING_APPROVAL").length}{" "}
                applications awaiting review
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="focus-gold flex items-center gap-2 rounded-full border border-imperial/30 px-4 py-2 font-body text-xs uppercase tracking-widest text-champagne/60 transition-colors hover:border-imperial hover:text-champagne"
          >
            <LogOut className="h-3.5 w-3.5" />
            Exit Console
          </button>
        </div>

        <div className="mb-6 flex gap-2">
          {(["PENDING_APPROVAL", "APPROVED", "REJECTED", "ALL"] as const).map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`focus-gold rounded-full px-4 py-1.5 font-body text-xs uppercase tracking-wider transition-all ${
                  filter === status
                    ? "bg-imperial text-onyx shadow-gold"
                    : "border border-imperial/25 text-champagne/50 hover:text-champagne"
                }`}
              >
                {status.replace("_", " ")}
              </button>
            )
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            {filteredAccounts.length === 0 && (
              <GlassCard className="p-6 text-center" hover={false}>
                <p className="font-body text-sm text-champagne/50">
                  No applications in this category.
                </p>
              </GlassCard>
            )}
            {filteredAccounts.map((account) => (
              <motion.button
                key={account.id}
                onClick={() => setSelectedId(account.id)}
                whileHover={{ x: 4 }}
                className={`focus-gold block w-full text-left ${
                  selectedId === account.id ? "opacity-100" : "opacity-90"
                }`}
              >
                <GlassCard
                  className={`p-5 ${
                    selectedId === account.id ? "border-imperial shadow-gold" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-heading text-sm font-semibold text-champagne">
                        {account.companyName}
                      </p>
                      <p className="mt-1 font-body text-xs text-champagne/50">
                        {account.contactName} &middot; {account.email}
                      </p>
                    </div>
                    <StatusBadge status={account.status} />
                  </div>
                  <p className="mt-3 font-body text-[11px] uppercase tracking-widest text-imperial">
                    {account.role === "buyer" ? "B2B Buyer" : "B2B Seller"}
                  </p>
                </GlassCard>
              </motion.button>
            ))}
          </div>

          <div className="lg:col-span-3">
            {!selected ? (
              <GlassCard className="flex h-full min-h-[300px] items-center justify-center p-10 text-center" hover={false}>
                <p className="font-body text-sm text-champagne/40">
                  Select an application to review its KYC documents.
                </p>
              </GlassCard>
            ) : (
              <GlassCard className="p-8" hover={false}>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-heading text-xl font-semibold text-champagne">
                      {selected.companyName}
                    </h2>
                    <p className="mt-1 font-body text-xs uppercase tracking-widest text-imperial">
                      {selected.role === "buyer" ? "B2B Buyer" : "B2B Seller"}
                    </p>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-imperial/15 pt-6 font-body text-xs">
                  <Detail label="Contact Person" value={selected.contactName} />
                  <Detail label="Email" value={selected.email} />
                  <Detail label="Phone" value={selected.phone} />
                  <Detail label="City" value={selected.city} />
                  <Detail
                    label="Submitted"
                    value={new Date(selected.createdAt).toLocaleString()}
                  />
                  {selected.reviewedAt && (
                    <Detail
                      label="Reviewed"
                      value={new Date(selected.reviewedAt).toLocaleString()}
                    />
                  )}
                </div>

                <div className="mt-6 border-t border-imperial/15 pt-6">
                  <p className="mb-3 font-heading text-sm font-semibold uppercase tracking-widest text-imperial">
                    KYC Documents
                  </p>
                  <div className="space-y-3">
                    {selected.kycDocuments.map((doc) => (
                      <button
                        key={doc.id ?? doc.storagePath}
                        type="button"
                        onClick={async () => {
                          try {
                            const url = await getKycDocumentUrl(doc.storagePath);
                            window.open(url, "_blank", "noopener,noreferrer");
                          } catch (error) {
                            alert(error instanceof Error ? error.message : "Could not open document.");
                          }
                        }}
                        className="focus-gold flex w-full items-center justify-between gap-3 rounded-lg border border-imperial/25 bg-black/25 px-4 py-3 text-left transition-colors hover:border-imperial"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-imperial" />
                          <div>
                            <p className="font-body text-xs font-medium text-champagne">{doc.label}</p>
                            <p className="font-body text-[11px] text-champagne/40">{doc.fileName}</p>
                          </div>
                        </div>
                        <span className="font-body text-[11px] uppercase tracking-wider text-imperial">View</span>
                      </button>
                    ))}
                  </div>
                </div>

                {selected.status === "PENDING_APPROVAL" && (
                  <div className="mt-8 space-y-4 border-t border-imperial/15 pt-6">
                    <div className="flex gap-3">
                      <GoldButton
                        onClick={() => handleApprove(selected.id)}
                        className="flex-1"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Approve
                      </GoldButton>
                    </div>
                    <div className="space-y-2">
                      <input
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Reason for rejection (required)"
                        className="focus-gold w-full rounded-lg border border-red-500/30 bg-black/25 px-4 py-2.5 font-body text-sm text-champagne placeholder:text-champagne/25 focus:border-red-400"
                      />
                      <button
                        onClick={() => handleReject(selected.id)}
                        disabled={!rejectReason.trim()}
                        className="focus-gold flex w-full items-center justify-center gap-2 rounded-full border border-red-500/40 py-3 font-body text-xs font-semibold uppercase tracking-widest text-red-300 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject Application
                      </button>
                    </div>
                  </div>
                )}

                {selected.status === "REJECTED" && selected.rejectionReason && (
                  <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 font-body text-xs text-red-300">
                    Rejection reason: {selected.rejectionReason}
                  </div>
                )}
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-champagne/40 uppercase tracking-wider text-[10px]">
        {label}
      </p>
      <p className="mt-0.5 text-champagne">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: Account["status"] }) {
  const styles: Record<Account["status"], string> = {
    PENDING_APPROVAL: "border-imperial/50 text-imperial bg-imperial/10",
    APPROVED: "border-green-500/50 text-green-400 bg-green-500/10",
    REJECTED: "border-red-500/50 text-red-400 bg-red-500/10"
  };
  const labels: Record<Account["status"], string> = {
    PENDING_APPROVAL: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected"
  };
  return (
    <span
      className={`shrink-0 rounded-full border px-3 py-1 font-body text-[10px] font-semibold uppercase tracking-wider ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
