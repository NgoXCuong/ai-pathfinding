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
    heuristic: str = "manhattan"  # manhattan | euclidean


def _compute_stats(values: list[float]) -> dict:
    if not values:
        return {"avg": 0.0, "min": 0.0, "max": 0.0, "stdev": 0.0}
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
    Mỗi lần tạo grid mới với seed khác nhau và ghi nhận đầy đủ 12 chỉ số học thuật.
    """
    iterations = max(1, min(req.iterations, 200))
    size = max(5, min(req.grid_size, 100))
    batch_id = str(uuid.uuid4())

    dijk_times, dijk_nodes, dijk_distances = [], [], []
    astar_times, astar_nodes, astar_distances = [], [], []

    dijk_generated_list, astar_generated_list = [], []
    dijk_mem_list, astar_mem_list = [], []
    dijk_steps_list, astar_steps_list = [], []
    dijk_path_len_list, astar_path_len_list = [], []
    h_start_list = []

    dijk_found_count = 0
    astar_found_count = 0
    same_cost_count = 0
    passable_cells_total = 0

    raw_results = []

    for i in range(iterations):
        seed = random.randint(0, 999_999)
        grid = generate_grid(size, req.obstacle_density, seed=seed)

        # Chọn start/goal ở 2 góc đối diện
        start = (0, 0)
        goal = (size - 1, size - 1)
        grid[start[0]][start[1]] = 0
        grid[goal[0]][goal[1]] = 0

        # Đếm số ô đi được
        passable_count = sum(row.count(0) for row in grid)
        passable_cells_total += passable_count

        dijk = dijkstra_grid(grid, start, goal)
        astar_r = astar_grid(grid, start, goal, heuristic=req.heuristic)

        dijk_times.append(dijk["execution_time"])
        dijk_nodes.append(dijk["nodes_visited"])
        dijk_generated_list.append(dijk.get("nodes_generated", dijk["nodes_visited"]))
        dijk_mem_list.append(dijk.get("peak_memory", dijk["nodes_visited"]))
        dijk_steps_list.append(dijk.get("search_steps", dijk["nodes_visited"]))

        if dijk["found"]:
            dijk_found_count += 1
            dijk_distances.append(dijk["distance"])
            dijk_path_len_list.append(dijk.get("path_length", len(dijk.get("path", []))))

        astar_times.append(astar_r["execution_time"])
        astar_nodes.append(astar_r["nodes_visited"])
        astar_generated_list.append(astar_r.get("nodes_generated", astar_r["nodes_visited"]))
        astar_mem_list.append(astar_r.get("peak_memory", astar_r["nodes_visited"]))
        astar_steps_list.append(astar_r.get("search_steps", astar_r["nodes_visited"]))
        h_start_list.append(astar_r.get("h_start", 0))

        if astar_r["found"]:
            astar_found_count += 1
            astar_distances.append(astar_r["distance"])
            astar_path_len_list.append(astar_r.get("path_length", len(astar_r.get("path", []))))

        if dijk["found"] and astar_r["found"]:
            if abs(dijk["distance"] - astar_r["distance"]) < 1e-4:
                same_cost_count += 1

        raw_results.append({
            "run": i + 1,
            "seed": seed,
            "dijkstra_time": dijk["execution_time"],
            "dijkstra_nodes": dijk["nodes_visited"],
            "dijkstra_generated": dijk.get("nodes_generated", dijk["nodes_visited"]),
            "dijkstra_peak_memory": dijk.get("peak_memory", dijk["nodes_visited"]),
            "dijkstra_steps": dijk.get("search_steps", dijk["nodes_visited"]),
            "dijkstra_distance": dijk["distance"],
            "dijkstra_path_length": dijk.get("path_length", len(dijk.get("path", []))),
            "dijkstra_found": dijk["found"],

            "astar_time": astar_r["execution_time"],
            "astar_nodes": astar_r["nodes_visited"],
            "astar_generated": astar_r.get("nodes_generated", astar_r["nodes_visited"]),
            "astar_peak_memory": astar_r.get("peak_memory", astar_r["nodes_visited"]),
            "astar_steps": astar_r.get("search_steps", astar_r["nodes_visited"]),
            "astar_distance": astar_r["distance"],
            "astar_path_length": astar_r.get("path_length", len(astar_r.get("path", []))),
            "astar_h_start": astar_r.get("h_start", 0),
            "astar_found": astar_r["found"],
        })

    def improvement(a_avg: float, b_avg: float) -> float:
        if a_avg == 0:
            return 0.0
        return round((a_avg - b_avg) / a_avg * 100, 2)

    dijk_time_stats = _compute_stats(dijk_times)
    astar_time_stats = _compute_stats(astar_times)
    dijk_nodes_stats = _compute_stats(dijk_nodes)
    astar_nodes_stats = _compute_stats(astar_nodes)

    dijk_time_avg = dijk_time_stats.get("avg", 0.0)
    astar_time_avg = astar_time_stats.get("avg", 0.0)

    # Hệ số tăng tốc (Speedup factor)
    speedup = round(dijk_time_avg / astar_time_avg, 2) if astar_time_avg > 0 else 1.0

    # Thông số đồ thị
    avg_passable = passable_cells_total / iterations
    total_nodes = size * size
    est_edges = int(avg_passable * 3.8)  # Xấp xỉ số cạnh 4 hướng trên ô đi được

    return {
        "batch_id": batch_id,
        "config": {
            "iterations": iterations,
            "grid_size": size,
            "obstacle_density": req.obstacle_density,
            "heuristic": req.heuristic,
        },
        "graph_scale": {
            "total_nodes": total_nodes,
            "passable_nodes": int(avg_passable),
            "estimated_edges": est_edges,
            "h_start": round(statistics.mean(h_start_list), 1) if h_start_list else 0,
        },
        "raw_results": raw_results,
        "stats": {
            "dijkstra": {
                "time": dijk_time_stats,
                "nodes": dijk_nodes_stats,
                "generated": _compute_stats(dijk_generated_list),
                "peak_memory": _compute_stats(dijk_mem_list),
                "steps": _compute_stats(dijk_steps_list),
                "distance": _compute_stats(dijk_distances),
                "path_length": _compute_stats(dijk_path_len_list),
                "success_rate": round(dijk_found_count / iterations * 100, 1),
            },
            "astar": {
                "time": astar_time_stats,
                "nodes": astar_nodes_stats,
                "generated": _compute_stats(astar_generated_list),
                "peak_memory": _compute_stats(astar_mem_list),
                "steps": _compute_stats(astar_steps_list),
                "distance": _compute_stats(astar_distances),
                "path_length": _compute_stats(astar_path_len_list),
                "success_rate": round(astar_found_count / iterations * 100, 1),
            },
        },
        "improvement": {
            "speedup_factor": speedup,
            "time_pct": improvement(dijk_time_avg, astar_time_avg),
            "nodes_pct": improvement(dijk_nodes_stats.get("avg", 0), astar_nodes_stats.get("avg", 0)),
            "generated_pct": improvement(_compute_stats(dijk_generated_list).get("avg", 0), _compute_stats(astar_generated_list).get("avg", 0)),
            "memory_pct": improvement(_compute_stats(dijk_mem_list).get("avg", 0), _compute_stats(astar_mem_list).get("avg", 0)),
            "steps_pct": improvement(_compute_stats(dijk_steps_list).get("avg", 0), _compute_stats(astar_steps_list).get("avg", 0)),
            "optimal_path_rate": round(same_cost_count / iterations * 100, 1) if iterations > 0 else 100.0,
        },
    }
