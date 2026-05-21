// Bilingual copy for the /findings results page. Numeric values are
// derived live from xt_curves in state.json so they stay in sync with
// new data — the strings here are only the explanatory text.

export type Lang = "en" | "zh";

export interface Copy {
  pageTitle: string;
  pageSubtitle: string;
  langButtonEN: string;
  langButtonZH: string;
  asOf: string;
  backToDashboard: string;
  lead: string;
  // four findings
  finding1Title: string;
  finding1Lead: string;
  finding1TableTitle: string;
  finding1Reading: string;
  finding2Title: string;
  finding2Lead: string;
  finding2Reading: string;
  finding3Title: string;
  finding3Lead: string;
  finding3Reading: string;
  finding4Title: string;
  finding4Lead: string;
  finding4TableHead: { task: string; bestModel: string; setting: string; bestValue: string };
  finding4Reading: string;
  limitsTitle: string;
  limits: string[];
  whatsNextTitle: string;
  whatsNext: string[];
  // chart axis labels
  axisK: string;
  axisRelLoss: string;
  axisAlpha: string;
  tableCols: {
    model: string;
    feedback: string;
    alpha: string;
    r2: string;
    kRange: string;
  };
  notes: {
    f2HelpsWeak: string;
    saturation: string;
    smallModelWins: string;
  };
}

const en: Copy = {
  pageTitle: "Initial Findings",
  pageSubtitle:
    "Four results that the existing SESL grid runs already support, rolled up from 1,194 grid runs across 3 proposer models and 16+ tasks.",
  langButtonEN: "EN",
  langButtonZH: "中",
  asOf: "Snapshot",
  backToDashboard: "← Dashboard",
  lead:
    "SESL is a harness that lets an LLM-driven evolutionary search refine code over K trials against a deterministic objective. " +
    "We measure how well the harness scales as we vary trial count (K), feedback richness (F0 = scalar-only, F2 = scalar + diagnostics), and proposer-model size. " +
    "The four findings below are stable across our current data and form the spine of the eventual paper.",

  finding1Title: "1 · Test-time scaling follows a power law",
  finding1Lead:
    "Across all model × feedback combinations the cross-task normalised score follows " +
    "R(K) = R_inf + A · K^-α. Six curves fit cleanly (r² ≥ 0.75); the strongest test-time scaling exponent we observe is α = 0.94 (Qwen3.6-35B-A3B with F2 feedback).",
  finding1TableTitle: "Power-law fits (per model × feedback level)",
  finding1Reading:
    "Read α as the 'sample-efficiency exponent': how much each additional doubling of trials buys. " +
    "Two clean signals here: (a) larger proposer ⇒ larger α (35B ≫ 4B), (b) the 27B fits are weak because the model is already at ceiling at K=1 (mean_norm ≈ 1.00 from the start).",

  finding2Title: "2 · Rich feedback helps weak models far more than strong ones",
  finding2Lead:
    "F2 (scalar score + diagnostic feedback) raises the test-time scaling exponent α by a much larger margin on the small model than on the large one.",
  finding2Reading:
    "If feedback richness were a generic harness improvement, every model would benefit equally. We see the opposite — the 4B gains +51% relative to itself while the 35B gains only +4%. " +
    "Interpretation: the 35B already has enough prior knowledge to extract the right next-edit from a scalar score, while the 4B needs the diagnostic to know where its candidate went wrong. " +
    "This is the 'Seeing' axis of the SESL design space.",

  finding3Title: "3 · The 35B saturates at K = 8–16, but is not at the optimum",
  finding3Lead:
    "On combinatorial-optimisation tasks the 35B converges to a near-constant best-so-far by K ≈ 16, " +
    "yet the saturation point is 25-43% below the achievable bound on MaxCut. " +
    "This is heuristic-lock, not theoretical convergence.",
  finding3Reading:
    "Diagnostic confirmed by inspecting individual runs: on maxcut60 the model produces 71 trials with only 1 unique scored value — every trial rediscovers the same greedy heuristic. " +
    "The implication for scaling-law work: when α appears to saturate against a ceiling, that ceiling is the model's behavioural attractor, not the problem's optimum. Mitigations (temperature, island MAP-Elites) are queued in the dashboard's Phase-4 backlog.",

  finding4Title: "4 · The small model beats the large one on simple problems",
  finding4Lead:
    "On all rastrigin sizes (8, 16, 50, 100) the 4B reaches the theoretical optimum (regret = 0); " +
    "on small combinatorial instances (maxcut60, maxcut100, tsp60) the 4B's best is also above the 35B's best. " +
    "The 35B only takes the lead on larger circle-packing, large maxcut, and large TSP.",
  finding4TableHead: {
    task: "Task",
    bestModel: "Best model",
    setting: "K · F",
    bestValue: "Best score",
  },
  finding4Reading:
    "Consistent with the heuristic-lock finding: on tasks where a non-trivial heuristic doesn't exist (rastrigin, small instances), the 35B locks onto a bad one immediately and never explores out, " +
    "while the 4B's looser distribution stumbles into the global optimum. " +
    "The cross-over to 35B advantage happens once instances get large enough that diversified greedy heuristics dominate random exploration.",

  limitsTitle: "Limitations / known issues",
  limits: [
    "35B at K=128/256 has many ALLINV runs (every trial produced syntactically-invalid code) — late-K curves are sparser than headline counts suggest. F4 (richest feedback) at K=256 was entirely ALLINV.",
    "27B coverage is thin (4-6 OK runs per (K,F) bucket); α fits r² ≈ 0.75–0.77 are only sanity-check quality.",
    "The maxcut-diversity sweep (temperature × n_islands) and harness-axis sweeps were interrupted by an inference-server crash on 2026-05-20 and have not yet resumed.",
    "All numbers are aggregated from the published state.json bundle; the underlying jsonl runs live in the private sesl-dev repo.",
  ],

  whatsNextTitle: "Coming up",
  whatsNext: [
    "Harness axis: islands × history_depth × summary_chars × temperature sweep on 4B (best signal vs. cost ratio).",
    "Maxcut diversity sweep to test whether temperature / island-MAP-Elites can break the 35B heuristic-lock.",
    "12 upstream open-ended tasks (MLS-Bench + Frontier-Engineering JobShop) — first batches already producing per-trial walls in the 1.5–33 s range.",
  ],

  axisK: "K (trials, log)",
  axisRelLoss: "Relative loss · lower is better",
  axisAlpha: "α (test-time scaling exponent)",
  tableCols: {
    model: "Proposer model",
    feedback: "Feedback",
    alpha: "α",
    r2: "r²",
    kRange: "K range",
  },
  notes: {
    f2HelpsWeak:
      "Δα for F2 vs F0 — small bar means little to gain from rich feedback, big bar means it matters.",
    saturation:
      "Normalised score on the y-axis: 1.00 = best the harness has ever produced for this task. The 35B-F0 curve hits 0.99 already at K=8.",
    smallModelWins:
      "Best score reached on each task in any of our runs. Tasks ordered by problem size.",
  },
};

