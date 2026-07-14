export interface HorizonBubble {
  code: string;
  name: string;
  horizon: "H1" | "H2" | "H3";
  budget: number;
  progress: number;
  expectedReturn: number;
}

const HORIZON_COLOR = {
  H1: "var(--stack-cap)",
  H2: "var(--stack-prod)",
  H3: "var(--bsc-customer)",
};

export function HorizonBubbleChart({ items }: { items: HorizonBubble[] }) {
  const maxBudget = Math.max(...items.map((i) => i.budget), 1);

  return (
    <section className="rounded-lg border border-[var(--surface-border)] bg-[var(--color-bg-surface)] p-6">
      <h2 className="mb-2 text-sm font-medium text-[var(--color-text-muted)]">
        三层面组合 · I6 Horizon Bubble
      </h2>
      <p className="mb-4 text-xs text-[var(--color-text-muted)]">
        X = 预算投入 · Y = 预期回报 · 大小 = 预算 · H3 禁止绑年度财务 OKR
      </p>
      <div className="relative h-64 rounded border border-[var(--surface-border)] bg-[var(--color-bg-deep)]">
        {items.map((item) => {
          const x = (item.budget / maxBudget) * 85 + 5;
          const y = 90 - item.expectedReturn * 0.8;
          const size = 24 + (item.budget / maxBudget) * 40;
          return (
            <div
              key={item.code}
              className="absolute flex items-center justify-center rounded-full border-2 font-data text-xs font-medium"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: size,
                height: size,
                transform: "translate(-50%, -50%)",
                borderColor: HORIZON_COLOR[item.horizon],
                color: HORIZON_COLOR[item.horizon],
                opacity: 0.85,
              }}
              title={`${item.name} · ${item.progress}%`}
            >
              {item.code}
            </div>
          );
        })}
        <div className="absolute bottom-2 right-3 text-[11px] text-[var(--color-text-muted)]">
          → 投入
        </div>
        <div className="absolute left-2 top-2 text-[11px] text-[var(--color-text-muted)]">
          ↑ 回报
        </div>
      </div>
      <div className="mt-3 flex gap-4 text-xs">
        {(["H1", "H2", "H3"] as const).map((h) => (
          <span key={h} style={{ color: HORIZON_COLOR[h] }}>
            ● {h}
          </span>
        ))}
      </div>
    </section>
  );
}
