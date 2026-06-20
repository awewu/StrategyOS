/**
 * WorkOS webhook verification + Directory Sync user provisioning.
 */
import crypto from "crypto";
import { dbAvailable, prisma } from "@/lib/db";
import type { RoleKey } from "@/lib/constants";

export function verifyWorkOSWebhook(
  payload: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader || !secret) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k.trim(), v?.trim()];
    })
  );
  const ts = parts.t;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const signed = crypto.createHmac("sha256", secret).update(`${ts}.${payload}`).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signed), Buffer.from(v1));
  } catch {
    return false;
  }
}

interface WorkOSEvent {
  id: string;
  event: string;
  data: Record<string, unknown>;
}

function inferRole(email: string): RoleKey {
  if (email.includes("ceo")) return "ceo";
  if (email.includes("vp")) return "vp";
  if (email.includes("pm")) return "pm";
  if (email.includes("staff")) return "staff";
  return "observer";
}

export async function handleWorkOSEvent(evt: WorkOSEvent): Promise<{ action: string; email?: string }> {
  const type = evt.event;
  const data = evt.data;

  if (type.startsWith("dsync.") || type.startsWith("user.")) {
    const email = extractEmail(data);
    if (!email) return { action: "ignored" };

    if (type.includes("deleted")) {
      if (await dbAvailable()) {
        await prisma.user.deleteMany({ where: { email } }).catch(() => {});
      }
      return { action: "user_deleted", email };
    }

    const name = extractName(data) ?? email.split("@")[0];
    const role = inferRole(email);

    if (await dbAvailable()) {
      await prisma.user.upsert({
        where: { email },
        create: { email, name: name.slice(0, 50), role },
        update: { name: name.slice(0, 50) },
      });
    }
    return { action: "user_upserted", email };
  }

  return { action: "ignored", email: undefined };
}

function extractEmail(data: Record<string, unknown>): string | null {
  const user = data.user as { email?: string } | undefined;
  if (user?.email) return user.email.toLowerCase();
  const email = data.email as string | undefined;
  return email?.toLowerCase() ?? null;
}

function extractName(data: Record<string, unknown>): string | null {
  const user = data.user as { first_name?: string; last_name?: string; email?: string } | undefined;
  if (user) {
    const n = [user.first_name, user.last_name].filter(Boolean).join(" ");
    if (n) return n;
  }
  const username = data.username as string | undefined;
  return username ?? null;
}
