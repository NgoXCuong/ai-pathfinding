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
  nodes_generated?: number;
  peak_memory?: number;
  search_steps?: number;
  distance: number;         // -1 if not found
  path_cost?: number;
  path_length?: number;
  turns?: number;
  map_coverage_pct?: number;
  search_penetrance_pct?: number;
  h_start?: number;
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
    generated_improvement_pct?: number;
    memory_improvement_pct?: number;
    same_path_length: boolean;
    optimality_ratio?: number;
    winner_time: "dijkstra" | "astar";
    winner_nodes: "dijkstra" | "astar";
    total_passable?: number;
  };
  heuristic: string;
}

// ─── Benchmark ────────────────────────────────────────────────────────────────
export interface BenchmarkRun {
  run: number;
  seed: number;
  dijkstra_time: number;
  dijkstra_nodes: number;
  dijkstra_generated?: number;
  dijkstra_peak_memory?: number;
  dijkstra_steps?: number;
  dijkstra_distance: number;
  dijkstra_path_length?: number;
  dijkstra_found: boolean;

  astar_time: number;
  astar_nodes: number;
  astar_generated?: number;
  astar_peak_memory?: number;
  astar_steps?: number;
  astar_distance: number;
  astar_path_length?: number;
  astar_h_start?: number;
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
  generated?: StatSummary;
  peak_memory?: StatSummary;
  steps?: StatSummary;
  distance: StatSummary;
  path_length?: StatSummary;
  success_rate?: number;
}

export interface GraphScaleInfo {
  total_nodes: number;
  passable_nodes: number;
  estimated_edges: number;
  h_start: number;
}

export interface BenchmarkResult {
  batch_id: string;
  config: {
    iterations: number;
    grid_size: number;
    obstacle_density: number;
    heuristic: string;
  };
  graph_scale?: GraphScaleInfo;
  raw_results: BenchmarkRun[];
  stats: {
    dijkstra: AlgoStats;
    astar: AlgoStats;
  };
  improvement: {
    speedup_factor?: number;
    time_pct: number;
    nodes_pct: number;
    generated_pct?: number;
    memory_pct?: number;
    steps_pct?: number;
    optimal_path_rate?: number;
  };
}

// ─── Real Map ─────────────────────────────────────────────────────────────────
export interface RealRouteResult {
  algorithm: string;
  heuristic?: string;
  path_coords: [number, number][];
  visited_coords?: [number, number][];
  execution_time: number;
  nodes_visited: number;
  nodes_generated?: number;
  peak_memory?: number;
  search_steps?: number;
  distance: number;
  steps: number;
  found: boolean;
  map_coverage_pct?: number;
  search_penetrance_pct?: number;
  detour_index?: number;
  throughput_nodes_sec?: number;
}

export interface RealCompareResult {
  dijkstra: RealRouteResult;
  astar: RealRouteResult;
  comparison: {
    time_improvement_pct: number;
    nodes_improvement_pct: number;
    generated_improvement_pct?: number;
    memory_improvement_pct?: number;
    same_distance: boolean;
    h_start?: number;
    total_graph_nodes?: number;
    winner_time?: "dijkstra" | "astar";
    winner_nodes?: "dijkstra" | "astar";
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
export type Heuristic = "manhattan" | "euclidean";
export type AnimationState = "idle" | "running" | "paused" | "done";
