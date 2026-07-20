/**
 * BSC 单一读取门面（P2-1b）。
 *
 * BSC 有三个合法 facet，此前由消费方各自拼装：
 *  - rows   ：战略地图行（objective/mustWin/operating/mustNotFail）—— getDecodeBsc
 *  - lights ：四维信号灯 —— getBscLights（HealthSignal）
 *  - cards  ：四满意卡 —— getBscCards（bsc-config + lights）
 * 本门面提供唯一入口 getBscView，统一装配点，避免消费方重复 fetch / 各自为政。
 */
import { getDecodeBsc } from "@/lib/decode/data-access";
import { getBscLights, getBscCards } from "@/lib/data/entity-getters";
import type { BscDimensionRow } from "@/lib/decode/bsc-map";
import type { TrafficLight } from "@/lib/types/stratos";

export interface BscView {
  rows: BscDimensionRow[];
  lights: Record<"financial" | "customer" | "process" | "learning", TrafficLight>;
  cards: Awaited<ReturnType<typeof getBscCards>>;
  source: "database" | "demo";
}

/** 一次性装配 BSC 三 facet（rows / lights / cards）。 */
export async function getBscView(period?: string): Promise<BscView> {
  const [decode, lights, cards] = await Promise.all([
    getDecodeBsc(period),
    getBscLights(),
    getBscCards(),
  ]);
  return { rows: decode.rows, source: decode.source, lights, cards };
}

export { getDecodeBsc, getBscLights, getBscCards };
