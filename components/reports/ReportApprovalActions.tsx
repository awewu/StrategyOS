"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReportApprovalActions({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState<"APPROVED" | "REJECTED" | null>(null);

  async function submit(action: "APPROVED" | "REJECTED") {
    setSubmitting(action);
    try {
      await fetch("/api/reports/submit", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reportId, action }),
      });
      router.refresh();
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={submitting != null}
        onClick={() => void submit("APPROVED")}
        className="rounded border border-green-600/30 px-3 py-1.5 text-xs text-green-700 hover:bg-green-600/10 disabled:opacity-50"
      >
        {submitting === "APPROVED" ? "存档中..." : "存档"}
      </button>
      <button
        type="button"
        disabled={submitting != null}
        onClick={() => void submit("REJECTED")}
        className="rounded border border-red-600/20 px-3 py-1.5 text-xs text-[var(--signal-red)] hover:bg-red-600/5 disabled:opacity-50"
      >
        {submitting === "REJECTED" ? "退回中..." : "退回"}
      </button>
    </div>
  );
}
