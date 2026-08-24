# StratOS · 角色操作闭环 + 前端信息架构（IA）评估与重构提案

**版本：** v1.0 · 2026-08-23
**定位：** 本文是「谁在哪个入口、解决什么问题、如何扭转」的**单一对齐事实源**，并对当前前端布局的**可用性**给出诚实评估与重构提案。
**分工边界：**
- 组件分层/依赖（Tier 0–4）→ `docs/UI-ARCHITECTURE.md`（不在本文范围）。
- 视觉识别（色/Logo/打印）→ `docs/BRAND_VI.md`。
- **信息架构（页面归到哪个入口、导航怎么搭接）→ 本文**（UI-ARCHITECTURE 未覆盖，属空白，本文补齐）。

权威代码源：`lib/constants.ts`（角色/信条）· `lib/auth/permissions.ts`（权限矩阵）· `lib/nav/hubs.ts`（导航）· `components/shell/AppNav.tsx` + `HubSubNav.tsx`（导航渲染）。

---

## Part A · 角色 × 功能入口 × 问题 × 扭转（固化矩阵）

### A.1 三条信条（评判尺，`lib/constants.ts`）
- **Invest to Growth** 投资驱动增长 — 预算时问「这笔投入能带动增长吗」。
- **Innovate to Lead** 创新引领 — 产品时问「抄的还是创新的」。
- **Deliver on Commitment** 兑现承诺 — 定目标时问「能做到吗、何时做到」。

### A.2 角色 → 层级 → 落地入口（`permissions.ts`）
| 角色 | Level | 落地入口 `roleHomePath` | 要解决的问题 |
|---|---|---|---|
| observer 观察员 | L0 | `/strategy` | 只读一页纸+健康度，统一认知 |
| board 董事 | L0（硬白名单，仅 `/board`） | `/board` | 治理视界：董事会包 + 决议签署 |
| pm 项目经理 | L1 | `/execution` | 本项目 Vx 进度/预算/里程碑/假设 |
| staff 职能专员 | L2 | `/reports` | 数据录入、报告生成 |
| vp 事业部负责人 | L2 | `/cockpit` | 本事业部设 OKR + 盯承诺兑现 |
| system_head 体系负责人 | L2 | `/cockpit` | 本职能体系协调资源/能力 |
| cfo | L3 | `/finance` | 预算/FP&A/资本配置/现金 runway |
| ceo | L3(+L4 admin) | `/command` | 全局态势、批准战略、确认预警、裁决 |

### A.3 角色操作闭环（入口 → 问题 → 扭转动作 → 交棒）
- **staff** `/reports` + `/tools/import`：脏数据/散乱 PDF → 编译链（OCR+LLM 提取+语义查重）落库 → **交棒 vp**。扭转：质量闸挡下噪声，保证上层输入可信。
- **pm** `/execution`：项目沉默/假设失效 → 更新 Vx、假设失效触发预警（`/command/issues`）→ **交棒 vp/CEO**。扭转：涌现现实反写回战略（emergent→deliberate）。
- **vp / system_head** `/cockpit` + `/decode`：战略无法落地 → BSC→X-Matrix→OKR 解码 + 盯兑现率 → **交棒 CEO/CFO**。扭转：局部漂移一飘红即全局可见。
- **cfo** `/finance`：钱不知够不够 → FP&A + 资本配置 + SPBP 贝叶斯情景 + runway → **喂健康红线 + 交棒 CEO**。扭转：现金<3月直接进一票否决。
- **ceo** `/command` → `/command/issues` → `/command/compass`：全局是否在轨、该坚守还是转向 → 处理议题、读罗盘研判（AI 参谋）、冻结快照 → 亲笔写红线例外。扭转：默认阻断，例外须留痕。
- **board** `/board`：治理层被运营细节淹没 → 只看董事会包、签决议。扭转：刻意最小视界，隔离噪声。
- **observer** `/strategy`：层级信息差 → 同一张战略图。扭转：消除「各说各话」。

### A.4 四个系统级「扭转器」
1. **准入 Gate**（`/council` 彩排+`/gates`）：不达标→版本不能冻结。
2. **一票否决 freeze**（`lib/learn/concepts.ts`）：runway<3月 / 重大质量·合规事故 / 核心团队流失>30% / 品牌NPS<0 → 硬阻断快照，除非 CEO 例外留痕。
3. **战略罗盘研判**（`/command/compass`，rationality-verdict）：AI 给坚守/pivot/kill 建议，人工 humanDecision 才是最终留痕。
4. **坚守驾驶舱三维评分**（`/cockpit`）：承诺兑现 30% + 价值观 25% + 业务运营 45%；十二维供下钻。

