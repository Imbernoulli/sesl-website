// Bilingual copy for the /findings scaling-law page.
// Mirrors Chinchilla (Hoffmann et al. 2022, arXiv 2203.15556) figure
// structure 1-1: each section here matches one figure in that paper.
// Numbers are derived live from scaling_laws.json — only the
// explanatory strings live in this file.

export type Lang = "en" | "zh";

export interface Copy {
  pageTitle: string;
  pageSubtitle: string;
  asOf: string;
  backToDashboard: string;
  langEN: string;
  langZH: string;
  setupTitle: string;
  setupBody: string;
  axisMapTitle: string;
  axisMapRows: Array<{ chinchilla: string; sesl: string; note: string }>;
  // Figure 1 — overview (Chinchilla Fig 1)
  fig1Title: string;
  fig1Caption: string;
  fig1Reading: string;
  fig1AxN: string;
  fig1AxC: string;
  fig1AxK: string;
  // Figure 2 — Approach 1 (Chinchilla Fig 2)
  fig2Title: string;
  fig2Caption: string;
  fig2Reading: string;
  fig2AxC: string;
  fig2AxLoss: string;
  // Figure 3 — Approach 2 (Chinchilla Fig 3)
  fig3Title: string;
  fig3Caption: string;
  fig3Reading: string;
  fig3AxN: string;
  fig3AxLoss: string;
  // Figure 4 — Approach 3 (Chinchilla Fig 4)
  fig4Title: string;
  fig4Caption: string;
  fig4Reading: string;
  fig4AxN: string;
  fig4AxK: string;
  // Figure 5 — validation
  fig5Title: string;
  fig5Caption: string;
  fig5Reading: string;
  fig5AxObs: string;
  fig5AxPred: string;
  // Appendix A — α distribution
  appATitle: string;
  appACaption: string;
  // Footer caveats
  caveatsTitle: string;
  caveats: string[];
  // Misc strings
  exponentLabel: string;
  r2Label: string;
  nLabel: string;
  taskColHeader: string;
  modelColHeader: string;
  fLabel: string;
  feedbackLabel: string;
}

