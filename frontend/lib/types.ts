// ─── Grid Types ───────────────────────────────────────────────────────────────
export type CellType =
  | "empty"
  | "obstacle"
  | "start"
  | "goal"
  | "visited"
  | "current"
  | "path"
  | "open";

export interface GridCell {
  row: number;
  col: number;
  type: CellType;
}

// ─── Algorithm Results ────────────────────────────────────────────────────────
export interface AlgorithmResult {
  algorithm: "dijkstra" | "astar";
  heuristic?: string;
  path: [number, number][];
  visited_order: [number, number][];
  execution_time: number;   // ms
  nodes_visited: number;
  distance: number;         // -1 if not found
  steps: number;
  found: boolean;
}

// ─── Comparison ───────────────────────────────────────────────────────────────
export interface ComparisonResult {
  dijkstra: AlgorithmResult;
  astar: AlgorithmResult;
  comparison: {
    time_improvement_pct: number;
    nodes_improvement_pct: number;
    same_path_length: boolean;
    winner_time: "dijkstra" | "astar";
    winner_nodes: "dijkstra" | "astar";
  };
  heuristic: string;
}

// ─── Benchmark ────────────────────────────────────────────────────────────────
export interface BenchmarkRun {
  run: number;
  seed: number;
  dijkstra_time: number;
  dijkstra_nodes: number;
  dijkstra_distance: number;
  dijkstra_found: boolean;
  astar_time: number;
  astar_nodes: number;
  astar_distance: number;
  astar_found: boolean;
}

export interface StatSummary {
  avg: number;
  min: number;
  max: number;
  stdev: number;
}

export interface AlgoStats {
  time: StatSummary;
  nodes: StatSummary;
  distance: StatSummary;
}

export interface BenchmarkResult {
  batch_id: string;
  config: {
    iterations: number;
    grid_size: number;
    obstacle_density: number;
    heuristic: string;
  };
  raw_results: BenchmarkRun[];
  stats: {
    dijkstra: AlgoStats;
    astar: AlgoStats;
  };
  improvement: {
    time_pct: number;
    nodes_pct: number;
  };
}

// ─── Real Map ─────────────────────────────────────────────────────────────────
export interface RealRouteResult {
  algorithm: string;
  heuristic?: string;
  path_coords: [number, number][];
  execution_time: number;
  nodes_visited: number;
  distance: number;
  steps: number;
  found: boolean;
}

export interface RealCompareResult {
  dijkstra: RealRouteResult;
  astar: RealRouteResult;
  comparison: {
    time_improvement_pct: number;
    nodes_improvement_pct: number;
    same_distance: boolean;
  };
  heuristic: string;
}

// ─── History ─────────────────────────────────────────────────────────────────
export interface HistoryRouteResult {
  algorithm: string;
  heuristic?: string;
  distance?: number;
  execution_time?: number;
  nodes_visited?: number;
  steps?: number;
  found?: boolean;
}

export interface HistoryItem {
  id: number;
  map_type: string;
  grid_size?: number;
  start_lat?: number;
  start_lon?: number;
  end_lat?: number;
  end_lon?: number;
  created_at: string;
  results: HistoryRouteResult[];
}

// ─── UI State ─────────────────────────────────────────────────────────────────
export type DrawMode = "obstacle" | "erase" | "start" | "goal";
export type AlgorithmMode = "dijkstra" | "astar" | "compare";
export type Heuristic = "manhattan" | "euclidean" | "chebyshev" | "octile";
export type AnimationState = "idle" | "running" | "paused" | "done";
