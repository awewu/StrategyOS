# StratOS · 2026 Q3 战略会彩排脚本

**版本：** v1.0 · 2026-06-14  
**时长：** 180 分钟 · 6 环节  
**应用入口：** `/rehearsal`  
**依据：** [EVOLUTION_PLAN.md](./EVOLUTION_PLAN.md) §9.3

---

## 会前准备（T-24h）

| 项 | 动作 |
|----|------|
| 数据 | `npm run db:seed` 或确认 Demo 模式 |
| 角色 | CEO / VP / PM 各一人登录彩排 |
| 报告 | Sheet1 待解析状态 |
| 打印 | `/print/panorama` A3 横版签到墙 |
| PDF | `/api/print/panorama` 归档版 |

---

## 环节一览

| # | 环节 | 时长 | 主路由 |
|---|------|------|--------|
| 1 | 开场 · Robust · Diff | 15m | `/command` |
| 2 | 资本 · CapStack · Gate | 30m | `/finance?tab=capital` |
| 3 | 产品 · ProdStack · TRL | 30m | `/strategy` · `/execution` |
| 4 | 增长 · Gtm · SPBP | 30m | `/strategy` · `/finance?tab=scenarios` |
| 5 | 解码 · Hoshin · 反馈环 | 45m | `/decode` · `/health` |
| 6 | 决议 · 快照 · Agent | 30m | `/versions` · `/reports` |

---

## 关键演示动作

1. **HardBlockBar** — 指挥舱顶部 runway 一票否决  
2. **投屏模式** — `/rehearsal` → **进入投屏模式**（全屏 · 环节计时 · ← → · Space）  
3. **SnapshotFreeze** — `/versions` 冻结演示（例外流）  
4. **Agent 全链路** — `/reports` → 运行 11-Agent 编排（LLM 可选）  
5. **SPBP nudge** — `/finance?tab=scenarios` → Q2 证据偏悲观  
6. **反事实 diff** — `/versions` 底部预览  

### 投屏快捷键

| 键 | 动作 |
|----|------|
| ← → | 切换环节 |
| Space | 暂停/继续计时 |
| Esc | 退出投屏 |

---

## 会后产出

- `{YYYY}-H1-STRATEGIC` 快照 FROZEN  
- StrategyPattern 章写入月报 §8  
- Gate 风险清单签字确认（`/gates` 导出打印）

---

*交互彩排见应用 `/rehearsal` · 逐步 Walkthrough*
