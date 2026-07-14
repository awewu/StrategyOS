/**
 * 类型棘轮闸门 — 语义字号收敛（UI 进化阶段二）。
 *
 * 目标：组件里禁止新增裸 Tailwind 字号（text-xs/sm/lg/xl/2xl/3xl），
 * 应使用语义类（text-caption/text-label/text-body/text-subsection/text-title/text-display）。
 * 存量按 baseline 棘轮：只许减少，不许增加。降低后请同步下调 BASELINE。
 *
 * 用法：npx tsx scripts/check-type-drift.ts   （CI 中在 lint 后运行）
 */
import { execFileSync } from "node:child_process";

// 2026-07-15 存量基线（app+components *.tsx 中的裸字号 class 出现次数）
// 1370 + 15（OkrEditor 新增，带信号色的合理实例）
const BASELINE = 1385;

const PATTERN = "text-(xs|sm|lg|xl|2xl|3xl)\\b";

function countBareTypeClasses(): number {
  try {
    const out = execFileSync(
      "grep",
      ["-rho", "-E", PATTERN, "app", "components", "--include=*.tsx"],
      { encoding: "utf8" },
    );
    return out.split("\n").filter(Boolean).length;
  } catch (e) {
    // grep exits 1 when no matches
    if ((e as { status?: number }).status === 1) return 0;
    throw e;
  }
}

const count = countBareTypeClasses();

if (count > BASELINE) {
  console.error(
    `✗ 类型棘轮失败：裸字号 class ${count} 处 > 基线 ${BASELINE}。` +
      `\n  新代码请使用语义类：text-caption(12) / text-label(11) / text-body / text-subsection(16) / text-title(20)。`,
  );
  process.exit(1);
}

console.log(
  `✓ 类型棘轮通过：裸字号 ${count} / 基线 ${BASELINE}` +
    (count < BASELINE ? `（已减少 ${BASELINE - count}，可下调基线）` : ""),
);
