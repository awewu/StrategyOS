# StratOS · 战略沙盘

瑞合瑞德战略推演系统 — Next.js 16 + Prisma 5 + Tailwind 4

**产品总纲：** [docs/STRATOS_BLUEPRINT.md](./docs/STRATOS_BLUEPRINT.md) · [docs/README.md](./docs/README.md)

**价值与竞对：** [docs/COMPETITIVE_ANALYSIS.md](./docs/COMPETITIVE_ANALYSIS.md) — 价值总结 · 行业对标 · 企业自用结论 · Hermes · SWOT/五力

**Phase 2：** [docs/PHASE2.md](./docs/PHASE2.md) · `/decode` · 三层面气泡 · ⌘K · 角色切换

## 本地开发

```bash
npm install
npm run setup    # .env + 字体 + Docker Postgres + seed
npm run dev
```

访问 [http://localhost:3003](http://localhost:3003) → 自动进入 **指挥舱**（端口 3003，避免与 3000 上其他项目冲突）

**环境配置：** [docs/SETUP.md](./docs/SETUP.md) · **战略导入：** [docs/STRATEGY_IMPORT.md](./docs/STRATEGY_IMPORT.md) · **McKinsey 框架：** [docs/MCKINSEY_STRATEGY_FRAMEWORK.md](./docs/MCKINSEY_STRATEGY_FRAMEWORK.md) · **UI/VI 进化：** [docs/UI_VI_EVOLUTION.md](./docs/UI_VI_EVOLUTION.md)

**能力检查：** [http://localhost:3003/api/health](http://localhost:3003/api/health)

**工程交付：** [docs/DELIVERY.md](./docs/DELIVERY.md) · `npm run harness:ci` · `npm run build` · GitLab CI

**看战略一页纸：** [http://localhost:3003/strategy](http://localhost:3003/strategy)

## 页面路由

| 路径 | 视图 |
|------|------|
| `/command` | 指挥舱（CEO 默认） |
| `/strategy` | 看战略 · 诊断 + 三栈 + WTP/HTW |
| `/execution` | 看执行 · 4DX + Vx + Cynefin |
| `/health` | 看健康 · 四灯 + 8 KPI + B-A-F |
| `/finance` | FPA 总览 |
| `/finance?tab=capital` | FPA 资本 Tab |
| `/versions` | 版本库 · StratDiff |
| `/print/panorama` | **A3 董事会一页纸**（Light · 可打印 PDF） |
| `/brand` | **Brand Gallery** — 全部 VI 资产 |
| `/reports` | 报告中心 · MON-RPT §8 |
| `/gates` | Invest / Innovate / Deliver / 五事 Gate |
| `/api/fpa/capital-summary` | CapStack 一行摘要 JSON |

**MVP+ 验收：** [docs/MVP_PLUS_COMPLETE.md](./docs/MVP_PLUS_COMPLETE.md)

## 品牌 VI

- 规范：[docs/BRAND_VI.md](./docs/BRAND_VI.md)
- 资产：`public/brand/*.png` · `public/icon.svg` · `public/logo-mark.svg`
- Token：`lib/brand/tokens.ts` · `app/globals.css`

## 数据库

```bash
npm run setup              # 推荐：含 docker compose + migrate + seed
# 或手动：
cp .env.example .env
docker compose up -d
npm run db:push && npm run db:seed
```

## 核心代码

- `prisma/schema.prisma` — MVP+ 35 表
- `lib/stratos/` — freeze · assertion · diff · fpa-toggle
- `lib/stratos-demo-data.ts` — 瑞合瑞德示例（UI 演示）
- `docs/OBJECT_MODEL.md` · `docs/STRATDIFF_RULES.md` · `docs/FPA_CAPITAL_TAB.md`

## 常用命令

```bash
npm run harness        # 全量自检（quick）
npm run harness:full   # 含 build + HTTP 冒烟
npm run check          # CI 门禁
```

```bash
npm run dev
npm run build
npm run lint
```
