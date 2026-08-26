"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useRole } from "@/lib/context/role-context";
import { isAdmin } from "@/lib/auth/permissions";

/** 决议签署按钮：仅 board / admin 可见，签名写入审计哈希链 */
export function SignResolutionButton({
  recordId,
  signedByMe,
}: {
  recordId: string;
  signedByMe: boolean;
}) {
  const { role } = useRole();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (role !== "board" && !isAdmin(role)) return null;
  if (signedByMe) return <span className="text-xs text-[var(--signal-green-text)]">已签署 ✓</span>;

  async function sign() {
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/board/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId }),
      });
      const j = (await r.json()) as { error?: string };
      if (!r.ok) throw new Error(j.error ?? "签署失败");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "签署失败");
      window.setTimeout(() => setErr(""), 3000);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="flex items-center gap-2">
      {err ? <span className="text-xs text-[var(--signal-red-text)]">{err}</span> : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => void sign()}
        className="text-xs text-[var(--color-accent)] hover:underline disabled:opacity-50"
      >
        {busy ? "签署中…" : "签署"}
      </button>
    </span>
  );
}

/** 上会材料锁定按钮：仅 L3+（CEO/CFO）可锁，锁后不可覆盖 */
export function LockPackButton() {
  const { role } = useRole();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (role !== "ceo" && role !== "cfo") return null;

  async function lock() {
    if (!confirm("锁定本期董事会包口径？锁定后不可覆盖。")) return;
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/board/lock", { method: "POST" });
      const j = (await r.json()) as { error?: string };
      if (!r.ok) throw new Error(j.error ?? "锁定失败");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "锁定失败");
      window.setTimeout(() => setErr(""), 4000);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="flex items-center gap-2">
      {err ? <span className="text-xs text-[var(--signal-red-text)]">{err}</span> : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => void lock()}
        className="stratos-btn stratos-btn--ghost text-xs"
      >
        {busy ? "锁定中…" : "锁定本期材料"}
      </button>
    </span>
  );
}
