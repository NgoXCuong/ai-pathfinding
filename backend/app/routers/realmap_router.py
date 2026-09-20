from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.osm_graph import (
    load_osm_graph,
    get_adj_list,
    get_node_positions,
    get_graph_stats,
    find_nearest_node,
    get_path_coords,
    _haversine,
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
    heuristic: str = "euclidean"  # "euclidean" | "manhattan"


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
    """Chạy cả hai thuật toán và so sánh với đầy đủ thông số kỹ thuật AI & GIS."""
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

    # Tính khoảng cách chim bay Haversine (straight-line distance in meters)
    h_start = round(_haversine(req.start_lat, req.start_lon, req.end_lat, req.end_lon), 2)
    stats = get_graph_stats()
    total_nodes = stats.get("total_nodes", 0)

    def improvement(a: float, b: float) -> float:
        if a == 0:
            return 0.0
        return round((a - b) / a * 100, 2)

    # Chỉ số chuyên sâu cho Dijkstra
    dijk_dist = float(dijk["distance"]) if dijk["found"] else None
    dijk_time = float(dijk["execution_time"])
    dijk_nodes = int(dijk["nodes_visited"])
    dijk_gen = int(dijk.get("nodes_generated", dijk_nodes))
    dijk_mem = int(dijk.get("peak_memory", 0))
    dijk_steps = len(dijk["path"])
    dijk_coverage = round((dijk_nodes / total_nodes) * 100, 3) if total_nodes > 0 else 0.0
    dijk_penetrance = round((dijk_steps / max(1, dijk_nodes)) * 100, 2)
    dijk_detour = round(dijk_dist / h_start, 2) if dijk_dist and h_start > 0 else 1.0
    dijk_throughput = round(dijk_nodes / (dijk_time / 1000), 1) if dijk_time > 0 else 0.0

    # Chỉ số chuyên sâu cho A*
    astar_dist = float(astar_r["distance"]) if astar_r["found"] else None
    astar_time = float(astar_r["execution_time"])
    astar_nodes = int(astar_r["nodes_visited"])
    astar_gen = int(astar_r.get("nodes_generated", astar_nodes))
    astar_mem = int(astar_r.get("peak_memory", 0))
    astar_steps = len(astar_r["path"])
    astar_coverage = round((astar_nodes / total_nodes) * 100, 3) if total_nodes > 0 else 0.0
    astar_penetrance = round((astar_steps / max(1, astar_nodes)) * 100, 2)
    astar_detour = round(astar_dist / h_start, 2) if astar_dist and h_start > 0 else 1.0
    astar_throughput = round(astar_nodes / (astar_time / 1000), 1) if astar_time > 0 else 0.0

    return {
        "dijkstra": {
            "path_coords": dijk_coords,
            "visited_coords": dijk_visited_coords,
            "execution_time": dijk_time,
            "nodes_visited": dijk_nodes,
            "nodes_generated": dijk_gen,
            "peak_memory": dijk_mem,
            "search_steps": int(dijk.get("search_steps", dijk_nodes)),
            "distance": dijk_dist,
            "steps": dijk_steps,
            "found": bool(dijk["found"]),
            "map_coverage_pct": dijk_coverage,
            "search_penetrance_pct": dijk_penetrance,
            "detour_index": dijk_detour,
            "throughput_nodes_sec": dijk_throughput,
        },
        "astar": {
            "path_coords": astar_coords,
            "visited_coords": astar_visited_coords,
            "execution_time": astar_time,
            "nodes_visited": astar_nodes,
            "nodes_generated": astar_gen,
            "peak_memory": astar_mem,
            "search_steps": int(astar_r.get("search_steps", astar_nodes)),
            "distance": astar_dist,
            "steps": astar_steps,
            "found": bool(astar_r["found"]),
            "map_coverage_pct": astar_coverage,
            "search_penetrance_pct": astar_penetrance,
            "detour_index": astar_detour,
            "throughput_nodes_sec": astar_throughput,
        },
        "comparison": {
            "time_improvement_pct": float(improvement(dijk_time, astar_time)),
            "nodes_improvement_pct": float(improvement(dijk_nodes, astar_nodes)),
            "generated_improvement_pct": float(improvement(dijk_gen, astar_gen)),
            "memory_improvement_pct": float(improvement(dijk_mem, astar_mem)),
            "same_distance": bool(abs((dijk_dist or 0) - (astar_dist or 0)) < 15),
            "h_start": float(h_start),
            "total_graph_nodes": int(total_nodes),
            "winner_time": "astar" if astar_time < dijk_time else "dijkstra",
            "winner_nodes": "astar" if astar_nodes < dijk_nodes else "dijkstra",
        },
        "heuristic": req.heuristic,
    }