const zh: Copy = {
  pageTitle: "初步结果",
  pageSubtitle:
    "目前 1194 个 grid run、3 个 proposer 模型、16+ 个任务，已经能稳定支持的四个结论。",
  langButtonEN: "EN",
  langButtonZH: "中",
  asOf: "数据快照",
  backToDashboard: "← 仪表盘",
  lead:
    "SESL 是一个让 LLM 驱动的进化搜索在确定性目标上迭代代码、跑 K 个 trial 的 harness。" +
    "我们测量 harness 在不同 K（trial 数）、不同反馈丰富度（F0 = 只给标量分数，F2 = 标量 + 诊断信息）、不同 proposer 模型大小下的 scaling 行为。" +
    "下面四个结论在当前数据上稳定成立，是后续 paper 的主线。",

  finding1Title: "1 · Test-time scaling 服从幂律",
  finding1Lead:
    "在所有 (模型, 反馈) 组合上，归一化跨任务得分都拟合 R(K) = R∞ + A · K^-α。" +
    "六条曲线都拟合得很干净 (r² ≥ 0.75)；目前观察到最强的 test-time scaling 指数是 α = 0.94（Qwen3.6-35B-A3B，F2 反馈）。",
  finding1TableTitle: "幂律拟合（按 模型 × 反馈丰富度）",
  finding1Reading:
    "α 可以理解成 sample-efficiency 指数：每翻倍一次 trial 数，能多换回多少 regret。" +
    "两个干净的信号：(a) proposer 越大，α 越大（35B ≫ 4B）；(b) 27B 的拟合质量较差，因为它从 K=1 起就接近上限（mean_norm ≈ 1.00），几乎没有 scaling 信号可学。",

  finding2Title: "2 · 丰富反馈对弱模型的帮助远大于强模型",
  finding2Lead:
    "把反馈从 F0（仅标量）切到 F2（标量 + 诊断）能提升 α；但对小模型提升幅度远大于大模型。",
  finding2Reading:
    "如果反馈丰富度只是 harness 层面的一致改进，那它对所有模型应当带来差不多的提升。" +
    "数据呈现相反趋势：4B 相对自身提升 +51%，35B 只提升 +4%。" +
    "解读：35B 自己的先验已经足够从一个标量分数推断下一步该怎么改；而 4B 必须靠诊断信息才能知道当前候选错在哪里。" +
    "这正对应 SESL 设计空间中的 'Seeing' 轴。",

  finding3Title: "3 · 35B 在 K = 8–16 就饱和，但远未到最优",
  finding3Lead:
    "在组合优化任务上 35B 大约在 K ≈ 16 时就收敛到一个近似常数；" +
    "但这个饱和点距离 MaxCut 的可达上界还差 25-43%。" +
    "也就是说，这并不是理论上的收敛，而是模型陷入了启发式锁。",
  finding3Reading:
    "已通过单条 run 验证：在 maxcut60 上 35B 跑了 71 个 trial，但只产出 1 个唯一的有效得分 —— 每个 trial 都在重新发现同一个 greedy 启发式。" +
    "对 scaling-law 研究的意义：当 α 看上去到顶时，那个顶很可能是模型的行为吸引子，而不是问题的最优解。" +
    "已规划的破解手段（温度、岛屿 MAP-Elites）放在仪表盘的 Phase 4 队列里。",

  finding4Title: "4 · 小模型在简单问题上反超大模型",
  finding4Lead:
    "在 rastrigin 所有规模 (8、16、50、100) 上 4B 都达到理论最优 (regret = 0)；" +
    "在小规模组合任务 (maxcut60、maxcut100、tsp60) 上 4B 的最佳得分也优于 35B。" +
    "只有等问题规模变大（大 circle-packing、大 maxcut、大 TSP），35B 才反超。",
  finding4TableHead: {
    task: "任务",
    bestModel: "最优模型",
    setting: "K · F",
    bestValue: "最佳得分",
  },
  finding4Reading:
    "和启发式锁结论一致：在不存在显著启发式的任务（rastrigin、小规模实例）上，35B 一上来就锁定一个差的启发式且不再探索，" +
    "而 4B 的输出分布更松，反而能撞到全局最优。" +
    "等实例足够大、多样化的启发式开始压过随机探索时，35B 才占优。",

  limitsTitle: "局限 / 已知问题",
  limits: [
    "35B 在 K=128/256 时大量 trial 全 invalid (ALLINV)，后段曲线的有效样本比 headline 数字看起来要少；F4（最丰富反馈）在 K=256 上全部 ALLINV。",
    "27B 数据稀疏（每个 (K,F) 单元只有 4-6 条 OK run）；α 拟合 r² 在 0.75-0.77，只能当 sanity-check。",
    "maxcut 多样性扫描（温度 × n_islands）与 harness 轴扫描在 2026-05-20 被推理服务崩溃打断，尚未恢复。",
    "本页所有数字来自公开 state.json bundle；底层 jsonl 在私有的 sesl-dev 仓库里。",
  ],

  whatsNextTitle: "下一步",
  whatsNext: [
    "Harness 轴：在 4B 上扫 islands × history_depth × summary_chars × temperature（信号/成本比最优）。",
    "Maxcut 多样性扫描，测温度 / 岛屿 MAP-Elites 能否打破 35B 的启发式锁。",
    "12 个 upstream 开放式任务 (MLS-Bench + Frontier-Engineering JobShop) — 已有 batch 跑出 1.5-33 秒的 per-trial 时间。",
  ],

  axisK: "K (trial 数, log)",
  axisRelLoss: "归一化损失 · 越低越好",
  axisAlpha: "α (test-time scaling 指数)",
  tableCols: {
    model: "Proposer 模型",
    feedback: "反馈",
    alpha: "α",
    r2: "r²",
    kRange: "K 范围",
  },
  notes: {
    f2HelpsWeak:
      "F2 相对 F0 的 Δα；条短表示富反馈基本没用，条长表示富反馈关键。",
    saturation:
      "纵轴为归一化得分：1.00 = 当前 harness 在该任务上的历史最佳。35B-F0 在 K=8 就达到了 0.99。",
    smallModelWins:
      "各任务在所有 run 中的最佳得分；按问题规模排序。",
  },
};

export const findingsCopy: Record<Lang, Copy> = { en, zh };
