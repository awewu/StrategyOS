import { dbAvailable, prisma } from "@/lib/db";
import { computeLogHash } from "@/lib/audit/hash";
import { getMemoryChain } from "@/lib/audit/log-event";
import type { UsageLogRecord } from "@/lib/audit/types";

export interface ChainBreak {
  id: string;
  index: number;
  reason: "content-tampered" | "link-broken" | "missing-hash";
}

export interface ChainVerification {
  ok: boolean;
  source: "database" | "memory" | "empty";
  checked: number;
  break?: ChainBreak;
}

/**
 * Verify an ordered (oldest-first) slice of an audit chain.
 *
 * - `content-tampered`: a row's stored hash no longer matches its own fields.
 * - `link-broken`: a row's prevHash does not equal the previous row's hash
 *   (insertion, deletion, or reordering).
 *
 * Detection works on any contiguous window: we only require that consecutive
 * rows link to each other, so the first row's prevHash is trusted as the
 * window anchor.
 */
export function verifyChainSlice(
  rows: UsageLogRecord[],
  source: ChainVerification["source"],
): ChainVerification {
  let prev: UsageLogRecord | null = null;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row.hash || !row.prevHash) {
      return { ok: false, source, checked: i, break: { id: row.id, index: i, reason: "missing-hash" } };
    }
    const expected = computeLogHash({
      prevHash: row.prevHash,
      createdAt: row.createdAt,
      userEmail: row.userEmail,
      action: row.action,
      resource: row.resource,
      metadata: row.metadata ?? null,
      ip: row.ip ?? null,
    });
    if (expected !== row.hash) {
      return { ok: false, source, checked: i, break: { id: row.id, index: i, reason: "content-tampered" } };
    }
    if (prev && row.prevHash !== prev.hash) {
      return { ok: false, source, checked: i, break: { id: row.id, index: i, reason: "link-broken" } };
    }
    prev = row;
  }
  return { ok: true, source: rows.length === 0 ? "empty" : source, checked: rows.length };
}

/** Verify the persisted audit chain (DB when available, else the memory chain). */
export async function verifyAuditChain(limit = 1000): Promise<ChainVerification> {
  if (!(await dbAvailable())) {
    return verifyChainSlice(getMemoryChain(), "memory");
  }
  try {
    const rows = await prisma.usageLog.findMany({
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: limit,
    });
    const mapped: UsageLogRecord[] = rows.map((r) => ({
      id: r.id,
      userId: r.userId ?? undefined,
      userEmail: r.userEmail,
      action: r.action,
      resource: r.resource,
      metadata: (r.metadata as Record<string, unknown> | null) ?? undefined,
      ip: r.ip ?? undefined,
      userAgent: r.userAgent ?? undefined,
      prevHash: r.prevHash ?? undefined,
      hash: r.hash ?? undefined,
      createdAt: r.createdAt,
    }));
    return verifyChainSlice(mapped, "database");
  } catch {
    return verifyChainSlice(getMemoryChain(), "memory");
  }
}
