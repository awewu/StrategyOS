import type {
  LedgerBundle,
  TbDisplayRow,
} from "@/lib/finance/ledger-queries";

export type LedgerTab = "overview" | "tb" | "gl" | "facts" | "bridge" | "pvi" | "budget" | "accounts" | "depts" | "ops";

const nf = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 });
const money = (v: number | null) => (v == null ? "—" : nf.format(v));
const dateStr = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "—");

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  asset: "资产",
  liability: "负债",
  equity: "权益",
  revenue: "收入",
  expense: "费用",
  cost: "成本",
  other: "其他",
};

const SOURCE_LABEL: Record<string, string> = {
  account_map: "科目映射",
  dept_map: "部门映射",
  trial_balance: "试算平衡",
  gl_detail: "GL 明细",
  fact_entry: "情景事实",
  form_headcount: "人头表单",
  form_units: "发货表单",
  form_capex: "CapEx 表单",
};

const SCENARIO_KIND_LABEL: Record<string, string> = {
  actual: "实际",
  budget: "预算",
  mgmt_adj: "管理层调整",
  forecast: "滚动预测",
};

const BRIDGE_LABEL: Record<string, string> = {
  Volume: "量 Volume",
  Price: "价 Price",
  Mix: "结构 Mix",
  Inflation: "通胀 Inflation",
  CIP: "降本 CIP",
  New2Yr: "新品（2 年内）",
  New5Yr: "新品（5 年内）",
  StratInit1: "战略举措 1",
  StratInit2: "战略举措 2",
  StratInit3: "战略举措 3",
  StratInit4: "战略举措 4",
  Acquisition: "并购 Acquisition",
  OtherBridge: "其他",
};

const METRIC_LABEL: Record<string, string> = {
  headcount: "人头",
  units_shipped: "发货台数",
  capex: "CapEx（YTD）",
};

function SearchForm({ tab, q, period }: { tab: LedgerTab; q?: string; period?: string }) {
  return (
    <form method="get" action="/finance/ledger" className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="tab" value={tab} />
      {period ? <input type="hidden" name="period" value={period} /> : null}
      <input
        type="search"
        name="q"
        defaultValue={q ?? ""}
        placeholder="按科目码 / 名称 / 美国科目搜索…"
        className="stratos-input w-64 text-sm"
      />
      <button type="submit" className="stratos-btn stratos-btn--ghost text-xs">
        搜索
      </button>
    </form>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="stratos-card stratos-card--padded">
      <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-muted,#888)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-[var(--color-text-muted,#888)]">{hint}</p> : null}
    </div>
  );
}

