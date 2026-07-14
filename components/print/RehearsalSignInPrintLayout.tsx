import Image from "next/image";
import type { RehearsalStrategyDeckMeta, RehearsalStrategySlide } from "@/lib/data/strategy-data";

export function RehearsalSignInPrintLayout({
  meta,
  slides,
}: {
  meta: RehearsalStrategyDeckMeta;
  slides: RehearsalStrategySlide[];
}) {
  const intent = slides.find((slide) => slide.id === "strategy-intent") ?? slides[0];
  const sections = slides.filter((slide) => slide.id !== intent?.id).slice(0, 6);

  return (
    <article className="mx-auto max-w-[1120px] bg-white p-8 text-[#172033] print:max-w-none print:p-0">
      <header className="mb-5 flex items-start justify-between border-b-2 border-[var(--color-accent)] pb-4">
        <div className="flex items-center gap-4">
          <Image src="/logo-mark.svg" alt="" width={44} height={44} />
          <div>
            <h1 className="text-xl font-semibold">{meta.orgUnitName} · 战略会签到一页纸</h1>
            <p className="mt-1 text-xs text-[#64748b]">
              {meta.horizon} · {meta.versionLabel} · {meta.status} · #{meta.planCode}
            </p>
          </div>
        </div>
        <div className="text-right text-xs text-[#64748b]">
          <div>会议日期：________________</div>
          <div className="mt-2">会议地点：________________</div>
        </div>
      </header>

      {intent ? (
        <section className="mb-4 border-l-4 border-[var(--color-accent)] bg-[#f7f8fa] px-4 py-3">
          <p className="text-[11px] font-medium text-[var(--color-accent)]">战略意图与北极星</p>
          <h2 className="mt-1 text-lg font-semibold">{intent.title}</h2>
          {intent.lead ? <p className="mt-1 text-sm leading-5 text-[#475569]">{intent.lead}</p> : null}
          {intent.metrics?.length ? (
            <div className="mt-2 flex flex-wrap gap-5 text-xs">
              {intent.metrics.map((metric) => (
                <span key={metric.label}><strong>{metric.label}</strong> {metric.value}</span>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        {sections.map((slide) => (
          <section key={slide.id} className="break-inside-avoid border border-[#d9dee7] p-3">
            <p className="text-[10px] font-medium text-[var(--color-accent)]">{slide.eyebrow}</p>
            <h2 className="mt-0.5 text-sm font-semibold">{slide.title}</h2>
            <ul className="mt-1.5 space-y-1 text-[11px] leading-4 text-[#475569]">
              {slide.bullets.slice(0, 4).map((bullet) => <li key={bullet}>· {bullet}</li>)}
            </ul>
          </section>
        ))}
      </div>

      <section className="mt-5 break-inside-avoid">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">参会签到</h2>
          <span className="text-[10px] text-[#64748b]">战略版本：{meta.versionLabel}</span>
        </div>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-[#f3f4f6]">
              {['序号', '姓名', '部门 / 职务', '签名'].map((label) => (
                <th key={label} className="border border-[#cfd5df] px-2 py-1.5 text-left font-medium">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }, (_, index) => (
              <tr key={index}>
                <td className="w-12 border border-[#cfd5df] px-2 py-2 text-center">{index + 1}</td>
                <td className="w-40 border border-[#cfd5df] px-2 py-2">&nbsp;</td>
                <td className="border border-[#cfd5df] px-2 py-2">&nbsp;</td>
                <td className="w-48 border border-[#cfd5df] px-2 py-2">&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer className="mt-3 flex justify-between border-t border-[#d9dee7] pt-2 text-[10px] text-[#64748b]">
        <span>更新时间 {meta.updatedAt}</span>
        <span>{meta.orgUnitName} · {meta.horizon}</span>
      </footer>
    </article>
  );
}
