/**
 * CEO Gem「帅」— 向后兼容再导出。
 * 实现已收敛进统一引擎 lib/gems/builders.ts (buildCeoGem), 避免逻辑重复/漂移。
 * 旧调用方 (app/api/gems/ceo/route.ts) 继续可用。
 */
export { buildCeoGem as buildCeoGemInsights } from "./builders";
