/**
 * Per-page working-principle + workflow guides — single source of truth for the
 * on-page「本板块工作原理与流程」explainer (PageGuide). Content is grounded in
 * lib/constants.ts, the page components, and docs/STRATOS-ROLE-OPERATION-LOOPS.md.
 * Add a route here to give that page an explainer; no page edits required.
 */

export type PageGuide = {
  /** 一句话：这个板块解决什么问题 */
  purpose: string;
  /** 工作原理：数据怎么来、AI/规则怎么算、结果怎么用 */
  principle: string;
  /** 操作流程：用户在这一页按什么顺序做事 */
  steps: string[];
  /** 与谁衔接：上游输入 / 下游交棒 */
  handoff?: string;
};

/** Redirect stubs → canonical route that holds the guide. */
const GUIDE_ALIASES: Record<string, string> = {
  "/compass": "/command/compass",
  "/outlook": "/strategy",
  "/inbox": "/command/issues",
  "/rehearsal": "/council",
  "/gates": "/council",
  "/tools/meeting": "/council",
};

export const PAGE_GUIDES: Record<string, PageGuide> = {
  "/command": {
    purpose: "CEO 的全局态势总览——一眼看清全集团是否在轨。",
    principle:
      "汇聚各事业部/职能的健康度、承诺兑现、告警与议题，按红绿灯聚合；一票否决红线（现金<3月等）触发即置顶。",
    steps: [
      "扫红绿灯态势卡，定位飘红的事业部/职能",
      "点进「议题」处理告警、决策、失效前提",
      "需要研判坚守还是转向时进「战略罗盘」",
    ],
    handoff: "上游来自监测健康与执行；下游把决策交棒给 VP/CFO 落地。",
  },
  "/command/issues": {
    purpose: "把散落的告警、待决策、失效前提收进一个待办队列。",
    principle:
      "执行层假设失效、监测飘红、市场威胁等事件自动汇入议题池，按类型（告警/决策/前提）分组、按严重度排序。",
    steps: ["按类型筛选议题", "逐条查看来源与影响", "处置：决策、指派或标记前提失效"],
    handoff: "上游来自执行/监测/市场；下游把决策结果回写到对应板块。",
  },
  "/command/compass": {
    purpose: "回答最难的战略抉择：该坚守、转向（pivot）还是止损（kill）。",
    principle:
      "以使命愿景+里程碑为北极星，对战略前提做理性审计（置信度×脆弱性），风险引擎给出评分与建议，AI 仅参谋，humanDecision 才是最终留痕。",
    steps: [
      "沿「路径」看北极星与里程碑达成",
      "在「前提」核对假设的置信度/脆弱性红点",
      "在「理性复核」读 AI 研判，人工做出并记录决定",
    ],
    handoff: "上游同步战略假设；下游决定回写战略版本与议题。",
  },
  "/strategy": {
    purpose: "全员统一认知的战略一页纸——消除层级信息差。",
    principle: "只读聚合当前生效战略的使命、目标、BSC 主线与展望，草稿内容仅对编辑角色可见。",
    steps: ["通读一页纸对齐大图", "切「展望」看中长期路线"],
    handoff: "内容源自战略制定的生效版本。",
  },
  "/strategy/input": {
    purpose: "把战略意图结构化编制成可解码、可追踪的版本。",
    principle: "按使命→目标→BSC→假设逐层录入，保存即形成可对照的战略版本，接受战略会准入门禁校验。",
    steps: ["填写使命愿景与目标", "录入 BSC 主线与关键假设", "保存生成版本，提交战略会准入"],
    handoff: "下游交给战略解码（BSC/X-Matrix/OKR）与执行追踪。",
  },
  "/versions": {
    purpose: "留存历次战略版本，支持对照与回溯。",
    principle: "每次生效/冻结的战略形成快照，可两两对照差异（computeStratDiff），审计战略演化。",
    steps: ["选择两个版本", "查看差异对照", "定位关键改动与理由"],
  },
  "/mandates": {
    purpose: "讲清「谁负责什么」——把战略职责落到人。",
    principle: "把目标/KR 与负责人、事业部/职能绑定，形成职责矩阵，供承诺与考核引用。",
    steps: ["查看职责矩阵", "确认每条主线的负责人", "缺口处补派责任人"],
    handoff: "下游驱动承诺账本与坚守驾驶舱的兑现评分。",
  },
  "/decode": {
    purpose: "把高层战略解码成可执行的 BSC 地图、X-Matrix 与 OKR。",
    principle:
      "BSC 四维（财务/客户/流程/学习）→ 方针 X-Matrix 关联 → OKR 目标与关键结果，逐层承接；可导入表格或手工编辑，落库为唯一事实源。",
    steps: [
      "在「BSC」画战略地图四维主线",
      "在「X-Matrix」建立方针与指标关联",
      "在「OKR」拆目标与关键结果，保存落库",
    ],
    handoff: "上游承接战略制定；下游把 OKR/KR 交给执行与监测。",
  },
  "/cockpit": {
    purpose: "VP/体系负责人的坚守驾驶舱——盯住承诺是否兑现。",
    principle:
      "综合评分 = 承诺兑现 30% + 价值观 25% + 业务运营 45%，十二维可下钻；数据来自承诺账本与执行看板。",
    steps: ["看综合评分与三大权重", "下钻十二维定位薄弱项", "对飘红项追责或调整承诺"],
    handoff: "上游取执行/承诺数据；下游异常上报指挥舱议题。",
  },
  "/execution": {
    purpose: "项目与承诺的执行全览——把战略落到 V1–V10。",
    principle:
      "聚合承诺兑现率、逾期、张力图、Vx 项目看板、4DX 记分牌与战略假设 Hx；假设失效自动生成预警回流。",
    steps: [
      "看顶部 KPI（兑现率/逾期/高张力/领先 KR）",
      "在「承诺」维护承诺账本与张力",
      "在「明细」更新 Vx 项目、记分牌与假设",
    ],
    handoff: "上游承接 OKR/职责；下游把失效假设与偏差交棒指挥舱。",
  },
  "/monitor/health": {
    purpose: "集团健康度总览——四维红绿灯 + 综合评分。",
    principle: "按四维度（财务/客户/流程/学习或体系口径）汇总指标，规则判红黄绿，给出综合健康评分。",
    steps: ["看综合评分与四维红绿灯", "点开飘红维度看构成指标", "异常转指挥舱议题跟进"],
    handoff: "喂给指挥舱态势与一票否决红线判定。",
  },
  "/monitor/bu": {
    purpose: "按事业部切片看健康与进度。",
    principle: "以事业部为维度聚合健康度、承诺与执行进度，横向对比各 BU。",
    steps: ["选择事业部", "看该 BU 健康与兑现", "定位落后 BU 下钻"],
  },
  "/monitor/functions": {
    purpose: "按职能体系切片看资源与能力协调。",
    principle: "以职能体系为维度聚合指标，反映横向能力建设与资源配置状况。",
    steps: ["选择职能体系", "看该体系指标", "识别能力缺口"],
  },
  "/reports": {
    purpose: "报告中心与运营脉搏——录入、生成、去重汇总。",
    principle: "职能专员录入数据/报告，系统做质量校验与脉搏去重（pulse-dedup），产出可信的上层输入。",
    steps: ["录入或上传报告数据", "查看质量校验结果", "生成/查阅汇总报告"],
    handoff: "下游为监测健康、执行与复盘提供可信数据。",
  },
  "/council": {
    purpose: "战略会一站式——彩排、准入 Gate、会议工具。",
    principle:
      "彩排预演各单元评分；准入 Gate 校验不达标即拦截版本冻结；会议工具做投票/表决/脉搏，结论回写议题与承诺。",
    steps: ["用「彩排」预演各单元", "过「准入 Gate」检查是否达标", "用「会议工具」表决并留痕"],
    handoff: "上游取战略版本与健康度；下游把结论回写议题/承诺。",
  },
  "/innovation": {
    purpose: "创新底座——内生增长（build）的机会与管线。",
    principle: "登记创新项目/管线，评估其对增长信条（Innovate to Lead）的贡献。",
    steps: ["查看创新管线", "评估机会价值", "纳入战略与预算"],
    handoff: "下游进入执行 Vx 与预算配置。",
  },
  "/ma": {
    purpose: "并购——外延增长（buy）的标的与评估。",
    principle: "管理并购标的与评估，衡量外延增长对战略的补强。",
    steps: ["维护标的清单", "评估协同与风险", "推进尽调/决策"],
    handoff: "下游进入预算资本配置与指挥舱决策。",
  },
  "/finance": {
    purpose: "CFO 的 FP&A——报表、资本配置、5 年展望、SPBP 情景与现金 runway。",
    principle:
      "汇总财务报表与预算，做资本配置与贝叶斯情景推演（SPBP），现金 runway<3 月直接喂一票否决红线。",
    steps: ["看报表与预算执行", "在「资本」做配置", "在「情景/展望」做推演与 runway 判断"],
    handoff: "喂健康红线；下游把资本决策交棒指挥舱。",
  },
  "/finance/ledger": {
    purpose: "总账中台——财务数据的底层账目。",
    principle: "统一记账口径，为 FP&A 与预算提供可核对的明细账。",
    steps: ["查阅账目", "核对科目与期间", "回溯异常凭证"],
  },
  "/tools/import": {
    purpose: "数据导入编译链——把脏数据/PDF 转成可信落库结构。",
    principle:
      "上传后经 OCR + LLM 提取 + 语义查重 + 质量校验的编译链，低质数据被质量闸拦下，合格数据落库。",
    steps: ["上传表格/PDF", "查看提取与查重结果", "确认质量校验通过后落库"],
    handoff: "下游供解码、执行、财务、报告使用。",
  },
  "/market": {
    purpose: "市场洞察——竞争态势与外部威胁研判。",
    principle:
      "抓取竞品/市场信息，喂 LLM 前先做防注入中和，产出 SWOT 与市场推演，威胁转为议题。",
    steps: ["查看竞争态势与洞察", "运行市场/SWOT 推演", "把威胁转入指挥舱议题"],
    handoff: "下游把外部威胁交棒指挥舱与战略罗盘。",
  },
  "/culture": {
    purpose: "企业文化——价值观落地与评分支撑。",
    principle: "沉淀价值观维度与文化指标，为坚守驾驶舱的价值观权重（25%）提供依据。",
    steps: ["查看文化维度", "维护价值观指标", "支撑驾驶舱评分"],
  },
  "/board": {
    purpose: "董事的治理视界——只看董事会包、签署决议。",
    principle: "刻意最小视界（硬白名单），隔离运营噪声，只呈现治理所需的董事会材料与决议。",
    steps: ["查阅董事会包", "审阅决议要点", "签署决议"],
    handoff: "决议回写为战略约束与指挥舱议题。",
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
