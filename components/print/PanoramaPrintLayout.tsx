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
      <header className="stratos-print-header mb-8 flex items-center justify-between pb-5">
        <div className="flex items-center gap-4">
          <Image src="/logo-mark.svg" alt="" width={48} height={48} />
          <div>
            <h1 className="stratos-print-title">{vm.brandName}</h1>
            <p className="text-sm stratos-print-muted">
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
          <div key={k.key} className="stratos-print-card text-center shadow-sm">
            <div className="stratos-print-section-label">{k.label}</div>
            <div className="mt-2 font-data text-xl tabular-nums text-[var(--color-accent)]">
              {kpiValue(vm, k.key)}
            </div>
          </div>
        ))}
      </div>

      <section className="mb-6 grid gap-4 md:grid-cols-2">
        <div className="stratos-print-card stratos-print-card--accent">
          <h2 className="stratos-print-section-label mb-2 text-[var(--color-accent)]">核心挑战</h2>
          <p className="text-[15px] leading-relaxed stratos-print-body">{vm.challenge}</p>
        </div>
        <div className="stratos-print-card">
          <h2 className="stratos-print-section-label mb-2">Crux</h2>
          <p className="text-[15px] leading-relaxed stratos-print-body">{vm.crux}</p>
        </div>
      </section>

      <section className="stratos-print-card mb-6 print:break-inside-avoid">
        <h3 className="stratos-print-section-label mb-3">
          {mckinseySections.keyIssues.id} · {mckinseySections.keyIssues.labelZh}
        </h3>
        <ul className="space-y-3 text-sm stratos-print-body">
          {vm.issueTree.map((node) => (
            <li key={node.id}>
              <span className="font-medium text-[var(--color-text-primary)]">{node.label}</span>
              {node.children && node.children.length > 0 && (
                <ul className="mt-1 space-y-1 pl-4">
                  {node.children.map((c) => (
                    <li key={c.id} className="text-[var(--color-text-muted)]">
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
        <div className="stratos-print-card">
          <h3 className="stratos-print-section-label mb-2 text-[var(--color-accent)]">
            Top3 StratDiff
          </h3>
          <ul className="space-y-1 text-sm stratos-print-body">
            {vm.topDiffs.slice(0, 3).map((d) => (
              <li key={d.title}>· [{d.severity}] {d.title}</li>
            ))}
          </ul>
        </div>
        <div className="stratos-print-card">
          <h3 className="stratos-print-section-label mb-2 text-[var(--color-accent)]">
            Top3 预警
          </h3>
          <ul className="space-y-1 text-sm stratos-print-body">
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

      <section className="stratos-print-card stratos-print-card--muted-bg mb-6 print:break-inside-avoid">
        <h3 className="stratos-print-section-label mb-3">B-A-F 闭环（营收 · 利润）</h3>
        <BafBar fpa={deck.fpa} />
      </section>

      <section className="stratos-print-card mb-6 print:break-before-page">
        <h2 className="stratos-print-section-label mb-2">附录 · FPA / CapStack</h2>
        <div className="grid gap-4 text-sm stratos-print-body md:grid-cols-2">
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

      <details className="stratos-print-card mb-6">
        <summary className="cursor-pointer text-sm font-medium stratos-print-muted">
          一分钟看懂 StratOS（折叠）
        </summary>
        <pre className="mt-3 whitespace-pre-wrap font-mono text-xs leading-relaxed stratos-print-body">
          {vm.oneMinuteDiagram}
        </pre>
      </details>

      <footer className="stratos-print-footer mt-6 flex flex-wrap items-end justify-between gap-4 pt-4 text-sm">
        <span>
          {vm.taglineZh} · {vm.taglineEn}
        </span>
        <div className="text-right text-xs stratos-print-muted">
          <div>签章：________________</div>
          <div className="mt-2">日期：________________</div>
        </div>
        <span className="font-data stratos-print-muted">
          {vm.period} · {vm.statusLabel}
        </span>
      </footer>
    </>
  );
}
