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
  phase4_pending: string[];
  events: EventEntry[];
}
