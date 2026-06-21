import type { getExecutionBundle } from "@/lib/data/strategy-data";
import { filterBySlice, type OrgSlice } from "./org-slices";

export type ExecBundle = Awaited<ReturnType<typeof getExecutionBundle>>;

const SLICE_GETTERS = {
  commitments: [(c: ExecBundle["commitments"][0]) => c.department, (c: ExecBundle["commitments"][0]) => c.owner, (c: ExecBundle["commitments"][0]) => c.content, (c: ExecBundle["commitments"][0]) => c.linkedProjectCode] as const,
  tensions: [(t: ExecBundle["tensions"][0]) => t.projectName, (t: ExecBundle["tensions"][0]) => t.projectCode, (t: ExecBundle["tensions"][0]) => t.signal] as const,
  reportSignals: [(s: ExecBundle["reportSignals"][0]) => s.orgUnitName, (s: ExecBundle["reportSignals"][0]) => s.reportTitle, (s: ExecBundle["reportSignals"][0]) => s.label] as const,
  projects: [(p: ExecBundle["projects"][0]) => p.name, (p: ExecBundle["projects"][0]) => p.code, (p: ExecBundle["projects"][0]) => p.owner] as const,
  leadingKrs: [(kr: ExecBundle["leadingKrs"][0]) => kr.title, (kr: ExecBundle["leadingKrs"][0]) => kr.budgetTag] as const,
  assumptions: [(a: ExecBundle["assumptions"][0]) => a.code, (a: ExecBundle["assumptions"][0]) => a.content] as const,
  techSignals: [(s: ExecBundle["techSignals"][0]) => s.title, (s: ExecBundle["techSignals"][0]) => s.domain, (s: ExecBundle["techSignals"][0]) => s.linkedProjectCode] as const,
};

/** 按 N-1 切片过滤执行全览数据（专家页 / 板块下展开共用） */
export function filterExecBundle(data: ExecBundle, slice: OrgSlice): ExecBundle {
  return {
    ...data,
    commitments: filterBySlice(data.commitments, slice, [...SLICE_GETTERS.commitments]),
    tensions: filterBySlice(data.tensions, slice, [...SLICE_GETTERS.tensions]),
    reportSignals: filterBySlice(data.reportSignals, slice, [...SLICE_GETTERS.reportSignals]),
    projects: filterBySlice(data.projects, slice, [...SLICE_GETTERS.projects]),
    leadingKrs: filterBySlice(data.leadingKrs, slice, [...SLICE_GETTERS.leadingKrs]),
    assumptions: filterBySlice(data.assumptions, slice, [...SLICE_GETTERS.assumptions]),
    techSignals: filterBySlice(data.techSignals, slice, [...SLICE_GETTERS.techSignals]),
    maturityPoints: filterBySlice(data.maturityPoints, slice, [
      (m) => m.projectName,
      (m) => m.projectCode,
      (m) => m.owner,
    ]),
  };
}

/** PM scope: restrict Vx / execution artifacts to assigned project codes. */
export function filterExecByProjectScope(data: ExecBundle, projectCodes: string[] | null): ExecBundle {
  if (projectCodes == null || projectCodes.length === 0) return data;
  const inScope = (code: string | null | undefined) =>
    code ? projectCodes.includes(code) : false;

  return {
    ...data,
    projects: data.projects.filter((p) => projectCodes.includes(p.code)),
    tensions: data.tensions.filter((t) => inScope(t.projectCode)),
    maturityPoints: data.maturityPoints.filter((m) => inScope(m.projectCode)),
    techSignals: data.techSignals.filter((s) => inScope(s.linkedProjectCode)),
    commitments: data.commitments.filter((c) => inScope(c.linkedProjectCode)),
  };
}

export function executionHrefForSlice(sliceId: string): string {
  return `/execution?unit=${encodeURIComponent(sliceId)}`;
}
