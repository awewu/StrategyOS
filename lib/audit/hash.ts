import { createHash } from "node:crypto";

/** Genesis link for the first entry in an audit chain. */
export const GENESIS_HASH = "0".repeat(64);

const FIELD_SEP = "\u0001";

export interface HashableLog {
  prevHash: string;
  createdAt: Date;
  userEmail: string;
  action: string;
  resource: string;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
}

/** Order-independent JSON serialization so metadata hashes deterministically. */
function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
    .join(",")}}`;
}

export function canonicalMetadata(meta?: Record<string, unknown> | null): string {
  return meta == null ? "null" : stableStringify(meta);
}

/**
 * SHA-256 over the previous hash + immutable record fields.
 * Linking prevHash → hash makes the log append-only and tamper-evident:
 * editing, reordering, or deleting any row breaks the chain.
 */
export function computeLogHash(input: HashableLog): string {
  const payload = [
    input.prevHash,
    input.createdAt.toISOString(),
    input.userEmail,
    input.action,
    input.resource,
    canonicalMetadata(input.metadata ?? null),
    input.ip ?? "",
  ].join(FIELD_SEP);
  return createHash("sha256").update(payload).digest("hex");
}
