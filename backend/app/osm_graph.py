"""
OSM Graph Manager — tải và cache đồ thị OpenStreetMap.
Dùng singleton pattern để chỉ load 1 lần khi server khởi động.
"""
import math
import logging
from typing import Any

logger = logging.getLogger(__name__)

_graph_cache: dict | None = None
_node_positions: dict | None = None
_adj_list: dict | None = None
_city_name: str = "Hoan Kiem, Hanoi, Vietnam"
_graph_stats: dict = {}


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Tính khoảng cách giữa 2 tọa độ GPS (meters)."""
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


import os
import re
import pickle

SUPPORTED_REGIONS = {
    "hanoi": "Hanoi, Vietnam",
    "hochiminh": "Ho Chi Minh City, Vietnam",
    "danang": "Da Nang, Vietnam",
}

async def load_osm_graph(region_id: str) -> bool:
    """
    Tải đồ thị OSM cho khu vực (Region ID). Chỉ tải 1 lần.
    Quy trình: Kiểm tra RAM -> Kiểm tra Disk (.pkl) -> Kiểm tra Disk (.graphml) -> Tải từ Internet.
    Trả về True nếu thành công.
    """
    global _graph_cache, _node_positions, _adj_list, _city_name, _graph_stats

    if _adj_list is not None and _city_name == region_id:
        logger.info(f"Đồ thị {region_id} đã có sẵn trên RAM.")
        return True

    if region_id not in SUPPORTED_REGIONS:
        logger.error(f"Khu vực không được hỗ trợ: {region_id}")
        return False
        
    city_query = SUPPORTED_REGIONS[region_id]

    try:
        import osmnx as ox
        ox.settings.log_console = False
        
        # Đảm bảo thư mục lưu trữ tồn tại
        data_dir = os.path.join(os.path.dirname(__file__), "..", "data", "osm")
        cache_dir = os.path.join(os.path.dirname(__file__), "..", "data", "cache")
        os.makedirs(data_dir, exist_ok=True)
        os.makedirs(cache_dir, exist_ok=True)
        
        filepath = os.path.join(data_dir, f"{region_id}.graphml")
        cache_path = os.path.join(cache_dir, f"{region_id}.pkl")

        # 1. Kiểm tra cache nhị phân (.pkl)
        if os.path.exists(cache_path):
            logger.info(f"Đang nạp cache nhị phân cho {region_id} từ {cache_path}...")
            with open(cache_path, "rb") as f:
                cache_data = pickle.load(f)
            
            _node_positions = cache_data["positions"]
            _adj_list = cache_data["adj_list"]
            _graph_stats = cache_data["stats"]
            _city_name = region_id
            logger.info(
                f"Đã nạp cache thành công: {_graph_stats['total_nodes']} nodes, "
                f"{_graph_stats['total_edges']} edges"
            )
            return True

        # 2. Nếu không có cache, kiểm tra file chuẩn (.graphml) hoặc tải từ Internet
        G = None
        if os.path.exists(filepath):
            logger.info(f"Đang nạp đồ thị {region_id} từ ổ đĩa ({filepath})...")
            G = ox.load_graphml(filepath)
        else:
            logger.info(f"Đang tải đồ thị OSM cho {city_query} từ Internet...")
            G = ox.graph_from_place(city_query, network_type="drive", simplify=True)
            logger.info(f"Đang lưu đồ thị xuống ổ đĩa ({filepath})...")
            ox.save_graphml(G, filepath)

        _graph_cache = G
        _city_name = region_id

        # Tạo node_positions: {node_id: (lat, lon)}
        _node_positions = {
            node: (data["y"], data["x"])
            for node, data in G.nodes(data=True)
        }

        # Tạo adjacency list: {node_id: [(neighbor_id, weight_meters), ...]}
        _adj_list = {}
        for u, v, data in G.edges(data=True):
            # OSNx cache đôi khi có thể trả về string "1.0", convert sang float
            length = float(data.get("length", 1.0))
            _adj_list.setdefault(u, []).append((v, length))
            # OSM drive graph là có hướng, không thêm chiều ngược

        _graph_stats = {
            "total_nodes": G.number_of_nodes(),
            "total_edges": G.number_of_edges(),
            "city": region_id,
        }
        
        # 3. LƯU CACHE NHỊ PHÂN CHO LẦN SAU
        cache_data = {
            "positions": _node_positions,
            "adj_list": _adj_list,
            "stats": _graph_stats
        }
        logger.info(f"Đang lưu cache nhị phân xuống {cache_path}...")
        with open(cache_path, "wb") as f:
            pickle.dump(cache_data, f)

        logger.info(
            f"Đã tải OSM graph: {_graph_stats['total_nodes']} nodes, "
            f"{_graph_stats['total_edges']} edges"
        )
        return True

    except Exception as e:
        logger.error(f"Lỗi khi tải OSM graph: {e}")
        return False


def get_adj_list() -> dict | None:
    return _adj_list


def get_node_positions() -> dict | None:
    return _node_positions


def get_graph_stats() -> dict:
    return _graph_stats


def find_nearest_node(lat: float, lon: float) -> Any | None:
    """Tìm node gần nhất với tọa độ GPS cho trước."""
    if _node_positions is None:
        return None

    best_node = None
    best_dist = float("inf")

    for node_id, (node_lat, node_lon) in _node_positions.items():
        d = _haversine(lat, lon, node_lat, node_lon)
        if d < best_dist:
            best_dist = d
            best_node = node_id

    return best_node


def get_path_coords(path: list) -> list[list[float]]:
    """Chuyển path (list node_id) → list [[lat, lon], ...]"""
    if _node_positions is None:
        return []
    coords = []
    for node_id in path:
        if node_id in _node_positions:
            lat, lon = _node_positions[node_id]
            coords.append([lat, lon])
    return coords
