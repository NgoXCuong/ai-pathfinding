import heapq
import math
import time
from typing import Any


# ─────────────────────────────── Heuristics ───────────────────────────────
def heuristic_manhattan(a: tuple[int, int], b: tuple[int, int]) -> float:
    return abs(a[0] - b[0]) + abs(a[1] - b[1])


def heuristic_euclidean(a: tuple[int, int], b: tuple[int, int]) -> float:
    return math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)


HEURISTICS = {
    "manhattan": heuristic_manhattan,
    "euclidean": heuristic_euclidean,
}

# ─────────────────────────────── Grid A* ──────────────────────────────────
def astar_grid(
    grid: list[list[int]],
    start: tuple[int, int],
    goal: tuple[int, int],
    heuristic: str = "manhattan",
    record_visited: bool = True,
    allow_diagonal: bool = False,
) -> dict[str, Any]:
    """
    Tham số:
      grid[r][c] = 0: ô trống, 1: vật cản
      heuristic  : "manhattan" | "euclidean"
      allow_diagonal: True → 8 hướng, False → 4 hướng

    Khuyến nghị heuristic:
      - 4 hướng (allow_diagonal=False) → dùng "manhattan"
      - 8 hướng (allow_diagonal=True)  → dùng "euclidean"
    """
    rows = len(grid)
    cols = len(grid[0])

    h_func = HEURISTICS.get(heuristic, heuristic_manhattan)

    if allow_diagonal:
        DIRS = [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]
    else:
        DIRS = [(-1, 0), (1, 0), (0, -1), (0, 1)]

    # g(n): chi phí thực tế từ start đến n
    g: dict[tuple, float] = {start: 0.0}
    f_start = h_func(start, goal)

    # Min-heap theo f(n) = g(n) + h(n)
    # Tuple: (f, g, row, col) — thêm g để phá tie khi f bằng nhau
    heap = [(f_start, 0.0, start[0], start[1])]
    prev: dict[tuple, tuple | None] = {start: None}

    # closed_set: Tập node đã xử lý xong (đã cố định g tối ưu)
    closed_set: set[tuple] = set()

    visited_order: list[tuple[int, int]] = []

    nodes_generated = 1
    peak_memory = 1
    search_steps = 0

    t0 = time.perf_counter()

    while heap:
        search_steps += 1
        peak_memory = max(peak_memory, len(heap) + len(closed_set))

        # Lấy node có f(n) nhỏ nhất
        f, g_cur, r, c = heapq.heappop(heap)
        current = (r, c)

        # Lazy deletion: bỏ qua nếu đã đóng (có thể có entry cũ trong heap)
        if current in closed_set:
            continue

        closed_set.add(current)  # Đưa vào closed set: g(n) đã tối ưu

        if record_visited and current != start and current != goal:
            visited_order.append(current)

        # Tìm thấy đích
        if current == goal:
            break

        # Mở rộng các node kề
        for dr, dc in DIRS:
            nr, nc = r + dr, c + dc
            neighbor = (nr, nc)

            if not (0 <= nr < rows and 0 <= nc < cols):
                continue
            if grid[nr][nc] == 1:
                continue
            if neighbor in closed_set:
                continue  # Đã cố định → bỏ qua (đảm bảo optimal với consistent heuristic)

            move_cost = 1.414 if dr != 0 and dc != 0 else 1.0
            tentative_g = g_cur + move_cost

            # Relaxation: cập nhật nếu tìm được đường tốt hơn đến neighbor
            if tentative_g < g.get(neighbor, float("inf")):
                g[neighbor] = tentative_g
                # f(neighbor) = g(neighbor) + h(neighbor)
                f_n = tentative_g + h_func(neighbor, goal)
                prev[neighbor] = current
                heapq.heappush(heap, (f_n, tentative_g, nr, nc))
                nodes_generated += 1

    t1 = time.perf_counter()
    execution_time = (t1 - t0) * 1000

    path = _reconstruct_path(prev, start, goal)
    distance = g.get(goal, float("inf"))
    is_found = distance != float("inf")

    return {
        "path": path,
        "visited_order": visited_order,
        "execution_time": round(execution_time, 4),
        "nodes_visited": len(closed_set),
        "nodes_expanded": len(closed_set),
        "nodes_generated": nodes_generated,
        "peak_memory": peak_memory,
        "search_steps": search_steps,
        "path_length": len(path) if is_found else 0,
        "path_cost": round(distance, 4) if is_found else -1,
        "h_start": round(f_start, 2),
        "distance": distance if is_found else -1,
        "found": is_found,
    }


# ─────────────────────────────── Graph A* ─────────────────────────────────
def astar_graph( graph: dict, node_positions: dict,  # {node_id: (lat, lon)}
    start: Any, goal: Any, heuristic: str = "euclidean", ) -> dict[str, Any]:
    def h(a: Any, b: Any) -> float:
        pa, pb = node_positions[a], node_positions[b]
        return math.sqrt((pa[0] - pb[0]) ** 2 + (pa[1] - pb[1]) ** 2) * 111_000

    g: dict[Any, float] = {start: 0.0}
    prev: dict[Any, Any | None] = {start: None}

    h_start = h(start, goal)
    heap = [(h_start, 0.0, start)]
    closed_set: set = set()
    visited_order: list[Any] = []

    nodes_generated = 1
    peak_memory = 1
    search_steps = 0

    t0 = time.perf_counter()

    while heap:
        search_steps += 1
        peak_memory = max(peak_memory, len(heap) + len(closed_set))

        f, g_cur, node = heapq.heappop(heap)
        if node in closed_set:
            continue
        closed_set.add(node)
        if node != start and node != goal:
            visited_order.append(node)
        if node == goal:
            break
        for neighbor, weight in graph.get(node, []):
            if neighbor in closed_set:
                continue
            tentative_g = g_cur + weight
            if tentative_g < g.get(neighbor, float("inf")):
                g[neighbor] = tentative_g
                f_n = tentative_g + h(neighbor, goal)
                prev[neighbor] = node
                heapq.heappush(heap, (f_n, tentative_g, neighbor))
                nodes_generated += 1
    t1 = time.perf_counter()
    execution_time = (t1 - t0) * 1000

    path = _reconstruct_path_graph(prev, start, goal)
    distance = g.get(goal, float("inf"))

    return {
        "path": path,
        "visited_order": visited_order,
        "execution_time": round(execution_time, 4),
        "nodes_visited": len(closed_set),
        "nodes_generated": nodes_generated,
        "peak_memory": peak_memory,
        "search_steps": search_steps,
        "h_start": round(h_start, 2),
        "distance": round(distance, 2) if distance != float("inf") else -1,
        "found": distance != float("inf"),
    }
# ─────────────────────────────── Helpers ──────────────────────────────────

def _reconstruct_path(prev: dict, start: tuple, goal: tuple) -> list[tuple[int, int]]:
    """
    Tái tạo đường đi từ dict prev (truy ngược từ goal về start).
    Trả về danh sách node theo thứ tự start → goal.
    Trả về [] nếu không có đường (goal chưa được tìm thấy).
    """
    if goal not in prev:
        return []
    path = []
    node = goal
    while node is not None:
        path.append(node)
        node = prev.get(node)
    path.reverse()
    if not path or path[0] != start:
        return []
    return path


def _reconstruct_path_graph(prev: dict, start: Any, goal: Any) -> list:
    """Tái tạo đường đi trên đồ thị OSM (node_id thay vì tuple)."""
    if goal not in prev:
        return []
    path = []
    node = goal
    while node is not None:
        path.append(node)
        node = prev.get(node)
    path.reverse()
    return path