### A.5 主闭环
```
编制(/strategy/input) → 解码(/decode) → 执行(/execution) → 监测(/monitor,/cockpit)
      ↑                                                              ↓
  战略会准入(/council/gates) ← 指挥·议题·罗盘(/command) ← 预警/一票否决
      ↑                                                              ↓
  下一次战略会  ←──────────  复盘(/reports GRAI+KPT + AI 顾问)  ←──┘
```

---

## Part B · 前端 IA 诚实评估（回应「费解、别扭、不知去哪找」）

**结论先行：产品功能强、闭环设计对，但导航的「搭接（IA + 导航范式）」确实是短板，需要重构——不是重写功能，而是重组入口分组、修导航范式、清理重复路由。** 以下每条都有代码证据。

### B1. 折叠图标栏 + hover 弹出 = 发现性差（核心痛点）
`AppNav.tsx` 是一条**折叠图标轨**，子页面靠**鼠标悬停弹出 flyout**（`HubNavItem` 的 `onMouseEnter`）。后果：
- 用户无法一眼扫到所有目的地，必须逐个图标悬停试探 →「不知道去哪找」。
- 触屏/键盘/无障碍下 hover 弱；首次使用者心智负担高。
- 代码自证历史伤疤：`AppNav.tsx:4-7` 与 `lib/nav/sidebar-layout.ts:5-10` 明确注释「CEO『更多』折叠导致反复出现『模块丢失』UX 事故，未经产品批准勿再接入」。**说明折叠范式已翻过车。**

### B2. 「解码与监测 operate」Hub 过载（7 子项、两种工种混装）
`hubs.ts` 中 operate 同时塞了**设计态**（decode: BSC/X-Matrix/OKR）与**运行态**（cockpit、monitor/functions、monitor/bu、monitor/health、execution、reports）。一个入口装了「怎么定」和「怎么盯」两件事，扫描成本高。

### B3. 幽灵路由 —— 路由层已修，导航层仍分裂（更正 2026-08-23）
**核查后更正**：`/compass` `/outlook` `/rehearsal` `/gates` `/inbox` **均已是 `redirect()` 兼容桩**，指向唯一 canonical（`/command/compass` `/strategy/outlook` `/council?tab=…` `/command/issues`）。故**路由层去重已完成**，原「两个入口指向同类内容」的判断偏重。

真正残留的是**导航层**问题：

| 现象 | 证据 | 影响 |
|---|---|---|
| 兼容桩靠特判兜底高亮 | `hubs.ts` `hubContainsPath` 为 `/outlook /inbox /rehearsal /gates` 写死特判 | 逻辑脆、易漏 |
| `/tools/meeting` 既是独立实页、又作 `/council?tab=meeting` | `tools/meeting/page.tsx` 渲染 `MeetingToolsClient` | 唯一实体双入口 |
| ⌘K 硬编码 11 条 tab 深链 | `flattenNavLinks` 尾部手拼 | 与 hub 声明脱钩，易腐化 |

→ 结论：不是「同功能多份内容」，而是**导航声明与真实路由脱节**，P1/P2 收敛即可。

### B4. 分类学是「系统内部术语」，不是「用户要办的事」
态势/制定/增长/预算/解码监测/工具 + 术语（指挥舱、坚守驾驶舱、战略职责）——**按 StratOS 内部概念分组**，不是按角色的 job-to-be-done。VP 想「设 OKR 并看兑现」，得知道 OKR 藏在「解码与监测」，兑现又在 cockpit。

### B5. 落地页与导航分组不一致
`roleHomePath` 把 pm 落到 `/execution`、vp 落到 `/cockpit`，但这些在导航里被埋在**底部 Hub「解码与监测」**的深处；从落地页找不到「我还能干什么」的同级兄弟。

---

## Part C · 重构提案（IA 按「战略闭环生命周期」重组）

核心思想：**导航分组 = 产品自己的闭环阶段**（用户已有的心智），而非内部taxonomy。

### C1. 新 IA：6 阶段主脊（替换现 6 Hub）
| 阶段 | 名称 | 收纳页面 | 服务角色 |
|---|---|---|---|
| ① 定 | **战略制定** | /strategy/input · /versions · /mandates | ceo/cfo/vp |
| ② 解 | **战略解码** | /decode(BSC·X-Matrix·OKR) | vp/system_head |
| ③ 行 | **执行坚守** | /execution · /cockpit | pm/vp |
| ④ 察 | **监测健康** | /monitor/health · /monitor/bu · /monitor/functions · /reports | 全角色（分级） |
| ⑤ 断 | **指挥决策** | /command · /command/issues · /command/compass · /inbox · /strategy(一页纸) · /board | ceo/board |
| ⑥ 复 | **复盘与会** | /council(彩排·准入·会议) · /reports 复盘 | ceo/vp/staff |
| ＋ | **外脑**（贯穿） | /market 市场洞察 · /culture 文化 · /finance 预算 · /innovation · /ma | cfo/ceo |

