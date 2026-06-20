export type CheckStatus = "pass" | "warn" | "fail" | "skip";

export interface HarnessCheck {
  id: string;
  group: string;
  name: string;
  status: CheckStatus;
  message: string;
  durationMs: number;
  meta?: Record<string, unknown>;
}

export interface HarnessSummary {
  pass: number;
  warn: number;
  fail: number;
  skip: number;
  total: number;
}

export interface HarnessReport {
  timestamp: string;
  profile: "quick" | "full" | "ci";
  exitCode: number;
  summary: HarnessSummary;
  checks: HarnessCheck[];
}

export interface HarnessOptions {
  profile?: "quick" | "full" | "ci";
  baseUrl?: string;
  json?: boolean;
  skipTests?: boolean;
  skipBuild?: boolean;
}