function OverviewPanel({ bundle }: { bundle: LedgerBundle }) {
  const o = bundle.overview;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="科目" value={nf.format(o.accounts)} hint={o.accountsUnmapped > 0 ? `${o.accountsUnmapped} 个未映射美国科目` : "映射完整"} />
        <StatCard label="部门" value={nf.format(o.departments)} />
        <StatCard label="TB 行" value={nf.format(o.tbLines)} />
        <StatCard label="GL 行" value={nf.format(o.glLines)} />
        <StatCard label="运营事实" value={nf.format(o.opsFacts)} />
        <StatCard label="期间" value={o.periods[0] ?? "—"} hint={o.periods.length > 1 ? `共 ${o.periods.length} 个期间` : undefined} />
      </div>

      {o.glBalance.length > 0 ? (
        <div className="stratos-card stratos-card--padded space-y-2">
          <h3 className="text-sm font-semibold">GL 借贷平衡校验</h3>
          {o.glBalance.map((b) => {
            const balanced = Math.abs(b.debit - b.credit) < 0.005;
            return (
              <p key={b.period} className="text-sm">
                {b.period} · 借 {money(b.debit)} / 贷 {money(b.credit)} ·{" "}
                <span style={{ color: balanced ? "var(--signal-green)" : "var(--signal-red)" }}>
                  {balanced ? "平衡 ✓" : `差额 ${money(b.debit - b.credit)}`}
                </span>
              </p>
            );
          })}
        </div>
      ) : null}

      <div className="stratos-card stratos-card--padded">
        <h3 className="mb-3 text-sm font-semibold">导入批次台账（最近 20 条）</h3>
        <div className="stratos-table-wrap">
          <table className="stratos-table">
            <thead>
              <tr>
                <th>来源</th>
                <th>文件</th>
                <th>工作表</th>
                <th>期间</th>
                <th className="text-right">行数</th>
                <th>状态</th>
                <th>导入时间</th>
              </tr>
            </thead>
            <tbody>
              {o.batches.map((b) => (
                <tr key={b.id}>
                  <td>{SOURCE_LABEL[b.sourceType] ?? b.sourceType}</td>
                  <td className="max-w-[220px] truncate" title={b.fileName}>{b.fileName}</td>
                  <td>{b.sheetName ?? "—"}</td>
                  <td>{b.period ?? "—"}</td>
                  <td className="text-right">{nf.format(b.rowCount)}</td>
                  <td>
                    <span style={{ color: b.status === "imported" ? "var(--signal-green)" : b.status === "failed" ? "var(--signal-red)" : "var(--signal-yellow)" }}>
                      {b.status === "imported" ? "已导入" : b.status === "failed" ? "失败" : "待处理"}
                    </span>
                  </td>
                  <td>{dateStr(b.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function tbTotals(rows: TbDisplayRow[]) {
  return rows.reduce(
    (acc, r) => {
      acc.opening += r.opening ?? 0;
      acc.debit += r.debit ?? 0;
      acc.credit += r.credit ?? 0;
      acc.closing += r.closing;
      return acc;
    },
    { opening: 0, debit: 0, credit: 0, closing: 0 },
  );
}

function TbPanel({ bundle, q, period }: { bundle: LedgerBundle; q?: string; period?: string }) {
  const rows = bundle.tbRows.filter((r) => r.closing !== 0 || r.opening !== 0 || (r.debit ?? 0) !== 0);
  const totals = tbTotals(rows);
  return (
    <div className="space-y-4">
      <SearchForm tab="tb" q={q} period={period} />
      <div className="stratos-card stratos-card--padded">
        <h3 className="mb-3 text-sm font-semibold">
          科目余额表（本币）· {rows.length} 个有发生额科目
        </h3>
        <div className="stratos-table-wrap">
          <table className="stratos-table">
            <thead>
              <tr>
                <th>科目</th>
                <th>名称</th>
                <th>类型</th>
                <th>美国科目</th>
                <th className="text-right">期初</th>
                <th className="text-right">借方</th>
                <th className="text-right">贷方</th>
                <th className="text-right">期末</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.accountCode}>
                  <td className="font-mono text-xs">{r.accountCode}</td>
                  <td className="max-w-[240px] truncate" title={r.accountName ?? undefined}>{r.accountName ?? "—"}</td>
                  <td>{r.accountType ? ACCOUNT_TYPE_LABEL[r.accountType] ?? r.accountType : "—"}</td>
                  <td className="max-w-[180px] truncate" title={r.usAccountDesc ?? undefined}>
                    {r.usAccountCode ? `${r.usAccountCode} ${r.usAccountDesc ?? ""}` : <span style={{ color: "var(--signal-yellow)" }}>未映射</span>}
                  </td>
                  <td className="text-right font-mono text-xs">{money(r.opening)}</td>
                  <td className="text-right font-mono text-xs">{money(r.debit)}</td>
                  <td className="text-right font-mono text-xs">{money(r.credit)}</td>
                  <td className="text-right font-mono text-xs font-semibold">{money(r.closing)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td colSpan={4}>合计</td>
                <td className="text-right font-mono text-xs">{money(totals.opening)}</td>
                <td className="text-right font-mono text-xs">{money(totals.debit)}</td>
                <td className="text-right font-mono text-xs">{money(totals.credit)}</td>
                <td className="text-right font-mono text-xs">{money(totals.closing)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

function GlPanel({ bundle, q, period }: { bundle: LedgerBundle; q?: string; period?: string }) {
  return (
    <div className="space-y-4">
      <SearchForm tab="gl" q={q} period={period} />
      <div className="stratos-card stratos-card--padded">
        <h3 className="mb-3 text-sm font-semibold">GL 日记账明细 · 按金额降序（前 200 条）</h3>
        <div className="stratos-table-wrap">
          <table className="stratos-table">
            <thead>
              <tr>
                <th>日期</th>
                <th>凭证</th>
                <th>科目</th>
                <th>名称</th>
                <th>部门码</th>
                <th>方向</th>
                <th className="text-right">金额</th>
              </tr>
            </thead>
            <tbody>
              {bundle.glRows.map((r, i) => (
                <tr key={i}>
                  <td>{dateStr(r.entryDate)}</td>
                  <td className="font-mono text-xs">{r.journalNo ?? "—"}</td>
                  <td className="font-mono text-xs">{r.accountCode}</td>
                  <td className="max-w-[240px] truncate" title={r.accountName ?? undefined}>{r.accountName ?? "—"}</td>
                  <td className="font-mono text-xs">{r.dim1 ?? "—"}</td>
                  <td style={{ color: r.drcr === "dr" ? "var(--color-accent)" : "inherit" }}>{r.drcr === "dr" ? "借" : "贷"}</td>
                  <td className="text-right font-mono text-xs">{money(r.amount)} {r.currency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AccountsPanel({ bundle, q, period }: { bundle: LedgerBundle; q?: string; period?: string }) {
  return (
    <div className="space-y-4">
      <SearchForm tab="accounts" q={q} period={period} />
      <div className="stratos-card stratos-card--padded">
        <h3 className="mb-3 text-sm font-semibold">科目主数据 · 中→美映射（{bundle.accountRows.length} 条）</h3>
        <div className="stratos-table-wrap">
          <table className="stratos-table">
            <thead>
              <tr>
                <th>中方科目</th>
                <th>说明</th>
                <th>类型</th>
                <th>美国科目</th>
                <th>美国科目描述</th>
                <th>合并到</th>
              </tr>
            </thead>
            <tbody>
              {bundle.accountRows.map((r) => (
                <tr key={r.code}>
                  <td className="font-mono text-xs">{r.code}</td>
                  <td className="max-w-[260px] truncate" title={r.name}>{r.name}</td>
                  <td>{ACCOUNT_TYPE_LABEL[r.accountType] ?? r.accountType}</td>
                  <td className="font-mono text-xs">
                    {r.usAccountCode ?? <span style={{ color: "var(--signal-yellow)" }}>未映射</span>}
                  </td>
                  <td className="max-w-[220px] truncate" title={r.usAccountDesc ?? undefined}>{r.usAccountDesc ?? "—"}</td>
                  <td className="font-mono text-xs">{r.consolidateTo ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FactsPanel({ bundle, q, period }: { bundle: LedgerBundle; q?: string; period?: string }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {bundle.scenarioSummaries.map((s) => (
          <div key={s.code} className="stratos-card stratos-card--padded">
            <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-muted,#888)]">
              {SCENARIO_KIND_LABEL[s.kind] ?? s.kind}
            </p>
            <p className="mt-1 truncate text-sm font-semibold" title={s.code}>{s.name}</p>
            <p className="mt-1 font-mono text-lg">{money(s.total)}</p>
            <p className="text-[11px] text-[var(--color-text-muted,#888)]">{nf.format(s.factCount)} 条事实</p>
          </div>
        ))}
      </div>

      <SearchForm tab="facts" q={q} period={period} />

      <div className="stratos-card stratos-card--padded">
        <h3 className="mb-3 text-sm font-semibold">情景事实（OneStream JE 装载 · 前 600 条）</h3>
        <div className="stratos-table-wrap">
          <table className="stratos-table">
            <thead>
              <tr>
                <th>情景</th>
                <th>期间</th>
                <th>科目/指标</th>
                <th>说明</th>
                <th>部门</th>
                <th>产品</th>
                <th>利润桥</th>
                <th className="text-right">金额</th>
              </tr>
            </thead>
            <tbody>
              {bundle.factRows.map((r, i) => (
                <tr key={i}>
                  <td title={r.scenarioName}>{SCENARIO_KIND_LABEL[r.scenarioKind] ?? r.scenarioKind}</td>
                  <td>{r.period}</td>
                  <td className="font-mono text-xs">{r.accountCode ?? r.metricCode ?? "—"}</td>
                  <td className="max-w-[200px] truncate" title={r.label ?? undefined}>{r.label ?? "—"}</td>
                  <td className="font-mono text-xs">{r.deptCode ?? "—"}</td>
                  <td className="font-mono text-xs">{r.productCode ?? "—"}</td>
                  <td>{r.bridgeCode ?? "—"}</td>
                  <td className="text-right font-mono text-xs">{money(r.amount)} {r.currency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BridgePanel({ bundle }: { bundle: LedgerBundle }) {
  if (bundle.bridgeWalks.length === 0) {
    return <div className="stratos-card stratos-card--padded text-sm">暂无利润桥事实（需先导入 JE 装载页）。</div>;
  }
  return (
    <div className="space-y-6">
      {bundle.bridgeWalks.map((walk) => {
        const maxAbs = Math.max(...walk.items.map((i) => Math.abs(i.cumulative)), Math.abs(walk.total), 1);
        return (
          <div key={walk.scenarioCode} className="stratos-card stratos-card--padded">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold">
                {SCENARIO_KIND_LABEL[walk.scenarioKind] ?? walk.scenarioKind} · {walk.scenarioName}
              </h3>
              <span className="font-mono text-sm">
                净影响 {money(walk.total)} USD
              </span>
            </div>
            <div className="space-y-2">
              {walk.items.map((item) => {
                const barW = `${Math.max(Math.round((Math.abs(item.cumulative) / maxAbs) * 100), 2)}%`;
                const positive = item.amount >= 0;
                return (
                  <div key={item.bridgeCode} className="space-y-0.5">
                    <div className="flex items-center justify-between text-xs">
                      <span>{BRIDGE_LABEL[item.bridgeCode] ?? item.bridgeCode}</span>
                      <span className="font-mono">
                        <span style={{ color: positive ? "var(--signal-green)" : "var(--signal-red)" }}>
                          {positive ? "+" : ""}{money(item.amount)}
                        </span>
                        <span className="ml-3 text-[var(--color-text-muted,#888)]">累计 {money(item.cumulative)}</span>
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
                      <div
                        className="h-full rounded-full"
                        style={{ width: barW, background: positive ? "var(--signal-green)" : "var(--signal-red)" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[11px] text-[var(--color-text-muted,#888)]">
              按 OneStream UD5 利润桥维度聚合（量→价→结构→降本→新品→战略举措→其他），台数类指标已排除。
            </p>
          </div>
        );
      })}
    </div>
  );
}

function PviPanel({ bundle, q, period }: { bundle: LedgerBundle; q?: string; period?: string }) {
  return (
    <div className="space-y-4">
      <SearchForm tab="pvi" q={q} period={period} />
      {bundle.pviGroups.map((g) => (
        <div key={g.businessUnit} className="stratos-card stratos-card--padded">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold">{g.businessUnit}</h3>
            <span className="text-xs text-[var(--color-text-muted,#888)]">
              {g.productCount} 个新品 · 全年 <span className="font-mono">{money(g.total)}</span> （$000s）
            </span>
          </div>
          <div className="stratos-table-wrap">
            <table className="stratos-table">
              <thead>
                <tr>
                  <th>新品</th>
                  <th>品类</th>
                  <th>渠道</th>
                  <th>上市</th>
                  <th className="text-right">有销售月数</th>
                  <th className="text-right">全年销售（$000s）</th>
                </tr>
              </thead>
              <tbody>
                {g.products.map((p) => (
                  <tr key={p.productName}>
                    <td className="max-w-[220px] truncate" title={p.productName}>{p.productName}</td>
                    <td className="max-w-[180px] truncate" title={p.category ?? undefined}>{p.category ?? "—"}</td>
                    <td>{p.channel ?? "—"}</td>
                    <td className="font-mono text-xs">{p.launchPeriod ?? "—"}</td>
                    <td className="text-right font-mono text-xs">{p.months}</td>
                    <td className="text-right font-mono text-xs">{money(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      {bundle.pviGroups.length === 0 ? (
        <div className="stratos-card stratos-card--padded text-sm">暂无 PVI 新品数据。</div>
      ) : null}
    </div>
  );
}

function DeptsPanel({ bundle }: { bundle: LedgerBundle }) {
  return (
    <div className="stratos-card stratos-card--padded">
      <h3 className="mb-3 text-sm font-semibold">部门主数据 · 单位码 → US Department（{bundle.deptRows.length} 条）</h3>
      <div className="stratos-table-wrap">
        <table className="stratos-table">
          <thead>
            <tr>
              <th>单位码</th>
              <th>部门</th>
              <th>US 部门码</th>
              <th>US 部门</th>
              <th>P&L 层级</th>
              <th>层级描述</th>
            </tr>
          </thead>
          <tbody>
            {bundle.deptRows.map((r) => (
              <tr key={r.code}>
                <td className="font-mono text-xs">{r.code}</td>
                <td className="max-w-[240px] truncate" title={r.name}>{r.name}</td>
                <td className="font-mono text-xs">{r.usDeptCode ?? "—"}</td>
                <td>{r.usDeptName ?? "—"}</td>
                <td className="font-mono text-xs">{r.plLevelCode ?? "—"}</td>
                <td>{r.plLevelName ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OpsPanel({ bundle }: { bundle: LedgerBundle }) {
  return (
    <div className="space-y-4">
      {bundle.opsGroups.map((g) => (
        <div key={g.metricType} className="stratos-card stratos-card--padded">
          <h3 className="mb-3 text-sm font-semibold">
            {METRIC_LABEL[g.metricType] ?? g.metricType}
            {g.unit ? <span className="ml-2 text-xs font-normal text-[var(--color-text-muted,#888)]">单位：{g.unit}</span> : null}
          </h3>
          <div className="stratos-table-wrap">
            <table className="stratos-table">
              <thead>
                <tr>
                  <th>期间</th>
                  <th>维度 1</th>
                  <th>维度 2</th>
                  <th className="text-right">数值</th>
                </tr>
              </thead>
              <tbody>
                {g.facts.map((f, i) => (
                  <tr key={i}>
                    <td>{f.period}</td>
                    <td className="max-w-[240px] truncate" title={f.dim1 ?? undefined}>{f.dim1 ?? "—"}</td>
                    <td className="max-w-[240px] truncate" title={f.dim2 ?? undefined}>{f.dim2 ?? "—"}</td>
                    <td className="text-right font-mono text-xs">{money(f.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      {bundle.opsGroups.length === 0 ? (
        <div className="stratos-card stratos-card--padded text-sm">暂无运营指标数据。</div>
      ) : null}
    </div>
  );
}

export function LedgerPanels({
  tab,
  bundle,
  q,
  period,
}: {
  tab: LedgerTab;
  bundle: LedgerBundle;
  q?: string;
  period?: string;
}) {
  if (tab === "tb") return <TbPanel bundle={bundle} q={q} period={period} />;
  if (tab === "gl") return <GlPanel bundle={bundle} q={q} period={period} />;
  if (tab === "facts") return <FactsPanel bundle={bundle} q={q} period={period} />;
  if (tab === "bridge") return <BridgePanel bundle={bundle} />;
  if (tab === "pvi") return <PviPanel bundle={bundle} q={q} period={period} />;
  if (tab === "accounts") return <AccountsPanel bundle={bundle} q={q} period={period} />;
  if (tab === "depts") return <DeptsPanel bundle={bundle} />;
  if (tab === "ops") return <OpsPanel bundle={bundle} />;
  return <OverviewPanel bundle={bundle} />;
}
