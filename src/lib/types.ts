// State.json shape — keep in lockstep with sesl-dev/scripts/build_site_data.py.

export interface ServerStatus {
  port: number;
  model: string;
  status: string;
  detail: string;
}

export interface GridStatus {
  name: string;
  pid: number | null;
  status: "running" | "stopped" | "retired" | "unknown" | string;
  log_lines: number;
  latest_log_tail: string[];
}

export interface RunCounts {
  total: number;
  completed: number;
  scored: number;
  ok: number;
  allinv: number;
  part: number;
}

export interface ScalingFit {
  alpha: number | null;
  r2: number | null;
  B_inf: number | null;
  A: number | null;
}

export interface XTCurve {
  model: string;
  algo: string;
  F: string;
  H: string;
  Ks: number[];
  mean_norm: number[];
  sem: (number | null)[];
  n_samples: Record<string, number>;
  fit: ScalingFit | null;
}

export interface CoverageCell {
  model: string;
  K: number;
  F: string;
  OK: number;
  ALLINV: number;
  PART: number;
}

export interface HeadlineEntry {
  task: string;
  model: string;
  K: number;
  F: string;
  best: number;
  best_run: string;
}

export interface EventEntry {
  ts: string;
  kind: string;
  detail: string;
}

// Per-run trajectory: each completed run becomes ONE continuous curve
// of best-so-far over trials. Downsampled log-spaced points to keep the
// JSON light. Kaplan/Chinchilla "many curves on one plot" style.
export interface Trajectory {
  run: string;
  model: string;
  task: string;
  F: string;
  H: string;
  K_max: number;
  seed: number;
  n_islands: number;
  history_depth: number;
  summary_chars: number;
  Ks: number[];
  regret: number[];   // per-task min-max normalized; lower = better
}

export interface EnvelopePoint {
  K: number;
  min_regret: number;
}

// --- Scaling-law tables (scaling_laws.json) — Chinchilla mirror -------
// One blob per axis. Numbers are floats or null; we surface them in
// /findings via inline SVG charts.

export interface AlphaCI {
  alpha_mean: number;
  lo95: number;
  hi95: number;
  n_boot: number;
}

export interface KFitPerTask {
  task: string;
  model: string;
  F: string;
  Ks: number[];
  mean_rel_loss: number[];
  n_runs_at_K: number[];
  n_runs_total: number;
  alpha: number | null;
  log_c: number | null;
  r2: number | null;
  alpha_ci: AlphaCI | null;
}

export interface JointNKFit {
  task: string;
  F: string;
  alpha_N: number;
  alpha_K: number;
  E: number;
  A: number;
  B: number;
  r2: number;
  n_cells: number;
  n_models: number;
  n_K_levels: number;
}

export interface IsoComputeBin {
  C_center: number;
  log10_C: number;
  n_points: number;
  pts: Array<{ N_B: number; rel_loss_geo: number; n_points: number; K_median: number }>;
  N_opt_B: number | null;
  K_opt: number | null;
}

export interface TrainingCurve {
  run: string;
  model: string;
  task: string;
  F: string;
  Nact_B: number;
  T: number;
  W: number;
  C: number[];
  rel_loss: number[];
}

export interface PredVsAct {
  task: string;
  F: string;
  model: string;
  K: number;
  predicted: number;
  observed: number;
  n_runs: number;
}

export interface ParametricFitOneF {
  alpha_N: number;
  alpha_K: number;
  E: number;
  A: number;
  B: number;
  Ns_B: number[];
  Ks: number[];
  grid_log_rel_loss: number[][];
  n_fits_used: number;
}

export interface ScalingLaws {
  n_runs_indexed: number;
  n_runs_skipped: Record<string, number>;
  K_per_task: KFitPerTask[];
  N_axis: {
    K_target: number;
    fits: Array<{
      task: string;
      F: string;
      K_target: number;
      Ns_billion: number[];
      model_loss: Record<string, number>;
      alpha_N: number;
      r2: number;
      n_models: number;
    }>;
    summary: Record<string, { n_tasks: number; alpha_N_mean: number; alpha_N_std: number; alpha_N_min: number; alpha_N_max: number }>;
  };
  F_axis: {
    fits: Array<{
      task: string;
      model: string;
      K: number;
      Fs: string[];
      loss_at_F: Record<string, number>;
      log_slope_per_F: number;
      improvement_per_F: number;
      n_F: number;
    }>;
    summary: Record<string, { n_fits: number; log_slope_mean: number; log_slope_std: number; improvement_factor_per_F: number }>;
  };
  joint_NK: {
    K_targets: number[];
    fits: JointNKFit[];
    summary: Record<string, { n_tasks: number; alpha_N_median: number; alpha_K_median: number; alpha_N_mean: number; alpha_K_mean: number }>;
  };
  compute_frontier: {
    frontier: Array<{ C: number; rel_loss: number; model: string; F: string; task: string }>;
    fit: { alpha: number; log_c: number; r2: number; n: number } | null;
    n_points: number;
  };
  universality: Record<string, {
    n_tasks: number;
    alpha_mean: number;
    alpha_std: number;
    alpha_median: number;
    alpha_min: number;
    alpha_max: number;
    alphas_sorted: number[];
  }>;
  training_curves: { curves: TrainingCurve[]; n_runs: number };
  iso_compute: {
    bins: IsoComputeBin[];
    fit_N_opt_C: { alpha: number; log_c: number; r2: number; n: number } | null;
    fit_K_opt_C: { alpha: number; log_c: number; r2: number; n: number } | null;
  };
  parametric_contour: Record<string, ParametricFitOneF>;
  predicted_vs_actual: { points: PredVsAct[] };
  N_params_B: Record<string, [number, number]>;
  F_ordinal: Record<string, number>;
}

export interface SiteState {
  generated_at_iso: string;
  git_sha: string;
  project_summary: string;
  servers: ServerStatus[];
  grids: GridStatus[];
  run_counts: RunCounts;
  xt_curves: XTCurve[];
  xt_dropped_saturated_tasks: string[];
  coverage: CoverageCell[];
  tasks_headline: HeadlineEntry[];
  trajectories?: Trajectory[];
  envelope?: EnvelopePoint[];
  // Per (model, F) envelopes — keyed "Model|F" — so a lucky-run on one
  // class doesn't drag the visible frontier of others to zero.
  envelope_by_class?: Record<string, EnvelopePoint[]>;
  phase4_pending: string[];
  events: EventEntry[];
}
