export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ─── Health ──────────────────────────────────────────────────────────────────
export async function checkBackend() {
  const res = await fetch(`${API_BASE}/api/health`);
  return res.json();
}

// ─── Grid ────────────────────────────────────────────────────────────────────
export async function generateGrid(
  size: number,
  obstacleDensity: number,
  seed?: number,
) {
  const res = await fetch(`${API_BASE}/api/grid/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ size, obstacle_density: obstacleDensity, seed }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function runAlgorithm(params: {
  size: number;
  obstacles: number[][];
  start: number[];
  goal: number[];
  algorithm: "dijkstra" | "astar";
  heuristic?: string;
  allowDiagonal?: boolean;
}) {
  const res = await fetch(`${API_BASE}/api/grid/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      size: params.size,
      obstacles: params.obstacles,
      start: params.start,
      goal: params.goal,
      algorithm: params.algorithm,
      heuristic: params.heuristic || "manhattan",
      allow_diagonal: params.allowDiagonal || false,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function compareAlgorithms(params: {
  size: number;
  obstacles: number[][];
  start: number[];
  goal: number[];
  heuristic?: string;
  allowDiagonal?: boolean;
}) {
  const res = await fetch(`${API_BASE}/api/grid/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      size: params.size,
      obstacles: params.obstacles,
      start: params.start,
      goal: params.goal,
      heuristic: params.heuristic || "manhattan",
      allow_diagonal: params.allowDiagonal || false,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ─── Benchmark ───────────────────────────────────────────────────────────────
export async function runBenchmark(params: {
  iterations: number;
  gridSize: number;
  obstacleDensity: number;
  heuristic: string;
}) {
  const res = await fetch(`${API_BASE}/api/benchmark/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      iterations: params.iterations,
      grid_size: params.gridSize,
      obstacle_density: params.obstacleDensity,
      heuristic: params.heuristic,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ─── Real Map ─────────────────────────────────────────────────────────────────
export async function loadOSMGraph(city: string) {
  const res = await fetch(
    `${API_BASE}/api/realmap/load?city=${encodeURIComponent(city)}`,
    {
      method: "POST",
    },
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getGraphStats() {
  const res = await fetch(`${API_BASE}/api/realmap/graph-stats`);
  return res.json();
}

export async function findRealRoute(params: {
  city: string;
  startLat: number;
  startLon: number;
  endLat: number;
  endLon: number;
  algorithm: "dijkstra" | "astar";
  heuristic?: string;
}) {
  const res = await fetch(`${API_BASE}/api/realmap/route`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      city: params.city,
      start_lat: params.startLat,
      start_lon: params.startLon,
      end_lat: params.endLat,
      end_lon: params.endLon,
      algorithm: params.algorithm,
      heuristic: params.heuristic || "euclidean",
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function compareRealRoutes(params: {
  city: string;
  startLat: number;
  startLon: number;
  endLat: number;
  endLon: number;
  heuristic?: string;
}) {
  const res = await fetch(`${API_BASE}/api/realmap/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      city: params.city,
      start_lat: params.startLat,
      start_lon: params.startLon,
      end_lat: params.endLat,
      end_lon: params.endLon,
      heuristic: params.heuristic || "euclidean",
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ─── History ─────────────────────────────────────────────────────────────────
export async function getHistory(limit = 20, offset = 0) {
  const res = await fetch(
    `${API_BASE}/api/history/?limit=${limit}&offset=${offset}`,
  );
  return res.json();
}

export async function saveHistory(data: {
  mapType: string;
  gridSize?: number;
  startLat?: number;
  startLon?: number;
  endLat?: number;
  endLon?: number;
  results: object[];
}) {
  const res = await fetch(`${API_BASE}/api/history/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      map_type: data.mapType,
      grid_size: data.gridSize,
      start_lat: data.startLat,
      start_lon: data.startLon,
      end_lat: data.endLat,
      end_lon: data.endLon,
      results: data.results,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteHistory(id: number) {
  const res = await fetch(`${API_BASE}/api/history/${id}`, {
    method: "DELETE",
  });
  return res.json();
}
