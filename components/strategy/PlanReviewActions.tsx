"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PlanReviewActions({
  orgUnitId,
  horizonStart,
  horizonEnd,
}: {
  orgUnitId: string;
  horizonStart: number;
  horizonEnd: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function approve() {
    if (!window.confirm("确认已审阅全部战略内容，并审核通过、定稿锁定？")) return;

    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/strategy/plan/lifecycle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgUnitId,
          horizonStart,
          horizonEnd,
          action: "lock",
        }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setMessage(data.error ?? "审核失败");
        return;
      }
      setMessage("审核通过，战略已定稿锁定");
      router.refresh();
    } catch {
      setMessage("网络错误，请重试");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {message ? <span className="text-caption">{message}</span> : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => void approve()}
        className="stratos-btn stratos-btn--primary px-3 py-1.5 text-xs disabled:opacity-60"
      >
        {busy ? "审核中..." : "审核通过并定稿"}
      </button>
    </div>
  );
}
