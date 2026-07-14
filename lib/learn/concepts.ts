/**
 * 概念解读内容库 — 战略方法论与理论工具的原理 / 思维逻辑 / 工作原理。
 * 面向员工科普，供各页底部的 ConceptGuide 模块按 id 引用。
 */

export interface Concept {
  /** 稳定 id，页面通过它引用 */
  id: string;
  /** 中文名 */
  name: string;
  /** 出处 / 英文原名 */
  origin: string;
  /** 一句话定位 */
  tagline: string;
  /** 思维逻辑与原理 */
  principle: string;
  /** 在 StratOS 中如何工作 */
  howItWorks: string;
  /** 关键提问 / 口诀（可选） */
  keyQuestion?: string;
}

export const CONCEPTS: Record<string, Concept> = {
  rumelt: {
    id: "rumelt",
    name: "Rumelt 战略诊断",
    origin: "Richard Rumelt《好战略·坏战略》· 战略内核 Kernel",
    tagline: "好战略的内核 = 诊断 + 指导方针 + 连贯行动。",
    principle:
      "坏战略堆口号和一长串目标（“既要又要”）；好战略先做诊断——把纷乱现状收敛成一个真正的关键挑战，找出根因，再锁定“枢纽（crux）”：那个用力撬动、能带动全局的最小杠杆点。有了诊断，才谈得上指导方针与彼此呼应的连贯行动。",
    howItWorks:
      "看战略顶部的「战略诊断」对象：一句话挑战陈述 + 瓶颈类型（能力/市场/组织/资本）+ 3–5 条根因 + crux 枢纽 + 财务逻辑。每个周期仅一条经批准的诊断并冻结进快照；它位于使命、BSC、OKR 之“上”，是后续一切解码的源头。",
    keyQuestion: "我们真正卡在哪里？能撬动全局的那一个支点是什么？",
  },
  playingToWin: {
    id: "playingToWin",
    name: "Playing to Win · WTP/HTW",
    origin: "A.G. Lafley & Roger Martin（宝洁）· 五级联问题",
    tagline: "战略是一组环环相扣的选择，核心是“在哪竞争 + 如何取胜”。",
    principle:
      "五个级联问题：制胜抱负 → 在哪竞争（Where to Play：区域×渠道×客户段）→ 如何取胜（How to Win：差异化打法）→ 需要什么能力 → 需要什么管理系统。其中 WTP 与 HTW 是最短、最锋利的战略对话。战略的本质是“选择放弃什么”，不是什么都做。",
    howItWorks:
      "看战略的四品牌 BrandStrategyCard，每张左 WTP / 右 HTW 双卡；“如何取胜”须与诊断的 crux 不矛盾（保存时软校验提醒），并挂载到 BSC 维度与 OKR。",
    keyQuestion: "我们选择在哪个战场赢、靠什么赢？又主动不打哪里？",
  },
  blm: {
    id: "blm",
    name: "BLM 业务领先模型",
    origin: "IBM Business Leadership Model · 华为引入",
    tagline: "一切从“差距”开始，闭环到业务设计与关键任务。",
    principle:
      "三类差距驱动战略：业绩差距（实际 vs 目标）、机会差距（行业增速 vs 自身增速）、对标差距（vs 标杆分指标）。差距 → 战略意图 → 市场洞察 → 创新焦点 → 业务设计 → 关键任务 → 执行与人才/氛围，形成“战略到执行”的完整链条。",
    howItWorks:
      "战略制定用 FPA 实际数量化业绩差距、对标行业标杆；差距汇总为战略意图输入，喂给 Rumelt 诊断与战略解码。",
    keyQuestion: "目标与现实之间的差距有多大？是业绩、机会还是对标差距？",
  },
  fourSatisfactions: {
    id: "fourSatisfactions",
    name: "四个满意",
    origin: "经营价值观校验器",
    tagline: "客户 / 员工 / 股东 / 社会——每个目标的“宪法级”校验。",
    principle:
      "任何战略目标、OKR-O、重大决策都必须同时对四方有交代，防止单一维度（如只追股东短期利润）造成的失衡与长期反噬。",
    howItWorks:
      "每个 O 必须留下四满意校验记录；战略复盘的文化板块即四满意践行度；并作为健康度的底线维度。",
    keyQuestion: "这个决定，对客户、员工、股东、社会分别意味着什么？",
  },
  doctrine: {
    id: "doctrine",
    name: "三支柱 Doctrine",
    origin: "经营方针 · Invest / Innovate / Deliver",
    tagline: "精神层“方针”——审计一致性，而不是打健康分。",
    principle:
      "Invest to Growth（投资增长）、Innovate to Lead（创新引领）、Deliver on Commitment（兑现承诺）三条方针定义“该怎么做”。每个决策标注由哪条支柱驱动，并做 Yes/No/例外审计：Invest 必须挂投资案、Innovate 必须有产品赌注、Deliver 必须跟踪承诺。违背会触发 StratDiff 事件并可能进战略会。",
    howItWorks:
      "KR 与决策标注驱动权重；Doctrine 审计通过率汇入 R5「精神」稳健性维度。",
    keyQuestion: "这个动作是在投资、创新，还是兑现承诺？有没有相应依据？",
  },
  wuShiQiJi: {
    id: "wuShiQiJi",
    name: "五事七计",
    origin: "《孙子兵法·始计篇》",
    tagline: "出兵前的战略完整性与胜算校验。",
    principle:
      "五事：道（上下同欲）、天（时机）、地（赛道/地形）、将（领导力）、法（组织与制度）；七计以敌我对比推演胜算，追求“先胜而后求战”。用作战略方案的完整性体检——五个维度是否都想清楚了。",
    howItWorks: "战略制定与复盘中的方案完整性校验项，避免“有勇无谋”的战略缺口。",
    keyQuestion: "道天地将法五件事，我们哪一件还没想透？",
  },
  bsc: {
    id: "bsc",
    name: "BSC 平衡计分卡",
    origin: "Kaplan & Norton · Balanced Scorecard",
    tagline: "四维度平衡 + 因果链 + 领先/滞后指标。",
    principle:
      "财务 ← 客户 ← 内部流程 ← 学习成长，下层是上层的“因”。用可干预的领先指标去预测结果性的滞后指标；战略地图把抽象战略画成一条可读的因果故事，避免只盯财务结果。",
    howItWorks:
      "战略解码的 BSC 四卡与战略地图；BscMeasure 年度目标拆为季度里程碑；四维红绿灯汇入集团健康。",
    keyQuestion: "要的财务结果，背后的客户、流程、能力之“因”是否都种下了？",
  },
  okr: {
    id: "okr",
    name: "OKR 目标与关键结果",
    origin: "Andy Grove / John Doerr（Intel / Google）",
    tagline: "聚焦、对齐、信心指数。",
    principle:
      "O 是定性、鼓舞人心的方向；KR 是 2–4 个可量化的结果。自上而下对齐、自下而上承诺；信心指数动态反映达成概率。OKR 是有挑战的目标，不是用来打绩效的 KPI。",
    howItWorks:
      "O = BSC 战略目标，KR = 季度结果（可挂 Vx 里程碑）；禁止把三支柱写成 O；KR 绑定预算标签与 FPA。",
    keyQuestion: "这个季度，什么是我们最想达成的方向？用哪几个结果来证明？",
  },
  hoshin: {
    id: "hoshin",
    name: "Hoshin X-Matrix 方针管理",
    origin: "Hoshin Kanri（丰田 / 精益）",
    tagline: "长期突破 ↔ 年度突破 ↔ 改善项目 ↔ 指标 的四象限对齐。",
    principle:
      "X 矩阵把长期战略、年度目标、改善项目、考核指标放在一张矩阵上，用“关联点”显式连接，确保上下贯通、左右呼应；内含 PDCA 改善环的制造业基因。",
    howItWorks: "战略解码中可与 BSC 战略地图切换视图；关联点即 OKR-O ↔ Vx ↔ Measure 的连接。",
    keyQuestion: "年度突破和长期战略、具体项目、考核指标，是否都连得上？",
  },
  fourDX: {
    id: "fourDX",
    name: "4DX 执行四原则",
    origin: "《高效能人士的执行 4 原则》· FranklinCovey",
    tagline: "聚焦 WIG + 紧盯领先指标 + 醒目记分板 + 问责节律。",
    principle:
      "① 聚焦极少数最重要目标（WIG）；② 作用于“领先指标”（可影响、有预见性），而非只看“滞后指标”（结果已成定局）；③ 一个让人一眼知道输赢的记分板；④ 定期问责节律。核心是把精力从“结果”移到“可撬动的杠杆”上。",
    howItWorks:
      "看执行顶部的执行记分板：1 个公司级 WIG（置顶 OKR-O 或由诊断 crux 衍生）+ 2–4 个领先指标（KR 或假设验证）；Cynefin 复杂域的指标优先进入领先指标池。",
    keyQuestion: "为了这个最重要目标，本周我们能亲手推动的领先指标是什么？",
  },
  cynefin: {
    id: "cynefin",
    name: "Cynefin 情境框架",
    origin: "Dave Snowden（IBM / Cognitive Edge）",
    tagline: "先判断情境复杂度，再选方法——绝不一刀切。",
    principle:
      "清晰（clear：用最佳实践/SOP）、繁杂（complicated：靠专家分析）、复杂（complex：事先无法预知因果，需小步试错探测）、混沌（chaotic：先止血再图谋）。最常见的错误，是用“清晰域”的年度 KPI 去管理本属“复杂域”的探索创新。",
    howItWorks:
      "假设/Vx/战略议题必须标注 cynefin_domain：complex → 用季度探测 KR + 假设验证，勿强定年度 KPI；chaotic → 48 小时内 CEO 裁决、暂停年度 KPI 统计。",
    keyQuestion: "这件事是“照做就行”，还是“没人知道答案、得试”？",
  },
  mintzberg: {
    id: "mintzberg",
    name: "Mintzberg 应然 / 涌现战略",
    origin: "Henry Mintzberg · Deliberate vs Emergent Strategy",
    tagline: "真实战略 = 刻意的计划 + 执行中涌现的模式。",
    principle:
      "计划的战略未必全部实现（未实现）；执行中会冒出没写进计划却有效的打法（涌现）；也有纯属意外却做成了的（偶成）。优秀组织的本事，是及时识别“涌现”并把它吸收进下一版“刻意”战略。战略是行动流中显现的模式，不只是一份文档。",
    howItWorks:
      "StratDiff 计算“刻意实现率”，并把 涌现 / 未实现 / 偶成 列为变化类型 #15–18；月报 §8 标注形成类型喂养候选；R6「学习」稳健性 = 涌现被吸收的比例。",
    keyQuestion: "这半年自发冒出来的有效打法，要不要写进下一版正式战略？",
  },
  stratDiff: {
    id: "stratDiff",
    name: "StratDiff 战略版本对比",
    origin: "版本控制思想 + Mintzberg 归因 · 差异化核心",
    tagline: "两次战略会之间——什么变了、为什么变、稳不稳。",
    principle:
      "把每次战略会的状态冻结成不可变快照，机器自动比对十余类变化（预测修订、现金安全线、假设失效、投资门禁、涌现模式…），按严重度 + Mintzberg 优先级排序。让战略演化可追溯、可归因，像给战略做“版本管理”。",
    howItWorks:
      "规定对比：去年底 vs 今年中、今年中 vs 今年底、年度对年度；输出 Top 变化清单与董事会一页纸的“变化段”。",
    keyQuestion: "和上次战略会相比，真正发生变化的是哪几条？变因是什么？",
  },
  counterfactual: {
    id: "counterfactual",
    name: "反事实推演 (Counterfactual)",
    origin: "反事实 / 情景压力测试",
    tagline: "“如果……会怎样”——对关键赌注做压力测试。",
    principle:
      "选定一个偏离前提（如核心产品延迟 2 季、全品类降价 10%），沿因果链推算它对营收、利润、现金 runway 的冲击，并联动到相关的变化类别。目的是在会前预演风险与边界，而非追求精确预测。",
    howItWorks:
      "历史版本页的反事实面板：选预设或调节幅度，经驱动式弹性模型（锚定真实营收预测、弹性系数可校准）即时给出营收/利润/runway 变化与关联 diff。它是方向性 what-if；要看概率区间，配合 SPBP 蒙特卡洛。",
    keyQuestion: "我们押注的前提一旦不成立，最坏会坏到哪里？",
  },
  stratRobust: {
    id: "stratRobust",
    name: "StratRobust 战略稳健性",
    origin: "R1–R6 六维稳健性框架",
    tagline: "战略“还站不站得住”的六维加权体检。",
    principle:
      "R1 方向 / R2 逻辑 / R3 执行 / R4 底线 / R5 精神 / R6 学习，按权重（执行 0.22 最高，底线与方向各 0.2）汇成总分。它不衡量“做了多少”，而衡量战略整体的韧性与内在一致性。",
    howItWorks:
      "健康度页展示总分与分维；数据来自 StratDiff、假设账本、Deliver 兑现率、健康灯、Doctrine 审计、涌现吸收率。",
    keyQuestion: "方向、逻辑、执行、底线、精神、学习，哪一维在拖后腿？",
  },
  fpa: {
    id: "fpa",
    name: "FPA · B-A-F 财务脊梁",
    origin: "Financial Planning & Analysis",
    tagline: "全系统统一的财务口径：预算 / 实际 / 预测。",
    principle:
      "B（Budget，战略会定稿）、A（Actual，月报实际）、F（Forecast，季中滚动修订）三者构成闭环；偏差 =（A 或 F）vs B，是健康度财务维与 StratDiff 的触发源。FPA 是贯穿所有模块的“数字脊梁”——任何涉及资源与结果的产出都要能回答 B/A/F 各是多少。",
    howItWorks:
      "FPA 财务页：B-A-F 闭环 + 四品牌 P&L + 现金 runway + Vx 预算 ROI；现金 runway < 3 月触发一票否决。",
    keyQuestion: "这件事的预算、实际、预测各是多少？偏差挂在哪条假设上？",
  },
  spbp: {
    id: "spbp",
    name: "SPBP 情景规划",
    origin: "Scenario Planning（Shell）+ 贝叶斯思想",
    tagline: "不赌单一未来——乐观/基准/悲观三情景与概率。",
    principle:
      "为不确定的未来准备多套剧本，各赋概率，并随新证据用贝叶斯法则更新（后验 ∝ 先验 × 似然）。再用蒙特卡洛抽样得到结果分布（而非单点），看 P10/P50/P90 与跨安全线的概率，避免“单点线性预测”的脆弱性。",
    howItWorks:
      "FPA 情景 Tab：新证据触发真正的贝叶斯更新（似然比 = exp(强度)，无信息证据不改先验）；蒙特卡洛（情景混合 + 对数正态噪声、种子固定可复现）输出营收/利润/runway 的 P10/P50/P90 及 P(runway<3 月)。",
    keyQuestion: "如果未来不是基准情景，我们的现金和利润扛得住吗？概率多大？",
  },
  healthModel: {
    id: "healthModel",
    name: "健康度模型 · 描述-诊断-预测-规范",
    origin: "三维 / 十二维健康度 + 分析成熟度阶梯",
    tagline: "不只打分，必须给出行动。",
    principle:
      "分析要走完四步：描述（现状如何）→ 诊断（为何如此）→ 预测（将走向何处）→ 规范（该做什么）。三维（承诺兑现 30% + 价值观 25% + 业务运营 45%）给 CEO 看，十二维供战略部下钻；任一子维亮红，对应的三维块也变红。",
    howItWorks: "集团健康页：BSC 四灯 + 当期 KPI + 稳健性 + 十二维下钻（按角色）。",
    keyQuestion: "这盏红灯，除了“是红的”，我们打算做什么？",
  },
  vetoGate: {
    id: "vetoGate",
    name: "一票否决 (Veto Gate)",
    origin: "底线治理硬约束",
    tagline: "触及底线即阻断战略定稿——不靠自觉，靠系统。",
    principle:
      "现金 runway < 3 月、重大质量/合规事故、核心团队流失 > 30%、品牌 NPS < 0，任一触发即“一票否决”，阻止快照冻结，除非 CEO 显式写下例外说明。把治理底线写进系统，使其不可被乐观情绪绕过。",
    howItWorks:
      "定稿前运行健康断言校验；存在未豁免的否决项时直接阻断 freeze，并要求 CEO 留下例外备注。",
    keyQuestion: "在定稿这版战略前，有没有任何一条底线已经被突破？",
  },
};

export function getConcepts(ids: string[]): Concept[] {
  return ids.map((id) => CONCEPTS[id]).filter((c): c is Concept => Boolean(c));
}
