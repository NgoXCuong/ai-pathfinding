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
    heuristic: str = "manhattan"   # "manhattan" | "euclidean" | "chebyshev"
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

    return {
        "dijkstra": {
            "path": dijk["path"],
            "visited_order": dijk["visited_order"],
            "execution_time": dijk["execution_time"],
            "nodes_visited": dijk["nodes_visited"],
            "distance": dijk["distance"],
            "steps": len(dijk["path"]),
            "found": dijk["found"],
        },
        "astar": {
            "path": astar["path"],
            "visited_order": astar["visited_order"],
            "execution_time": astar["execution_time"],
            "nodes_visited": astar["nodes_visited"],
            "distance": astar["distance"],
            "steps": len(astar["path"]),
            "found": astar["found"],
        },
        "comparison": {
            "time_improvement_pct": improvement(dijk["execution_time"], astar["execution_time"]),
            "nodes_improvement_pct": improvement(dijk["nodes_visited"], astar["nodes_visited"]),
            "same_path_length": abs((dijk["distance"] or 0) - (astar["distance"] or 0)) < 1e-6,
            "winner_time": "astar" if astar["execution_time"] < dijk["execution_time"] else "dijkstra",
            "winner_nodes": "astar" if astar["nodes_visited"] < dijk["nodes_visited"] else "dijkstra",
        },
        "heuristic": req.heuristic,
    }