> 排序即闭环顺序（定→解→行→察→断→复），用户沿脊走一圈就是走完战略一轮。

### C2. 导航范式修复（治 B1 的根）
- **默认展开的分区侧栏**（section + 子项常显），不再靠 hover flyout；窄屏可收起为图标+点击展开（点击 ≠ 悬停）。
- **角色首屏 = 该角色闭环起点**，首屏顶部给「你在闭环的哪一环 + 下一步去哪」的引导条。
- 保留 ⌘K 命令面板作为快速跳转补充（`flattenNavLinks` 已就绪）。

### C3. 路由去重台账（治 B3）
| 处置 | 动作 |
|---|---|
| `/compass` | 301 → `/command/compass`（保留唯一入口） |
| `/outlook` | 合并到 `/strategy/outlook`，旧路由重定向 |
| `/rehearsal` `/gates` `/tools/meeting` | 统一为 `/council` 的正式子项（tab 即子路由），删除「幽灵直达」歧义 |
| `/inbox` | 提升为 ⑤断 阶段的正式导航子项（不止 badge） |

### C4. 命名去术语化（治 B4，面向用户改标签，不改路由）
- 「解码与监测」→ 拆成 **战略解码** 与 **监测健康**。
- 「坚守驾驶舱」→ 副标注「承诺兑现看板」。
- 「战略职责 mandates」→「谁负责什么」。

---

## Part D · 分期落地（低风险优先，均需产品确认后动 nav）

- **P0（0.5 天，纯低险）**：路由去重 C3（重定向 + 合并），不改视觉。先消除「同功能多入口」。
- **P1（1–2 天）**：`hubs.ts` 按 C1 六阶段重排 + 标签去术语化 C4；`permissions.ts` 层级不变。单元测 `sidebar-layout.test.ts` 同步。
- **P2（2–3 天）**：AppNav 换默认展开分区范式（C2），窄屏点击展开；保留 ⌘K。做浏览器视觉回归。
- **P3（1 天）**：角色首屏引导条（闭环定位 + 下一步）。

**验证门**：每期跑 `npm test`（现 396/396）+ `tsc` + 浏览器视觉回归；nav 改动遵守 `AppNav.tsx` 的「未经产品批准勿接入折叠」红线。

---

## Part E · 落地状态（2026-08-23 全量 P0→P3 已实施）

- **P0 路由去重**：核查发现 `/compass /outlook /rehearsal /gates /inbox` 早已是 `redirect()` 兼容桩，路由层无需再改；导航层脱节改由 P1/P2 收敛。
- **P1 hubs 重排 + 去术语化**（`lib/nav/hubs.ts`）：过载的 `operate` 拆为 **战略解码/执行坚守/监测健康** 三个聚焦 hub；全量按闭环 `定→解→行→察→断→复 + 支撑` 重排；六个闭环 hub 加 `stage` 标（定/解/行/察/断/复）；标签去术语化（「战略职责」→「谁负责什么」等）。`permissions.ts` `HUB_MIN_LEVEL` 同步补 `execute/monitor/council/budget`。
- **P2 导航范式**（`components/shell/AppNav.tsx` + `app/globals.css`）：**弃用 hover 悬停 flyout + 折叠图标轨**，改为**默认全展开的分区侧栏**（section 头 = 图标+stage+标题，子项常显，可点击折叠但**当前所在 section 强制展开**——彻底根治「模块丢失」）。侧栏宽度 `--sidebar-w` 80px→244px。
- **P3 闭环定位条**（`components/shell/LoopGuide.tsx`）：生命周期页顶部显示 `定→解→行→察→断→复` 定位徽标 + 「下一步 · X」跳转，按角色权限过滤；单子项 hub 的 `HubSubNav` 顶部标签条自动隐藏（避免与侧栏重复）。

**验证**：`tsc --noEmit` 通过 · `npm test` 396/396 · `eslint` 变更文件零告警 · dev server 启动无编译/运行时错误。
**待补**：staging 浏览器视觉回归 `ENABLE_REACT_CANDIDATE=true npm run guard:browser-visual`（需 DB/staging，本环境未跑）。

## 附：待办与开关状态

- LLM 大脑层已收口到 `lib/ai/tandem-brain.ts`（开关 `STRATOS_USE_TANDEM_AI`，默认关走直连、fail-soft）。
- LLM 收口 commit `2c9aa7f` 本地已提交；本次 IA 重构为新 commit，**push 待可达 GitHub 的网络**。
