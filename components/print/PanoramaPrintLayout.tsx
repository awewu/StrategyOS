import Image from "next/image";
import { BafBar } from "@/components/finance/BafBar";
import { DecisionsPanel } from "@/components/ui/DecisionsPanel";
import { ExecutiveSummary } from "@/components/ui/ExecutiveSummary";
import { ImplicationsBar } from "@/components/ui/ImplicationsBar";
import { mckinseySections } from "@/lib/brand/apple-mckinsey";
import {
  buildPanoramaViewModel,
  kpiValue,
  PANORAMA_KPI_CARDS,
  type PanoramaDeck,
} from "@/lib/panorama/view-model";

export function PanoramaPrintLayout({ deck }: { deck: PanoramaDeck }) {
  const vm = buildPanoramaViewModel(deck);

  return (
    <>
      <header className="mb-8 flex items-center justify-between border-b border-[#0a1628]/10 pb-5">
        <div className="flex items-center gap-4">
          <Image src="/logo-mark.svg" alt="" width={48} height={48} />
          <div>
            <h1 className="text-[2rem] font-semibold tracking-[-0.02em] text-[#0a1628]">
              {vm.brandName}
            </h1>
            <p className="text-sm text-[#828c8d]">
              战略推演全景 · {vm.period} · {vm.statusLabel} · 数据源 {vm.sourceLabel}
            </p>
          </div>
        </div>
      </header>

      <div className="mb-6 space-y-5">
        <ExecutiveSummary scr={vm.scr} variant="print" compact />
        <ImplicationsBar items={vm.implications} variant="print" />
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PANORAMA_KPI_CARDS.map((k) => (
          <div
            key={k.key}
            className="rounded-xl border border-[#0a1628]/8 bg-white p-4 text-center shadow-sm"
          >
            <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#828c8d]">
              {k.label}
            </div>
            <div className="mt-2 font-data text-xl tabular-nums text-[var(--color-accent)]">
              {kpiValue(vm, k.key)}
            </div>
          </div>
        ))}
      </div>

      <section className="mb-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--color-accent)]/35 bg-white p-5">
          <h2 className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-accent)]">
            核心挑战
          </h2>
          <p className="text-[15px] leading-relaxed text-[#cdd1d2]">{vm.challenge}</p>
        </div>
        <div className="rounded-xl border border-[#0a1628]/10 bg-white p-5">
          <h2 className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-[#828c8d]">
            Crux
          </h2>
          <p className="text-[15px] leading-relaxed text-[#cdd1d2]">{vm.crux}</p>
        </div>
      </section>

      <section className="mb-6 rounded-xl border border-[#0a1628]/10 bg-white p-5 print:break-inside-avoid">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-[#828c8d]">
          {mckinseySections.keyIssues.id} · {mckinseySections.keyIssues.labelZh}
        </h3>
        <ul className="space-y-3 text-sm text-[#cdd1d2]">
          {vm.issueTree.map((node) => (
            <li key={node.id}>
              <span className="font-medium text-[#0a1628]">{node.label}</span>
              {node.children && node.children.length > 0 && (
                <ul className="mt-1 space-y-1 pl-4">
                  {node.children.map((c) => (
                    <li key={c.id} className="text-[#4e5758]">
                      · {c.label}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-2 print:break-inside-avoid">
        <div className="rounded-xl border border-[#0a1628]/10 bg-white p-4">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-accent)]">
            Top3 StratDiff
          </h3>
          <ul className="space-y-1 text-sm text-[#cdd1d2]">
            {vm.topDiffs.slice(0, 3).map((d) => (
              <li key={d.title}>· [{d.severity}] {d.title}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-[#0a1628]/10 bg-white p-4">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-accent)]">
            Top3 预警
          </h3>
          <ul className="space-y-1 text-sm text-[#cdd1d2]">
            {vm.topAlerts.length === 0 ? (
              <li>· 无硬阻断</li>
            ) : (
              vm.topAlerts.map((a) => <li key={a.id}>· {a.message}</li>)
            )}
          </ul>
        </div>
      </section>

      <div className="mb-6">
        <DecisionsPanel decisions={vm.decisions} variant="print" />
      </div>

      <section className="mb-6 rounded-xl border border-[#0a1628]/10 bg-[#faf8f5] p-4 print:break-inside-avoid">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-[#828c8d]">
          B-A-F 闭环（营收 · 利润）
        </h3>
        <BafBar fpa={deck.fpa} />
      </section>

      <section className="mb-6 rounded-xl border border-[#0a1628]/10 bg-white p-4 print:break-before-page">
        <h2 className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-[#828c8d]">
          附录 · FPA / CapStack
        </h2>
        <div className="grid gap-4 text-sm text-[#cdd1d2] md:grid-cols-2">
          <ul className="space-y-1">
            {vm.fpaLines.map((line) => (
              <li key={line}>· {line}</li>
            ))}
          </ul>
          <ul className="space-y-1">
            {vm.capStackLines.map((line) => (
              <li key={line}>· {line}</li>
            ))}
          </ul>
        </div>
      </section>

      <details className="mb-6 rounded-xl border border-[#0a1628]/10 bg-white p-4">
        <summary className="cursor-pointer text-sm font-medium text-[#828c8d]">
          一分钟看懂 StratOS（折叠）
        </summary>
        <pre className="mt-3 whitespace-pre-wrap font-mono text-xs leading-relaxed text-[#cdd1d2]">
          {vm.oneMinuteDiagram}
        </pre>
      </details>

      <footer className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-[#0a1628]/10 pt-4 text-sm text-[#828c8d]">
        <span>
          {vm.taglineZh} · {vm.taglineEn}
        </span>
        <div className="text-right text-xs">
          <div>签章：________________</div>
          <div className="mt-2">日期：________________</div>
        </div>
        <span className="font-data">
          {vm.period} · {vm.statusLabel}
        </span>
      </footer>
    </>
  );
}
