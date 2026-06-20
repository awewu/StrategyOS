# StratOS · Phase 2 交付说明

**版本：** v0.3 · 2026-06-14  
**前置：** [MVP_PLUS_COMPLETE.md](./MVP_PLUS_COMPLETE.md) 已全部闭合

---

## 一、Phase 2 范围（已完成）

| 模块 | 理论 | 交付 |
|------|------|------|
| **I6 三层面** | McKinsey Horizons | `/execution` · HorizonBubbleChart |
| **I7 Hoshin** | X-Matrix | `/decode` · BSC / Hoshin Tab |
| **十二维** | 战略部下钻 | `/health` · staff/vp 角色可见 TwelveDimPanel |
| **角色视图** | UI_VI §4.2 | RoleSwitcher · 五角色 |
| **⌘K** | Command Palette | 全局模块跳转 |
| **DB 层** | Prisma | `lib/db.ts` · `lib/data/strategy-data.ts` · `/api/health` |

---

## 二、Phase 2+ 范围（本批 · 已完成）

| 模块 | 理论 | 交付 |
|------|------|------|
| **5 年 FPA** | StratFinance | `/finance?tab=forecast` · FiveYearForecast |
| **敏感性** | SPBP | SensitivityPanel · 驱动变量 → 利润影响 |
| **SPBP 2.0** | 情景概率 | `/finance?tab=scenarios` · 加权期望 runway |
| **M&A 管道** | MaPipelineItem | `/finance?tab=ma` · watch→integrating Kanban |
| **Real Options** | 分阶段投资 | 资本 Tab · 放弃权 + stage gate |
| **投后偏离** | IC ROI 追踪 | 资本 Tab · CAPEX/IRR 偏离表 |
| **AARRR** | 增长漏斗 | `/strategy` · 哪一段漏 |
| **Keller** | 品牌金字塔 | `/strategy` · RUUD 六层得分 |
| **R6 加权** | StratRobust | `lib/stratos/robust-score.ts` · R1–R6 权重 |
| **战略顾问** | SPBP 摘要 | `/command` · ScenarioAdvisor 卡片 |

---

## 三、路由 / Tab

| 路径 | 说明 |
|------|------|
| `/decode` | StratDecode · BSC 地图 ↔ Hoshin X-Matrix |
| `/finance?tab=forecast` | 5 年 B-A-F + 敏感性 |
| `/finance?tab=scenarios` | SPBP 概率 living model |
| `/finance?tab=ma` | M&A 四方向管道 |
| `/api/health` | 数据源 database/demo · 表计数 |

---

## 四、角色默认着陆

| 角色 | 默认页 |
|------|--------|
| CEO / observer | `/command` |
| VP | `/strategy` |
| PM | `/execution` |
| staff | `/reports` |

---

## 五、仍属 Phase 3（未做）

- 全页 Prisma 实连（部分页仍 demo fallback）
- Login / SSO · WorkOS 或企业 IdP
- CEO 一页纸 **服务端 PDF** 生成
- TechSignal · RICE 深集成
- StratSim 反馈环 R/B/D · 系统动力学
- 11 agents · TRL radar · counterfactual diff
- 贝叶斯概率每季自动更新（现 SPBP 为演示数据）

---

## 六、数据库启用

```bash
cp .env.example .env
npm run db:migrate
npm run db:seed
```

无 DATABASE_URL 时自动回退 `lib/stratos-demo-data.ts`。

---

*Phase 2 + Phase 2+ UI 已就绪 · 见 [PHASE3.md](./PHASE3.md) 继续交付*
