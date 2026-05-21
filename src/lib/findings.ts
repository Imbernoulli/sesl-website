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

  fig1Title: "Figure 1 · Compute-optimal N_opt(C) and K_opt(C)",
  fig1Caption:
    "Power-law fit of optimal proposer size and optimal trial count against inference compute. " +
    "Mirrors Chinchilla Fig 1: the two panels report N_opt(C) and (here) K_opt(C) instead of D_opt(C).",
  fig1Reading:
    "K_opt scales steeply with compute (α_K close to 0.75 here); N_opt is nearly flat. " +
    "In Chinchilla's training-time setting model and tokens scale at α ≈ 0.5 each (joint Approach-3); " +
    "in our inference-time setting almost all marginal compute should be spent on more trials, " +
    "not on a bigger proposer.",
  fig1AxN: "N_opt (active parameters, B)",
  fig1AxK: "K_opt (trials)",
  fig1AxC: "Inference FLOPs C ≈ N·K·T·W",

  fig2Title: "Figure 2 · Approach 1 — Training-curve envelope",
  fig2Caption:
    "Each thin line is one SESL run plotted as (cumulative compute, relative regret); colour encodes proposer " +
    "active size (yellow → small, dark blue → large). The lower envelope of all curves (highlighted) is the " +
    "compute-optimal frontier. Direct analogue of Chinchilla Fig 2 left.",
  fig2Reading:
    "The envelope is power-law in inference compute. Different model sizes dominate the frontier in different " +
    "compute regimes — exactly the cross-over behaviour Chinchilla observed for varying training budgets.",
  fig2AxC: "Inference FLOPs C (log)",
  fig2AxLoss: "Relative regret R (log, lower is better)",

  fig3Title: "Figure 3 · Approach 2 — IsoCompute U-shapes",
  fig3Caption:
    "For each fixed compute bin we plot relative regret against proposer size. Mirrors Chinchilla Fig 3 left. " +
    "Each connected line is one IsoFLOP profile; the marker at the bottom shows N_opt(C).",
  fig3Reading:
    "With only three proposer sizes the U-shapes are coarse and N_opt jumps discretely across bins. " +
    "Still, the qualitative IsoFLOP behaviour holds: at small C, the small proposer is dominant; at large C, " +
    "either the small or the large proposer wins depending on heuristic-lock onset.",
  fig3AxN: "Proposer active parameters N (log, B)",
  fig3AxLoss: "Geometric-mean relative regret R (log)",

  fig4Title: "Figure 4 · Approach 3 — Parametric L(N, K)",
  fig4Caption:
    "Per-task parametric fit L(N, K) = E + A·N^{−α_N} + B·K^{−α_K}; cells show the median exponents across " +
    "tasks for each feedback level. Iso-loss curves are overlaid on the (N, K) plane. Mirrors Chinchilla Fig 4.",
  fig4Reading:
    "Median exponents are reported in the chart headers. The contours bow toward the (small-N, large-K) " +
    "corner: for a fixed regret budget, more trials buy more reduction than a bigger proposer.",
  fig4AxN: "N (B, log)",
  fig4AxK: "K (log)",

  fig5Title: "Figure 5 · Predicted-vs-observed regret",
  fig5Caption:
    "Scatter of predicted (Approach-3 fit) vs observed mean regret across all (task, model, F, K) cells. " +
    "Black 1:1 line. Mirrors Chinchilla's validation scatter.",
  fig5Reading:
    "Linear R² and log-space R² are reported above. Off-diagonal mass — when the predictor under-estimates " +
    "low-regret cells — is the parametric form's residual: a 3-parameter fit cannot capture heuristic-lock " +
    "or invalid-output cliffs.",
  fig5AxObs: "Observed mean regret",
  fig5AxPred: "Predicted regret (Approach 3)",

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

  fig1Title: "Figure 1 · 计算最优 N_opt(C) 与 K_opt(C)",
  fig1Caption:
    "推理算力下最优 proposer 大小、最优 trial 数的幂律拟合。镜像 Chinchilla Fig 1：两个面板分别是 " +
    "N_opt(C) 和（此处）K_opt(C)，原文是 D_opt(C)。",
  fig1Reading:
    "K_opt 随算力陡增（这里 α_K ≈ 0.75），N_opt 接近平坦。" +
    "Chinchilla 的训练场景里 N 和 D 都按 α ≈ 0.5 同时 scale（联合 Approach 3 结果）；" +
    "在我们的推理时场景下，几乎所有边际算力都应该用来加 trial，而不是换更大的 proposer。",
  fig1AxN: "N_opt (active 参数, B)",
  fig1AxK: "K_opt (trial 数)",
  fig1AxC: "推理 FLOPs C ≈ N·K·T·W",

  fig2Title: "Figure 2 · Approach 1 —— 训练曲线 envelope",
  fig2Caption:
    "每条细线是一条 SESL run，绘制成（累计算力, 相对 regret）；颜色编码 proposer active 大小（黄 → 小，深蓝 → 大）。" +
    "下包络（高亮）就是 compute-optimal frontier。直接对应 Chinchilla Fig 2 左。",
  fig2Reading:
    "下包络在推理算力上呈幂律。不同算力区间，不同模型主导前沿——正是 Chinchilla 在变 budget 下观察到的 cross-over。",
  fig2AxC: "推理 FLOPs C (log)",
  fig2AxLoss: "相对 regret R (log，越低越好)",

  fig3Title: "Figure 3 · Approach 2 —— IsoCompute U-shape",
  fig3Caption:
    "在每个固定算力区间内，把相对 regret 对 proposer 大小作图。镜像 Chinchilla Fig 3 左。" +
    "每条连线是一条 IsoFLOP profile；下方标记是 N_opt(C)。",
  fig3Reading:
    "由于只有三个 proposer 大小，U-shape 比较粗，N_opt 在区间之间是离散跳跃的。" +
    "但定性 IsoFLOP 行为成立：小算力时小 proposer 占优，大算力时根据是否进入启发式锁，可能是小或大模型胜出。",
  fig3AxN: "Proposer active 参数 N (log, B)",
  fig3AxLoss: "几何平均相对 regret R (log)",

  fig4Title: "Figure 4 · Approach 3 —— 参数化 L(N, K)",
  fig4Caption:
    "对每个任务做参数化拟合 L(N, K) = E + A·N^{−α_N} + B·K^{−α_K}；面板标题里报的是每种反馈下跨任务的指数中位数。" +
    "(N, K) 平面上叠加等损耗曲线。镜像 Chinchilla Fig 4。",
  fig4Reading:
    "等损耗曲线朝 (小 N, 大 K) 角弯曲：" +
    "在固定 regret 预算下，多 trial 换来的 reduction 比换大 proposer 更高效。",
  fig4AxN: "N (B，log)",
  fig4AxK: "K (log)",

  fig5Title: "Figure 5 · 预测 vs 观测",
  fig5Caption:
    "Approach-3 拟合的预测值与所有 (task, model, F, K) 单元的实测均值散点。黑色 1:1 线。" +
    "镜像 Chinchilla 的验证散点。",
  fig5Reading:
    "图上方报线性 R² 和 log-space R²。低 regret 单元被预测器低估时偏离对角线——这是参数化形式的残差：" +
    "三参数拟合捕不到启发式锁和 invalid-output cliff。",
  fig5AxObs: "实测平均 regret",
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
