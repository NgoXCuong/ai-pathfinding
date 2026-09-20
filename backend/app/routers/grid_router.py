import uuid
import statistics
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.algorithms.dijkstra import dijkstra_grid
from app.algorithms.astar import astar_grid
from app.algorithms.grid import (
    generate_grid,
    ensure_passable,
    grid_to_obstacles,
    obstacles_to_grid,
    validate_grid_input,
)

router = APIRouter(prefix="/api/grid", tags=["Grid"])


# ─────────────────────────── Schemas ───────────────────────────────────────

class GenerateRequest(BaseModel):
    size: int = 20
    obstacle_density: float = 0.3
    seed: int | None = None


class RunRequest(BaseModel):
    size: int
    obstacles: list[list[int]]
    start: list[int]
    goal: list[int]
    algorithm: str = "dijkstra"    # "dijkstra" | "astar"
    heuristic: str = "manhattan"   # "manhattan" | "euclidean"
    allow_diagonal: bool = False


class CompareRequest(BaseModel):
    size: int
    obstacles: list[list[int]]
    start: list[int]
    goal: list[int]
    heuristic: str = "manhattan"
    allow_diagonal: bool = False


# ─────────────────────────── Endpoints ─────────────────────────────────────

@router.post("/generate")
def generate(req: GenerateRequest):
    """Tạo grid ngẫu nhiên."""
    size = max(5, min(req.size, 200))
    grid = generate_grid(size, req.obstacle_density, req.seed)
    obstacles = grid_to_obstacles(grid)
    return {
        "size": size,
        "obstacles": obstacles,
        "obstacle_count": len(obstacles),
    }


@router.post("/run")
def run_algorithm(req: RunRequest):
    """Chạy một thuật toán và trả về kết quả + animation frames."""
    err = validate_grid_input(req.size, req.start, req.goal)
    if err:
        raise HTTPException(status_code=400, detail=err)

    grid = obstacles_to_grid(req.size, req.obstacles)
    start = tuple(req.start)
    goal = tuple(req.goal)

    if req.algorithm == "dijkstra":
        result = dijkstra_grid(grid, start, goal, allow_diagonal=req.allow_diagonal)
    elif req.algorithm == "astar":
        result = astar_grid(grid, start, goal, heuristic=req.heuristic, allow_diagonal=req.allow_diagonal)
    else:
        raise HTTPException(status_code=400, detail="algorithm phải là 'dijkstra' hoặc 'astar'")

    return {
        "algorithm": req.algorithm,
        "heuristic": req.heuristic if req.algorithm == "astar" else None,
        "path": result["path"],
        "visited_order": result["visited_order"],
        "execution_time": result["execution_time"],
        "nodes_visited": result["nodes_visited"],
        "distance": result["distance"],
        "steps": len(result["path"]),
        "found": result["found"],
    }


def _count_turns(path: list) -> int:
    if len(path) < 3:
        return 0
    turns = 0
    for i in range(2, len(path)):
        dr1 = path[i-1][0] - path[i-2][0]
        dc1 = path[i-1][1] - path[i-2][1]
        dr2 = path[i][0] - path[i-1][0]
        dc2 = path[i][1] - path[i-1][1]
        if dr1 != dr2 or dc1 != dc2:
            turns += 1
    return turns


@router.post("/compare")
def compare(req: CompareRequest):
    """Chạy cả hai thuật toán và so sánh kết quả."""
    err = validate_grid_input(req.size, req.start, req.goal)
    if err:
        raise HTTPException(status_code=400, detail=err)

    grid = obstacles_to_grid(req.size, req.obstacles)
    start = tuple(req.start)
    goal = tuple(req.goal)

    dijk = dijkstra_grid(grid, start, goal, allow_diagonal=req.allow_diagonal)
    astar = astar_grid(grid, start, goal, heuristic=req.heuristic, allow_diagonal=req.allow_diagonal)

    # Tính improvement
    def improvement(a: float, b: float) -> float:
        if a == 0:
            return 0.0
        return round((a - b) / a * 100, 2)

    total_passable = max(1, req.size * req.size - len(req.obstacles))
    d_path = dijk["path"]
    a_path = astar["path"]

    d_visited = dijk["nodes_visited"]
    a_visited = astar["nodes_visited"]

    d_turns = _count_turns(d_path) if dijk["found"] else 0
    a_turns = _count_turns(a_path) if astar["found"] else 0

    d_coverage = round((d_visited / total_passable) * 100, 2)
    a_coverage = round((a_visited / total_passable) * 100, 2)

    d_penetrance = round((len(d_path) / max(1, d_visited)) * 100, 2) if dijk["found"] else 0.0
    a_penetrance = round((len(a_path) / max(1, a_visited)) * 100, 2) if astar["found"] else 0.0

    optimality_ratio = 1.0
    if dijk["found"] and astar["found"] and dijk["distance"] > 0:
        optimality_ratio = round(astar["distance"] / dijk["distance"], 4)

    return {
        "dijkstra": {
            "path": d_path,
            "visited_order": dijk["visited_order"],
            "execution_time": dijk["execution_time"],
            "nodes_visited": d_visited,
            "nodes_generated": dijk.get("nodes_generated", d_visited),
            "peak_memory": dijk.get("peak_memory", 0),
            "search_steps": dijk.get("search_steps", 0),
            "distance": dijk["distance"],
            "path_cost": dijk.get("path_cost", dijk["distance"]),
            "path_length": len(d_path),
            "turns": d_turns,
            "map_coverage_pct": d_coverage,
            "search_penetrance_pct": d_penetrance,
            "steps": len(d_path),
            "found": dijk["found"],
        },
        "astar": {
            "path": a_path,
            "visited_order": astar["visited_order"],
            "execution_time": astar["execution_time"],
            "nodes_visited": a_visited,
            "nodes_generated": astar.get("nodes_generated", a_visited),
            "peak_memory": astar.get("peak_memory", 0),
            "search_steps": astar.get("search_steps", 0),
            "distance": astar["distance"],
            "path_cost": astar.get("path_cost", astar["distance"]),
            "path_length": len(a_path),
            "turns": a_turns,
            "map_coverage_pct": a_coverage,
            "search_penetrance_pct": a_penetrance,
            "h_start": astar.get("h_start", 0),
            "steps": len(a_path),
            "found": astar["found"],
        },
        "comparison": {
            "time_improvement_pct": improvement(dijk["execution_time"], astar["execution_time"]),
            "nodes_improvement_pct": improvement(d_visited, a_visited),
            "generated_improvement_pct": improvement(dijk.get("nodes_generated", d_visited), astar.get("nodes_generated", a_visited)),
            "memory_improvement_pct": improvement(dijk.get("peak_memory", 0), astar.get("peak_memory", 0)),
            "same_path_length": abs((dijk["distance"] or 0) - (astar["distance"] or 0)) < 1e-6,
            "optimality_ratio": optimality_ratio,
            "winner_time": "astar" if astar["execution_time"] < dijk["execution_time"] else "dijkstra",
            "winner_nodes": "astar" if astar["nodes_visited"] < dijk["nodes_visited"] else "dijkstra",
            "total_passable": total_passable,
        },
        "heuristic": req.heuristic,
    }