const en: Copy = {
  pageTitle: "Scaling Laws — Chinchilla 2203.15556 mirror",
  pageSubtitle:
    "Five figures mirroring Hoffmann et al. (2022) on existing SESL grid data. " +
    "The mapping is: model params N → proposer active params, training tokens D → search tokens (K·T·W), " +
    "training FLOPs C → inference FLOPs (≈ N·K·T·W), training loss L → relative regret R(K) = (hi − best@K) / (hi − best@1).",

  asOf: "Snapshot",
  backToDashboard: "← Dashboard",
  langEN: "EN",
  langZH: "中",

  setupTitle: "Setup",
  setupBody:
    "We follow Chinchilla's three-approach structure on top of a self-evolve harness in which an LLM proposer " +
    "generates candidate programs for K trials, each spending up to T thinking tokens at parallel width W. " +
    "Per-task relative regret is the Codex-suggested metric whose (hi − lo) scale cancels: only the per-task " +
    "theoretical / observed upper bound is needed. All exponents below are reported on R(K) directly.",

  axisMapTitle: "Axis correspondence",
  axisMapRows: [
    { chinchilla: "Model parameters N", sesl: "Proposer active parameters N (B)",
      note: "Qwen3.5-4B → 4.0, Qwen3.6-27B → 27.0, Qwen3.6-35B-A3B → 3.0 (active, MoE)" },
    { chinchilla: "Training tokens D", sesl: "Search tokens ≈ K · T · W",
      note: "K trials × T thinking tokens × W parallel width" },
    { chinchilla: "Training FLOPs C ≈ 6·N·D", sesl: "Inference FLOPs C ≈ N · K · T · W",
      note: "Inference compute scales linearly in N_active per token" },
    { chinchilla: "Validation loss L", sesl: "Relative regret R(K) = (hi − best@K) / (hi − best@1)",
      note: "Scale-invariant; lower is better; floor at machine precision" },
  ],

  fig1Title: "Figure 1 · Headline K-axis scaling law",
  fig1Caption:
    "Per (proposer, feedback) class we pool K-axis prefixes from every run and plot the " +
    "geometric-mean relative regret across tasks at each K. Each line is fitted as " +
    "R(K) = c · K^{−α_K}. K is the only axis where we have dense log-spaced data, so this is " +
    "the most reliable figure on the page.",
  fig1Reading:
    "α_K values cluster between 0.10 and 0.40 across (model, F). The 4B proposer with F0 feedback " +
    "is steepest (α_K = 0.40, R² = 0.95). 35B-A3B is shallower because it saturates by K ≈ 16 — " +
    "heuristic-lock, not theoretical convergence.",
  fig1AxN: "",
  fig1AxK: "",
  fig1AxC: "",

  fig2Title: "Figure 2 · Compute envelope across proposers",
  fig2Caption:
    "Each thin line is one SESL run plotted as (inference FLOPs C, relative regret R). Lines are " +
    "categorically coloured by proposer (no continuous N gradient — there are only three discrete " +
    "proposer sizes, two dense and one MoE). The bold line is the lower envelope: the compute-optimal " +
    "frontier achievable on these tasks.",
  fig2Reading:
    "The frontier descends as a power law in inference compute over ~3 decades, then flattens around " +
    "10⁹ FLOPs where heuristic-lock and all-invalid cliffs dominate. The envelope is set mostly by " +
    "35B-A3B at low compute and by 4B at high compute.",
  fig2AxC: "Inference FLOPs C (log)",
  fig2AxLoss: "Relative regret R (log, lower is better)",

  fig3Title: "Figure 3 · IsoFLOP comparison across proposers",
  fig3Caption:
    "For each ~0.4-decade compute bin we plot geometric-mean relative regret as a function of " +
    "PROPOSER (a categorical x-axis, not a smooth N axis: we only have three proposers — and one " +
    "is an MoE). X labels show both N_active and N_total so the dense/MoE distinction is explicit. " +
    "Colour encodes inference-FLOP budget.",
  fig3Reading:
    "Two observations stick: (1) the 27B dense model is dominated at every compute level — neither " +
    "cheaper than 4B nor better than 35B-A3B; (2) the winner flips with C — at low compute 35B-A3B " +
    "wins, at high compute 4B catches up because its diversity escapes the 35B-A3B heuristic-lock.",
  fig3AxN: "",
  fig3AxLoss: "",

  fig4Title: "Figure 4 · Joint L(N, K) fit — predicted vs observed",
  fig4Caption:
    "Predicted vs observed mean regret for the per-task joint fit L(N, K) = E + A·N^{−α_N} + B·K^{−α_K}. " +
    "Black dashed = 1:1 line. The previous version of this page tried to draw the same fit as a 2D " +
    "contour on (C, N); we dropped that because with only 3 N values the contour was extrapolation, " +
    "not data.",
  fig4Reading:
    "Log-R² ≈ 0.7. The fit systematically over-estimates the low-regret cells (e.g. 4B runs that hit " +
    "the rastrigin theoretical optimum) — a 3-parameter form can't capture heuristic-lock or the " +
    "convergence cliff. Treat the joint exponents as descriptive, not predictive.",
  fig4AxN: "",
  fig4AxK: "",

  fig5Title: "",
  fig5Caption: "",
  fig5Reading: "",
  fig5AxObs: "",
  fig5AxPred: "",

  appATitle: "Appendix · Cross-task α distribution",
  appACaption:
    "Distribution of the per-task K-axis exponent α across all tasks, split by proposer × feedback. " +
    "The wide spread is the analogue of Chinchilla observing distribution-dependent fits at the task level " +
    "before averaging.",

  caveatsTitle: "Caveats",
  caveats: [
    "T (thinking tokens) and W (parallel width) are mostly fixed at T=32768 and W=8; the only truly varied axes here are K and proposer size. T and W are folded into C as a constant factor.",
    "Only three proposer sizes makes Approach 2's U-shapes coarse. A fourth model size would help.",
    "Many 35B-A3B runs at K ≥ 128 are all-invalid (62% of total runs skipped). The frontier in Fig 2 is therefore biased toward low-K configurations on the largest proposer.",
    "The compute axis here is INFERENCE FLOPs, not training FLOPs. Direct comparison of α values to Chinchilla's training-time exponents (α ≈ 0.5, β ≈ 0.5) is not meaningful — both the cost model and the loss surface are different.",
  ],

  exponentLabel: "exponent",
  r2Label: "R²",
  nLabel: "n",
  taskColHeader: "Task",
  modelColHeader: "Model",
  fLabel: "F",
  feedbackLabel: "Feedback",
};

