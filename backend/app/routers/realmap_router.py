from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.osm_graph import (
    load_osm_graph,
    get_adj_list,
    get_node_positions,
    get_graph_stats,
    find_nearest_node,
    get_path_coords,
)
from app.algorithms.dijkstra import dijkstra_graph
from app.algorithms.astar import astar_graph

router = APIRouter(prefix="/api/realmap", tags=["Real Map"])


class RouteRequest(BaseModel):
    city: str
    start_lat: float
    start_lon: float
    end_lat: float
    end_lon: float
    algorithm: str = "dijkstra"   # "dijkstra" | "astar"
    heuristic: str = "euclidean"  # "euclidean" | "manhattan" | "chebyshev" | "octile"


class CompareRequest(BaseModel):
    city: str
    start_lat: float
    start_lon: float
    end_lat: float
    end_lon: float
    heuristic: str = "euclidean"


def _check_graph_loaded():
    if get_adj_list() is None:
        raise HTTPException(
            status_code=503,
            detail="OSM graph chưa được tải. Gọi POST /api/realmap/load trước.",
        )


@router.post("/load")
def load_graph(city: str):
    """Tải OSM graph (chỉ cần gọi 1 lần). Có thể mất 1-2 phút.

    Endpoint sync: FastAPI chạy trong threadpool nên không chặn event loop.
    """
    success = load_osm_graph(city)
    if not success:
        raise HTTPException(status_code=500, detail="Không thể tải OSM graph")
    return {"message": "Đã tải thành công", **get_graph_stats()}


@router.get("/graph-stats")
def graph_stats():
    """Trả về thông tin đồ thị OSM đã tải."""
    stats = get_graph_stats()
    if not stats:
        return {"loaded": False, "message": "Graph chưa được tải"}
    return {"loaded": True, **stats}


@router.post("/route")
def route(req: RouteRequest):
    """Tìm đường đi giữa 2 tọa độ GPS."""
    # Đảm bảo đồ thị của khu vực yêu cầu được load vào RAM
    success = load_osm_graph(req.city)
    if not success:
        raise HTTPException(status_code=500, detail=f"Không thể tải đồ thị cho {req.city}")

    graph = get_adj_list()
    positions = get_node_positions()

    start_node = find_nearest_node(req.start_lat, req.start_lon)
    goal_node = find_nearest_node(req.end_lat, req.end_lon)

    if start_node is None or goal_node is None:
        raise HTTPException(status_code=400, detail="Không tìm được node gần nhất")

    if req.algorithm == "dijkstra":
        result = dijkstra_graph(graph, start_node, goal_node)
    elif req.algorithm == "astar":
        result = astar_graph(graph, positions, start_node, goal_node, req.heuristic)
    else:
        raise HTTPException(status_code=400, detail="algorithm không hợp lệ")

    path_coords = get_path_coords(result["path"])

    return {
        "algorithm": req.algorithm,
        "heuristic": req.heuristic if req.algorithm == "astar" else None,
        "path_coords": path_coords,
        "execution_time": float(result["execution_time"]),
        "nodes_visited": int(result["nodes_visited"]),
        "distance": float(result["distance"]) if result["found"] else None,
        "steps": len(result["path"]),
        "found": bool(result["found"]),
        "start_node": int(start_node) if start_node is not None else None,
        "goal_node": int(goal_node) if goal_node is not None else None,
    }


@router.post("/compare")
def compare(req: CompareRequest):
    """Chạy cả hai thuật toán và so sánh."""
    # Đảm bảo đồ thị của khu vực yêu cầu được load vào RAM
    success = load_osm_graph(req.city)
    if not success:
        raise HTTPException(status_code=500, detail=f"Không thể tải đồ thị cho {req.city}")

    graph = get_adj_list()
    positions = get_node_positions()

    start_node = find_nearest_node(req.start_lat, req.start_lon)
    goal_node = find_nearest_node(req.end_lat, req.end_lon)

    if start_node is None or goal_node is None:
        raise HTTPException(status_code=400, detail="Không tìm được node gần nhất")

    dijk = dijkstra_graph(graph, start_node, goal_node)
    astar_r = astar_graph(graph, positions, start_node, goal_node, req.heuristic)

    dijk_coords = get_path_coords(dijk["path"])
    astar_coords = get_path_coords(astar_r["path"])

    dijk_visited_coords = get_path_coords(dijk.get("visited_order", []))
    astar_visited_coords = get_path_coords(astar_r.get("visited_order", []))

    def improvement(a: float, b: float) -> float:
        if a == 0:
            return 0.0
        return round((a - b) / a * 100, 2)

    return {
        "dijkstra": {
            "path_coords": dijk_coords,
            "visited_coords": dijk_visited_coords,
            "execution_time": float(dijk["execution_time"]),
            "nodes_visited": int(dijk["nodes_visited"]),
            "distance": float(dijk["distance"]) if dijk["found"] else None,
            "steps": len(dijk["path"]),
            "found": bool(dijk["found"]),
        },
        "astar": {
            "path_coords": astar_coords,
            "visited_coords": astar_visited_coords,
            "execution_time": float(astar_r["execution_time"]),
            "nodes_visited": int(astar_r["nodes_visited"]),
            "distance": float(astar_r["distance"]) if astar_r["found"] else None,
            "steps": len(astar_r["path"]),
            "found": bool(astar_r["found"]),
        },
        "comparison": {
            "time_improvement_pct": float(improvement(dijk["execution_time"], astar_r["execution_time"])),
            "nodes_improvement_pct": float(improvement(dijk["nodes_visited"], astar_r["nodes_visited"])),
            "same_distance": bool(abs((dijk["distance"] or 0) - (astar_r["distance"] or 0)) < 10),
        },
        "heuristic": req.heuristic,
    }
