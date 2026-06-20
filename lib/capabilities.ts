import { workosConfigured } from "@/lib/auth/config";
import { dbAvailable } from "@/lib/db";
import { chineseFontAvailable } from "@/lib/pdf/fonts";

export interface CapabilitySlice {
  configured: boolean;
  detail?: string;
}

export interface CapabilityStatus {
  db: CapabilitySlice & { reachable: boolean };
  workos: CapabilitySlice;
  llm: CapabilitySlice;
  fonts: { available: boolean; detail?: string };
  mode: "demo" | "full";
}

function llmConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY || process.env.STRATOS_LLM_API_KEY);
}

export async function getCapabilityStatus(): Promise<CapabilityStatus> {
  const dbConfigured = Boolean(process.env.DATABASE_URL?.trim());
  const dbReachable = dbConfigured ? await dbAvailable() : false;
  const workos = workosConfigured();
  const llm = llmConfigured();
  const fonts = chineseFontAvailable();

  return {
    db: {
      configured: dbConfigured,
      reachable: dbReachable,
      detail: dbReachable ? "postgresql" : dbConfigured ? "unreachable" : "unset",
    },
    workos: {
      configured: workos,
      detail: workos ? "sso+webhook ready" : "demo session fallback",
    },
    llm: {
      configured: llm,
      detail: llm ? process.env.STRATOS_LLM_MODEL ?? "gpt-4o-mini" : "rules engine fallback",
    },
    fonts: {
      available: fonts,
      detail: fonts ? "NotoSansSC" : "Helvetica fallback — run npm run fonts:fetch",
    },
    mode: dbReachable ? "full" : "demo",
  };
}

export function formatCapabilityReport(status: CapabilityStatus): string {
  const lines = [
    "",
    "── StratOS capabilities ──",
    `  mode:   ${status.mode}`,
    `  db:     ${status.db.reachable ? "✓ connected" : status.db.configured ? "✗ unreachable" : "○ unset"}`,
    `  workos: ${status.workos.configured ? "✓ configured" : "○ demo auth"}`,
    `  llm:    ${status.llm.configured ? "✓ configured" : "○ rules fallback"}`,
    `  fonts:  ${status.fonts.available ? "✓ chinese pdf" : "○ english fallback"}`,
    "",
  ];
  return lines.join("\n");
}
