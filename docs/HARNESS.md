# StratOS Harness · 全量自检工程

Harness 是 StratOS 的统一质量门禁：环境能力、结构清单、数据库种子、单元测试、构建与 HTTP 冒烟，一次跑完。

## 命令

| 命令 | 说明 |
|------|------|
| `npm run harness` | **Quick** — 能力 + 文件清单 + 路由清单 + DB + 单元测试 |
| `npm run harness:full` | **Full** — Quick + ESLint + `next build` + HTTP 冒烟（需 dev server） |
| `npm run harness:ci` | **CI** — Quick + ESLint（不 build，由 CI job 单独 build） |
| `npm run check` | 别名 → `harness:ci` |

### 选项

```bash
npm run harness -- --json              # 输出 harness-report.json
npm run harness -- --skip-tests        # 跳过单元测试
npm run harness -- --skip-build        # full 模式下跳过 build
npm run harness -- --url=http://127.0.0.1:3001   # 指定 HTTP 冒烟 base URL
```

环境变量：`STRATOS_HARNESS_BASE_URL`（同 `--url`）

## HTTP 端点

`GET /api/harness` — 运行时自检（无 subprocess，适合 K8s / 负载均衡探针）

返回 JSON：`{ summary, checks, exitCode, profile }`

- `200` — 无 fail
- `503` — 存在 fail 项

`GET /api/health` — 轻量能力摘要（mode / db / fonts / llm / workos）

## 检查项

| ID | 分组 | 说明 |
|----|------|------|
| `env` | env | `.env` / `DATABASE_URL` |
| `capabilities` | env | full/demo · db · fonts · llm · workos |
| `fonts` | assets | NotoSansSC OTF |
| `files` | structure | Phase 4 必需文件 |
| `routes` | structure | 页面 + API 清单漂移检测 |
| `prisma` | data | Client 已 generate |
| `database` | data | 连通性 + seed 最低行数 |
| `unit-tests` | test | `lib/**/*.test.ts` |
| `lint` | lint | ESLint（full/ci） |
| `build` | build | `next build`（full） |
| `http-smoke` | runtime | `/api/health` · `/api/harness` · capital-summary |

## 清单维护

路由/API 白名单：`lib/harness/manifest.ts`

- 新增页面或 API 后 **必须** 更新 manifest，否则 harness `routes` 检查 fail。

## CI 集成

`.github/workflows/ci.yml`：

1. `npm run harness:ci`
2. `npm run build`
3. `npm run test:e2e`（独立 job）

## 本地推荐流程

```bash
npm run setup          # 首次
npm run dev            # 终端 1
npm run harness:full   # 终端 2（发布前）
```

## 退出码

- `0` — 无 fail（warn 允许，如 demo 模式）
- `1` — 存在 fail（测试失败、缺文件、build 失败等）
