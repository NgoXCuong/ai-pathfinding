import uuid
import statistics
import random
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.algorithms.dijkstra import dijkstra_grid
from app.algorithms.astar import astar_grid
from app.algorithms.grid import generate_grid, obstacles_to_grid

router = APIRouter(prefix="/api/benchmark", tags=["Benchmark"])


class BenchmarkRequest(BaseModel):
    iterations: int = 10          # 10 | 50 | 100
    grid_size: int = 20           # 20 | 50 | 100
    obstacle_density: float = 0.3 # 0.1 | 0.3 | 0.5
    heuristic: str = "manhattan"  # manhattan | euclidean | chebyshev


def _compute_stats(values: list[float]) -> dict:
    if not values:
        return {}
    return {
        "avg": round(statistics.mean(values), 4),
        "min": round(min(values), 4),
        "max": round(max(values), 4),
        "stdev": round(statistics.stdev(values), 4) if len(values) > 1 else 0.0,
    }


@router.post("/run")
def run_benchmark(req: BenchmarkRequest):
    """
    Chạy benchmark nhiều lần với grid ngẫu nhiên.
    Mỗi lần tạo grid mới với seed khác nhau.
    """
    iterations = max(1, min(req.iterations, 200))
    size = max(5, min(req.grid_size, 100))
    batch_id = str(uuid.uuid4())

    dijk_times, dijk_nodes, dijk_distances = [], [], []
    astar_times, astar_nodes, astar_distances = [], [], []
    raw_results = []

    for i in range(iterations):
        seed = random.randint(0, 999_999)
        grid = generate_grid(size, req.obstacle_density, seed=seed)

        # Chọn start/goal ngẫu nhiên ở 2 góc
        start = (0, 0)
        goal = (size - 1, size - 1)
        grid[start[0]][start[1]] = 0
        grid[goal[0]][goal[1]] = 0

        dijk = dijkstra_grid(grid, start, goal)
        astar_r = astar_grid(grid, start, goal, heuristic=req.heuristic)

        dijk_times.append(dijk["execution_time"])
        dijk_nodes.append(dijk["nodes_visited"])
        if dijk["found"]:
            dijk_distances.append(dijk["distance"])

        astar_times.append(astar_r["execution_time"])
        astar_nodes.append(astar_r["nodes_visited"])
        if astar_r["found"]:
            astar_distances.append(astar_r["distance"])

        raw_results.append({
            "run": i + 1,
            "seed": seed,
            "dijkstra_time": dijk["execution_time"],
            "dijkstra_nodes": dijk["nodes_visited"],
            "dijkstra_distance": dijk["distance"],
            "dijkstra_found": dijk["found"],
            "astar_time": astar_r["execution_time"],
            "astar_nodes": astar_r["nodes_visited"],
            "astar_distance": astar_r["distance"],
            "astar_found": astar_r["found"],
        })

    # Tính improvement
    def improvement(a_avg: float, b_avg: float) -> float:
        if a_avg == 0:
            return 0.0
        return round((a_avg - b_avg) / a_avg * 100, 2)

    dijk_time_stats = _compute_stats(dijk_times)
    astar_time_stats = _compute_stats(astar_times)

    return {
        "batch_id": batch_id,
        "config": {
            "iterations": iterations,
            "grid_size": size,
            "obstacle_density": req.obstacle_density,
            "heuristic": req.heuristic,
        },
        "raw_results": raw_results,
        "stats": {
            "dijkstra": {
                "time": dijk_time_stats,
                "nodes": _compute_stats(dijk_nodes),
                "distance": _compute_stats(dijk_distances),
            },
            "astar": {
                "time": astar_time_stats,
                "nodes": _compute_stats(astar_nodes),
                "distance": _compute_stats(astar_distances),
            },
        },
        "improvement": {
            "time_pct": improvement(
                dijk_time_stats.get("avg", 0),
                astar_time_stats.get("avg", 0),
            ),
            "nodes_pct": improvement(
                _compute_stats(dijk_nodes).get("avg", 0),
                _compute_stats(astar_nodes).get("avg", 0),
            ),
        },
    }
