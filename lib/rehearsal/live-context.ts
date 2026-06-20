import type { getRehearsalBundle } from "@/lib/data/strategy-data";

export type RehearsalLiveContext = Awaited<ReturnType<typeof getRehearsalBundle>>;

export const REHEARSAL_CHECKLIST_STORAGE_KEY = "stratos-rehearsal-checklist-v1";
