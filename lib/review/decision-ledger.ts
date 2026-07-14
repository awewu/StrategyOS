/**
 * 决策记分卡（Decision Ledger）— 决策命中率闭环。
 *
 * 系统记录了决策(Gate verdict / Bet 状态 / 假设结案)并随快照冻结,
 * 本模块回头算账:上一版快照里的 go/kill 判断,到本版兑现了几成。
 * 输出透明清单而非单一总分(对齐「Gate 清单 > 假分数」)。
 *
 * 纯函数:输入两个相邻快照的 SnapshotStatePayload,零 DB 依赖,可单测。
 */
import type { BetGateStatus, SnapshotStatePayload } from "@/lib/types/stratos";

export interface GateReversal {
  objectType: "investment_case" | "product_bet" | "gtm_bet";
  title: string;
  fromStatus: BetGateStatus;
  toStatus: BetGateStatus | "missing";
}

export interface DecisionLedger {
  /** go 判断复核:上版 approved/post_invest 的 Bet,本版仍存活的占比 */
  gate: {
    total: number;
    held: number;
    hitRatePct: number | null;
    reversals: GateReversal[];
  };
  /** kill 判断复核:上版 killed/rejected、本版却复活(approved+)的 Bet — 当初 kill 可能错杀 */
  revivals: GateReversal[];
  /** 假设结案纪律:上版 pending 的假设,本版结案(validated/failed)率 */
  assumptions: {
    pendingAtFrom: number;
    resolved: number;
    validated: number;
    failed: number;
    resolutionRatePct: number | null;
    newlyFailed: string[];
  };
  /** 预测校准:上版 forecast vs 本版 actual 的偏差(%) */
  forecast: {
    revenueBiasPct: number | null;
    profitBiasPct: number | null;
  };
  /** 复盘提示(供战略会议程) */
  prompts: string[];
}

const GO_STATUSES: BetGateStatus[] = ["approved", "post_invest"];
const KILL_STATUSES: BetGateStatus[] = ["killed", "rejected"];

interface BetLike {
  id: string;
  title: string;
  gateStatus: BetGateStatus;
}

function collectBets(
  payload: SnapshotStatePayload,
): Array<BetLike & { objectType: GateReversal["objectType"] }> {
  return [
    ...(payload.investmentCases ?? []).map((b) => ({ ...b, objectType: "investment_case" as const })),
    ...(payload.productBets ?? []).map((b) => ({ ...b, objectType: "product_bet" as const })),
    ...(payload.gtmBets ?? []).map((b) => ({ ...b, objectType: "gtm_bet" as const })),
  ];
}

function biasPct(forecast: number | undefined, actual: number | undefined): number | null {
  if (forecast === undefined || actual === undefined || actual === 0) return null;
  return Math.round(((forecast - actual) / actual) * 1000) / 10;
}

export function buildDecisionLedger(
  from: SnapshotStatePayload,
  to: SnapshotStatePayload,
): DecisionLedger {
  const fromBets = collectBets(from);
  const toBets = collectBets(to);
  const toById = new Map(toBets.map((b) => [b.id, b]));

  // — go 判断复核 —
  const goBets = fromBets.filter((b) => GO_STATUSES.includes(b.gateStatus));
  const reversals: GateReversal[] = [];
  let held = 0;
  for (const bet of goBets) {
    const now = toById.get(bet.id);
    if (now && GO_STATUSES.includes(now.gateStatus)) {
      held++;
    } else {
      reversals.push({
        objectType: bet.objectType,
        title: bet.title,
        fromStatus: bet.gateStatus,
        toStatus: now?.gateStatus ?? "missing",
      });
    }
  }

  // — kill 判断复核(复活即当初可能错杀) —
  const revivals: GateReversal[] = [];
  for (const bet of fromBets.filter((b) => KILL_STATUSES.includes(b.gateStatus))) {
    const now = toById.get(bet.id);
    if (now && GO_STATUSES.includes(now.gateStatus)) {
      revivals.push({
        objectType: bet.objectType,
        title: bet.title,
        fromStatus: bet.gateStatus,
        toStatus: now.gateStatus,
      });
    }
  }

  // — 假设结案纪律 —
  const pendingAtFrom = (from.assumptions ?? []).filter((a) => a.result === "pending");
  const toAssumptions = new Map((to.assumptions ?? []).map((a) => [a.id, a]));
  let validated = 0;
  const newlyFailed: string[] = [];
  for (const a of pendingAtFrom) {
    const now = toAssumptions.get(a.id);
    if (!now) continue;
    if (now.result === "validated") validated++;
    if (now.result === "failed") newlyFailed.push(`${a.code} ${a.content}`);
  }
  const resolved = validated + newlyFailed.length;

  // — 预测校准 —
  const revenueBiasPct = biasPct(from.fpa?.revenueForecast, to.fpa?.revenueActual);
  const profitBiasPct = biasPct(from.fpa?.profitForecast, to.fpa?.profitActual);

  // — 复盘提示 —
  const prompts: string[] = [];
  if (reversals.length > 0) {
    prompts.push(`上版 go 的 ${reversals.length} 项本版翻车(kill/停/失踪)——复盘当时 Gate 依据的证据级别`);
  }
  if (revivals.length > 0) {
    prompts.push(`上版 kill 的 ${revivals.length} 项本版复活——复盘当初否决是否过严`);
  }
  if (pendingAtFrom.length > 0 && resolved / pendingAtFrom.length < 0.5) {
    prompts.push("过半假设跨版未结案——假设验证节律失效,检查 testPlan 与责任人");
  }
  if (revenueBiasPct !== null && Math.abs(revenueBiasPct) > 15) {
    prompts.push(
      `营收预测偏差 ${revenueBiasPct > 0 ? "+" : ""}${revenueBiasPct}%——${revenueBiasPct > 0 ? "系统性乐观" : "系统性保守"},下版预测建议校准`,
    );
  }

  return {
    gate: {
      total: goBets.length,
      held,
      hitRatePct: goBets.length === 0 ? null : Math.round((held / goBets.length) * 100),
      reversals,
    },
    revivals,
    assumptions: {
      pendingAtFrom: pendingAtFrom.length,
      resolved,
      validated,
      failed: newlyFailed.length,
      resolutionRatePct:
        pendingAtFrom.length === 0 ? null : Math.round((resolved / pendingAtFrom.length) * 100),
      newlyFailed,
    },
    forecast: { revenueBiasPct, profitBiasPct },
    prompts,
  };
}