const zh: Copy = {
  pageTitle: "Scaling Laws —— Chinchilla 2203.15556 镜像",
  pageSubtitle:
    "在现有 SESL grid 数据上，按 Hoffmann et al. (2022) 的图序复刻五张图。" +
    "对应关系：模型参数 N → proposer active 参数；训练 token D → 搜索 token (K·T·W)；" +
    "训练 FLOPs C → 推理 FLOPs (≈ N·K·T·W)；训练 loss L → 相对 regret R(K) = (hi − best@K) / (hi − best@1)。",

  asOf: "数据快照",
  backToDashboard: "← 仪表盘",
  langEN: "EN",
  langZH: "中",

  setupTitle: "Setup",
  setupBody:
    "我们在 self-evolve harness 上复刻 Chinchilla 的三个 approach：LLM proposer 跑 K 个 trial，每个 trial " +
    "最多用 T 个 thinking token，宽度 W 并行。" +
    "相对 regret 是 Codex 建议的指标——它的 (hi − lo) 标度自然抵消，只需要一个稳定的 per-task 理论/观测上界。" +
    "下面所有指数都直接在 R(K) 上拟合。",

  axisMapTitle: "轴对应关系",
  axisMapRows: [
    { chinchilla: "模型参数 N", sesl: "Proposer active 参数 N (B)",
      note: "Qwen3.5-4B → 4.0，Qwen3.6-27B → 27.0，Qwen3.6-35B-A3B → 3.0 (active，MoE)" },
    { chinchilla: "训练 token D", sesl: "搜索 token ≈ K · T · W",
      note: "K trial × T 个 thinking token × W 并行" },
    { chinchilla: "训练 FLOPs C ≈ 6·N·D", sesl: "推理 FLOPs C ≈ N · K · T · W",
      note: "推理算力随 N_active 线性增长" },
    { chinchilla: "验证 loss L", sesl: "相对 regret R(K) = (hi − best@K) / (hi − best@1)",
      note: "标度无关；越小越好；地板取机器精度" },
  ],

  fig1Title: "Figure 1 · 主线：K 轴幂律",
  fig1Caption:
    "按 (proposer, feedback) 分类，把每条 run 的 K 轴前缀合并，对各 K 求跨任务几何平均相对 regret。" +
    "每条线按 R(K) = c · K^{−α_K} 拟合。K 是唯一拥有密集 log 等距数据的轴，所以这张图最可信。",
  fig1Reading:
    "α_K 在 (模型, F) 之间介于 0.10 到 0.40。4B + F0 最陡（α_K = 0.40，R² = 0.95）；" +
    "35B-A3B 比较平因为 K ≈ 16 就进入启发式锁——不是真的收敛到最优。",
  fig1AxN: "",
  fig1AxK: "",
  fig1AxC: "",

  fig2Title: "Figure 2 · 跨 proposer 的算力 envelope",
  fig2Caption:
    "每条细线一个 run，绘制成（推理 FLOPs C, 相对 regret R）。线按 proposer 分类着色——" +
    "没有连续的 N 渐变，因为我们只有三个离散 proposer，其中两个 dense 一个 MoE。" +
    "粗黑线是下包络，即 compute-optimal frontier。",
  fig2Reading:
    "下包络在大约 3 个数量级内呈幂律下降，到 10⁹ FLOPs 附近变平——这是启发式锁与 all-invalid cliff 主导的区域。" +
    "包络在低算力区主要由 35B-A3B 撑起，高算力区主要由 4B 撑起。",
  fig2AxC: "推理 FLOPs C (log)",
  fig2AxLoss: "相对 regret R (log，越低越好)",

  fig3Title: "Figure 3 · 跨 proposer 的 IsoFLOP 比较",
  fig3Caption:
    "每个约 0.4-decade 算力区间内，几何平均相对 regret 按 PROPOSER 排——不是连续 N 轴，" +
    "因为我们只有 3 个 proposer，其中一个是 MoE。X 轴标签同时给出 N_active 与 N_total，让 dense/MoE 区别看得清。" +
    "颜色编码推理 FLOPs 区间。",
  fig3Reading:
    "两点观察：(1) 27B dense 在每个算力级别都被支配——既不比 4B 便宜，也不比 35B-A3B 好；" +
    "(2) 赢家随 C 翻转：低算力时 35B-A3B 占优，高算力时 4B 反超，因为它的输出分布更松、能跳出 35B-A3B 的启发式锁。",
  fig3AxN: "",
  fig3AxLoss: "",

  fig4Title: "Figure 4 · 联合 L(N, K) 拟合——预测 vs 实测",
  fig4Caption:
    "联合拟合 L(N, K) = E + A·N^{−α_N} + B·K^{−α_K} 的预测值与所有 (task, model, F, K) 单元实测均值的散点。" +
    "黑色虚线 = 1:1。上一版本把这个拟合画成 (C, N) 平面上的二维等高线，但只有 3 个 N 值，等高线纯属外推——已删除。",
  fig4Reading:
    "log-R² ≈ 0.7。低 regret 单元（比如 4B 跑到 rastrigin 理论最优）系统性被高估——三参数拟合捕不到启发式锁和收敛 cliff。" +
    "把联合指数当描述性数字看，不要当预测器用。",
  fig4AxN: "",
  fig4AxK: "",

  fig5Title: "",
  fig5Caption: "",
  fig5Reading: "",
  fig5AxObs: "",
  fig5AxPred: "预测 regret (Approach 3)",

  appATitle: "附录 · 跨任务 α 分布",
  appACaption:
    "在所有任务上 K 轴指数 α 的分布，按 (proposer × feedback) 拆分。" +
    "分布的宽幅，正对应 Chinchilla 看任务级拟合时观察到的分布依赖。",

  caveatsTitle: "局限",
  caveats: [
    "T（thinking token 数）和 W（并行宽度）大多固定在 T=32768、W=8；这里真正变化的轴只有 K 和 proposer 大小。T 和 W 折叠到 C 里只是常数因子。",
    "只有 3 个 proposer 大小，Approach 2 的 U-shape 比较粗，再加一个模型大小会更稳。",
    "35B-A3B 在 K ≥ 128 时大量 run 全是 invalid（总 run 数的 62% 被剔除）。Fig 2 的 frontier 因此偏向低 K 的大模型配置。",
    "这里的算力轴是推理 FLOPs，不是训练 FLOPs。这些 α 值不能直接和 Chinchilla 的训练时指数（α ≈ 0.5, β ≈ 0.5）做数值对比——成本模型和 loss 曲面都不同。",
  ],

  exponentLabel: "指数",
  r2Label: "R²",
  nLabel: "n",
  taskColHeader: "任务",
  modelColHeader: "模型",
  fLabel: "F",
  feedbackLabel: "反馈",
};

export const findingsCopy: Record<Lang, Copy> = { en, zh };
