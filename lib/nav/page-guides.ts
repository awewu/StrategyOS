/**
 * Per-page working-principle + workflow guides — single source of truth for the
 * on-page「本板块工作原理与流程」explainer (PageGuide). Content is grounded in
 * lib/constants.ts, the page components, and docs/STRATOS-ROLE-OPERATION-LOOPS.md.
 * Add a route here to give that page an explainer; no page edits required.
 */

export type PageGuide = {
  /** 一句话：这个板块解决什么问题 */
  purpose: string;
  /** 谁来用：主要角色 */
  roles: string;
  /** 工作原理：数据怎么来、AI/规则怎么算、结果怎么用 */
  principle: string;
  /** 操作流程：用户在这一页按什么顺序做事 */
  steps: string[];
  /** 输入·输出：上游数据来自哪、结果流向谁 */
  io?: string;
};

/** Redirect stubs → canonical route that holds the guide. */
const GUIDE_ALIASES: Record<string, string> = {
  "/compass": "/command/compass",
  "/outlook": "/strategy/outlook",
  "/inbox": "/command/issues",
  "/rehearsal": "/council",
  "/gates": "/council",
  "/tools/meeting": "/council",
};

export const PAGE_GUIDES: Record<string, PageGuide> = {
  "/command": {
    purpose: "全局态势总览——一眼看清全集团是否在轨。",
    roles: "CEO（批准战略、确认预警）· 观察员只读",
    principle:
      "汇聚各事业部/职能的健康度、承诺兑现、告警与议题，按红绿灯聚合；一票否决红线（现金<3月等）触发即置顶。",
    steps: [
      "扫红绿灯态势卡，定位飘红的事业部/职能",
      "点进「议题」处理告警、决策、失效前提",
      "需要研判坚守还是转向时进「战略罗盘」",
    ],
    io: "输入：监测健康 + 执行 + 市场威胁；输出：决策交棒 VP/CFO 落地。",
  },
  "/command/issues": {
    purpose: "把散落的告警、待决策、失效前提收进一个待办队列。",
    roles: "CEO · VP（处置与指派）",
    principle:
      "执行层假设失效、监测飘红、市场威胁等事件自动汇入议题池，按类型（告警/决策/前提）分组、按严重度排序。",
    steps: ["按类型筛选议题", "逐条查看来源与影响", "处置：决策、指派或标记前提失效"],
    io: "输入：执行/监测/市场事件；输出：决策结果回写对应板块。",
  },
  "/command/compass": {
    purpose: "回答最难的战略抉择：该坚守、转向（pivot）还是止损（kill）。",
    roles: "CEO（最终决策与留痕）",
    principle:
      "以使命愿景+里程碑为北极星，对战略前提做理性审计（置信度×脆弱性），风险引擎给出评分与建议，AI 仅参谋，humanDecision 才是最终留痕。",
    steps: [
      "沿「路径」看北极星与里程碑达成",
      "在「前提」核对假设的置信度/脆弱性红点",
      "在「理性复核」读 AI 研判，人工做出并记录决定",
    ],
    io: "输入：战略假设 + 市场；输出：决定回写战略版本与议题。",
  },
  "/strategy": {
    purpose: "全员统一认知的战略一页纸——消除层级信息差。",
    roles: "全员（观察员起只读）",
    principle: "只读聚合当前生效战略的使命、目标、BSC 主线与展望，草稿内容仅对编辑角色（CEO/CFO）可见。",
    steps: ["通读一页纸对齐大图", "切「展望」看中长期路线"],
    io: "输入：战略制定的生效版本；输出：全员共识基线。",
  },
  "/strategy/input": {
    purpose: "把战略意图结构化编制成可解码、可追踪的版本。",
    roles: "CEO · CFO（编制）",
    principle: "按使命→目标→BSC→假设逐层录入，保存即形成可对照的战略版本，接受战略会准入门禁校验。",
    steps: ["填写使命愿景与目标", "录入 BSC 主线与关键假设", "保存生成版本，提交战略会准入"],
    io: "输入：组织架构与提报；输出：交战略解码与执行追踪。",
  },
  "/strategy/outlook": {
    purpose: "未来 3–5 年往哪走——外部→三层面→情景→轨迹→稳健的前瞻推演。",
    roles: "CEO · CFO（前瞻研判）",
    principle:
      "① 外部环境（技术信号/TRL）→ ② 三层面 H1/H2/H3 的 CAPEX 配置 → ③ SPBP 贝叶斯情景 → ④ 5 年财务轨迹（只读，编辑在 FPA）→ ⑤ StratRobust 12 维稳健性 → ⑥ what-if 滑杆即时看营收/利润/runway 冲击。",
    steps: [
      "看外部环境与技术前瞻",
      "核三层面组合与情景概率",
      "拉 what-if 滑杆做敏感性推演",
    ],
    io: "输入：FPA 财务 + 技术信号；输出：前瞻结论喂战略罗盘与预算。",
  },
  "/strategy/submissions": {
    purpose: "战略提报审阅——集中查看并审核各单元上报的战略方案。",
    roles: "CEO · VP（审阅/锁定）· 职能专员（提交）",
    principle:
      "只读呈现某 plan 的 SWOT/BSC/作战计划/产品季度/渠道/客户/组织/预算/假设/路线图/附件；状态流转 草稿→已提交→已锁定，审阅动作经 PlanReviewActions。",
    steps: ["选择待审提报", "逐段查看方案与附件", "审阅通过或锁定版本"],
    io: "输入：各单元战略录入；输出：锁定版本进入生效战略。",
  },
  "/versions": {
    purpose: "留存历次战略版本，支持对照与回溯。",
    roles: "CEO · CFO · VP",
    principle: "每次生效/冻结的战略形成快照，可两两对照差异（computeStratDiff），审计战略演化。",
    steps: ["选择两个版本", "查看差异对照", "定位关键改动与理由"],
    io: "输入：战略制定的历次快照；输出：演化审计依据。",
  },
  "/mandates": {
    purpose: "讲清「谁负责什么」——把战略职责落到人。",
    roles: "CEO · VP（定责）",
    principle: "把目标/KR 与负责人、事业部/职能绑定，形成职责矩阵，供承诺与考核引用。",
    steps: ["查看职责矩阵", "确认每条主线的负责人", "缺口处补派责任人"],
    io: "输入：解码后的目标/KR；输出：驱动承诺账本与驾驶舱评分。",
  },
  "/decode": {
    purpose: "把高层战略解码成可执行的 BSC 地图、X-Matrix 与 OKR。",
    roles: "VP · 体系负责人（解码）",
    principle:
      "BSC 四维（财务/客户/流程/学习）→ 方针 X-Matrix 关联 → OKR 目标与关键结果，逐层承接；可导入表格或手工编辑，落库为唯一事实源。",
    steps: [
      "在「BSC」画战略地图四维主线",
      "在「X-Matrix」建立方针与指标关联",
      "在「OKR」拆目标与关键结果，保存落库",
    ],
    io: "输入：战略制定的生效版本；输出：OKR/KR 交执行与监测。",
  },
  "/cockpit": {
    purpose: "坚守驾驶舱——盯住承诺是否兑现。",
    roles: "VP · 体系负责人",
    principle:
      "综合评分 = 承诺兑现 30% + 价值观 25% + 业务运营 45%，十二维可下钻；数据来自承诺账本与执行看板。",
    steps: ["看综合评分与三大权重", "下钻十二维定位薄弱项", "对飘红项追责或调整承诺"],
    io: "输入：执行/承诺 + 文化指标；输出：异常上报指挥舱议题。",
  },
  "/execution": {
    purpose: "项目与承诺的执行全览——把战略落到 V1–V10。",
    roles: "项目经理（本项目）· VP（全览）",
    principle:
      "聚合承诺兑现率、逾期、张力图、Vx 项目看板、4DX 记分牌与战略假设 Hx；假设失效自动生成预警回流。",
    steps: [
      "看顶部 KPI（兑现率/逾期/高张力/领先 KR）",
      "在「承诺」维护承诺账本与张力",
      "在「明细」更新 Vx 项目、记分牌与假设",
    ],
    io: "输入：OKR/职责；输出：失效假设与偏差交棒指挥舱。",
  },
  "/monitor/health": {
    purpose: "集团健康度总览——四维红绿灯 + 综合评分。",
    roles: "全员（分级可见）",
    principle: "按四维度（财务/客户/流程/学习）汇总指标，规则判红黄绿，给出综合健康评分。",
    steps: ["看综合评分与四维红绿灯", "点开飘红维度看构成指标", "异常转指挥舱议题跟进"],
    io: "输入：各板块指标；输出：喂指挥舱态势与一票否决判定。",
  },
  "/monitor/bu": {
    purpose: "事业部 N-1 轻量监测——按 BU 切片看健康与进度。",
    roles: "VP（本 BU）· CEO（全览）",
    principle:
      "以事业部（空调/热水/BD/制造）为切片聚合执行与健康，按 orgScope 权限只给可见 BU，专家视图可下钻到执行全览。",
    steps: ["选事业部切片", "看该 BU 轻量监测", "下钻专家视图/执行全览"],
    io: "输入：执行 bundle 按 BU 切片；输出：异常回指挥舱议题。",
  },
  "/monitor/functions": {
    purpose: "职能体系 N-1 轻量监测——按职能切片看能力与资源。",
    roles: "体系负责人（本体系）· CEO",
    principle:
      "以职能体系（研发/CMO/品牌/HR/财务）为切片聚合执行与健康，按 orgScope 权限控制可见，专家视图可下钻。",
    steps: ["选职能切片", "看该体系轻量监测", "下钻专家视图"],
    io: "输入：执行 bundle 按职能切片；输出：能力缺口回流。",
  },
  "/reports": {
    purpose: "报告中心与运营脉搏——录入、生成、去重汇总。",
    roles: "职能专员（录入）· 全员（查阅）",
    principle: "职能专员录入数据/报告，系统做质量校验与脉搏去重（pulse-dedup），产出可信的上层输入。",
    steps: ["录入或上传报告数据", "查看质量校验结果", "生成/查阅汇总报告"],
    io: "输入：一线数据；输出：为监测/执行/复盘提供可信数据。",
  },
  "/council": {
    purpose: "战略会一站式——彩排、准入 Gate、会议工具。",
    roles: "CEO · VP · 职能专员",
    principle:
      "彩排预演各单元评分；准入 Gate 校验不达标即拦截版本冻结；会议工具做投票/表决/脉搏，结论回写议题与承诺。",
    steps: ["用「彩排」预演各单元", "过「准入 Gate」检查是否达标", "用「会议工具」表决并留痕"],
    io: "输入：战略版本 + 健康度；输出：结论回写议题/承诺。",
  },
  "/innovation": {
    purpose: "创新底座——「想要 × 能做 × 划算」筛创新赌注，分段下注、错了止损。",
    roles: "CEO · VP",
    principle:
      "每条产品线拆成产品赌注(bets)，过创新 Gate（go/hold/kill）需举证；放行才追加下期 commit，举证不足即拦截，PVI 举证卡留痕。",
    steps: ["看在注赌注与 Gate 结论", "对 go 项追加下期 commit", "对 hold/kill 补举证或止损"],
    io: "输入：市场/技术信号 + 产品线画像；输出：go 项进执行 Vx 与预算。",
  },
  "/ma": {
    purpose: "并购 · 资本交易——收购/并购/投资/合资同一纪律链。",
    roles: "CEO · CFO",
    principle:
      "论点挂帅 → 举证过关 → 红线否决 → 投后追责；形态画像决定阈值与必备条款(walk-away)；交易按 stage 推进，Gate kill 即拦截。",
    steps: ["维护交易与投资论点", "过 Gate 与红线检查", "推进尽调/整合并投后追责"],
    io: "输入：市场标的；输出：资本决策交棒指挥舱、投后进执行。",
  },
  "/finance": {
    purpose: "FP&A——报表、资本配置、5 年展望、SPBP 情景与现金 runway。",
    roles: "CFO（预算主理）· CEO",
    principle:
      "汇总财务报表与预算，做资本配置与贝叶斯情景推演（SPBP），现金 runway<3 月直接喂一票否决红线。",
    steps: ["看报表与预算执行", "在「资本」做配置", "在「情景/展望」做推演与 runway 判断"],
    io: "输入：总账 + 战略目标；输出：喂健康红线 + 资本决策交棒指挥舱。",
  },
  "/finance/ledger": {
    purpose: "总账中台——财务数据的底层账目。",
    roles: "CFO · 职能专员",
    principle: "统一记账口径，为 FP&A 与预算提供可核对的明细账。",
    steps: ["查阅账目", "核对科目与期间", "回溯异常凭证"],
    io: "输入：业务/导入数据；输出：明细账供 FPA 使用。",
  },
  "/tools/import": {
    purpose: "数据导入编译链——把脏数据/PDF 转成可信落库结构。",
    roles: "职能专员（导入）",
    principle:
      "上传后经 OCR + LLM 提取 + 语义查重 + 质量校验的编译链，低质数据被质量闸拦下，合格数据落库。",
    steps: ["上传表格/PDF", "查看提取与查重结果", "确认质量校验通过后落库"],
    io: "输入：原始表格/PDF；输出：结构化数据供解码/执行/财务/报告。",
  },
  "/market": {
    purpose: "市场洞察——竞争态势与外部威胁研判。",
    roles: "VP · CEO",
    principle:
      "抓取竞品/市场信息，喂 LLM 前先做防注入中和，产出五力/SWOT 与市场推演，威胁转为议题。",
    steps: ["查看竞争态势与洞察", "运行市场/SWOT 推演", "把威胁转入指挥舱议题"],
    io: "输入：市场配置的竞品/情报源；输出：威胁交棒指挥舱与罗盘。",
  },
  "/market/config": {
    purpose: "市场配置——维护洞察所依赖的基础数据。",
    roles: "管理员 · VP（市场）",
    principle: "维护销售大区/品类/竞品品牌/重点产品/Hermes 情报来源，作为市场洞察抓取与推演的输入源。",
    steps: ["维护大区与品类", "登记竞品品牌与重点产品", "配置情报来源与抓取节奏"],
    io: "输入：人工维护；输出：喂市场洞察的抓取与分析。",
  },
  "/culture": {
    purpose: "企业文化——价值观落地、评选与组织评估。",
    roles: "全员 · HR/文化体系",
    principle:
      "沉淀文化手册与价值观维度，做价值观评选与「五事七计」组织评估，关联北极星，为坚守驾驶舱价值观权重(25%)供数。",
    steps: ["查文化手册与价值观", "维护评选与理解记录", "做五事七计组织评估"],
    io: "输入：文化手册/评估；输出：喂驾驶舱价值观评分。",
  },
  "/board": {
    purpose: "董事的治理视界——只看董事会包、签署决议。",
    roles: "董事（硬白名单，仅本页）",
    principle: "刻意最小视界（硬白名单），隔离运营噪声，只呈现治理所需的董事会材料与决议。",
    steps: ["查阅董事会包", "审阅决议要点", "签署决议"],
    io: "输入：战略/健康汇总；输出：决议回写为战略约束与议题。",
  },
  "/admin/access": {
    purpose: "访问管理——用户、角色权限与审计。",
    roles: "管理员（CEO）",
    principle: "管理用户与角色权限配置（写库生效），查看使用审计日志与审计完整性校验。",
    steps: ["管理用户与角色", "调整权限矩阵并保存", "查看审计日志与完整性"],
    io: "输入：账号/角色；输出：全局权限与审计留痕。",
  },
  "/admin/org": {
    purpose: "组织架构管理——三层组织的增删改。",
    roles: "管理员（CEO）",
    principle: "维护事业部/体系/二级部门三层结构，它是战略录入入口与切片口径的来源。",
    steps: ["查看三层组织树", "增删改单元与层级", "保存后驱动录入入口"],
    io: "输入：人工维护；输出：战略录入入口 + 监测切片口径。",
  },
};

export function getPageGuide(pathname: string): PageGuide | null {
  if (PAGE_GUIDES[pathname]) return PAGE_GUIDES[pathname];
  const alias = GUIDE_ALIASES[pathname];
  if (alias && PAGE_GUIDES[alias]) return PAGE_GUIDES[alias];

  let best: string | null = null;
  for (const key of Object.keys(PAGE_GUIDES)) {
    if (pathname === key || pathname.startsWith(`${key}/`)) {
      if (!best || key.length > best.length) best = key;
    }
  }
  return best ? PAGE_GUIDES[best] : null;
}
