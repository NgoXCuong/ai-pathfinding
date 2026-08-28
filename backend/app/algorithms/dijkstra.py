"""
Thuật toán Dijkstra — Tìm đường đi ngắn nhất trong đồ thị có trọng số dương.

=== LÝ THUYẾT ===
Dijkstra (1959) giải quyết bài toán Single-Source Shortest Path (SSSP).

Nguyên lý:
  - Duy trì tập S (đã cố định khoảng cách nhỏ nhất) và hàng đợi ưu tiên (min-heap).
  - Mỗi bước: chọn node u chưa thuộc S có dist[u] nhỏ nhất → đưa vào S.
  - Cập nhật (relax) cạnh: nếu dist[u] + w(u,v) < dist[v] thì cập nhật dist[v].
  - Lặp cho đến khi tất cả node được xử lý hoặc tìm thấy đích.

Hàm đánh giá:
  f(n) = g(n)
  Trong đó g(n) = chi phí thực tế từ Start → n.
  Dijkstra KHÔNG dùng heuristic → phải duyệt đồng đều mọi hướng.

Độ phức tạp:
  - Thời gian: O((V + E) log V)  [dùng Binary Heap]
  - Không gian: O(V)
  Trong đó V = số đỉnh, E = số cạnh.

Tính chất:
  - ✅ Complete (luôn tìm được đường nếu tồn tại)
  - ✅ Optimal (tìm đường ngắn nhất, miễn trọng số ≥ 0)
  - ❌ Không có thông tin hướng đến đích → duyệt nhiều node hơn A*

So sánh với A*:
  Dijkstra = A* với h(n) ≡ 0 (heuristic bằng 0 với mọi node).
  Dijkstra phù hợp khi không biết vị trí đích hoặc không gian không có cấu trúc hình học rõ ràng.
"""

import heapq
import time
from typing import Any


def dijkstra_grid(
    grid: list[list[int]],
    start: tuple[int, int],
    goal: tuple[int, int],
    record_visited: bool = True,
    allow_diagonal: bool = False,
) -> dict[str, Any]:
    """
    Dijkstra trên Grid Map (lưới 2D).

    Tham số:
      grid[r][c] = 0: ô trống, 1: vật cản
      allow_diagonal: True → cho phép di chuyển 8 hướng (chi phí chéo = √2 ≈ 1.414)
                      False → chỉ 4 hướng (chi phí = 1.0)

    Trả về:
      path           : Danh sách (row, col) từ start → goal
      visited_order  : Thứ tự các node được duyệt (dùng cho animation)
      execution_time : Thời gian chạy (ms)
      nodes_visited  : Tổng số node đã xử lý
      distance       : Tổng chi phí đường đi (-1 nếu không tìm được)
      found          : True nếu tìm được đường
    """
    rows = len(grid)
    cols = len(grid[0])

    # 4 hướng (Manhattan) hoặc 8 hướng (Chebyshev)
    if allow_diagonal:
        DIRS = [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]
    else:
        DIRS = [(-1, 0), (1, 0), (0, -1), (0, 1)]

    # Khởi tạo khoảng cách: tất cả = ∞, trừ start = 0
    dist = [[float("inf")] * cols for _ in range(rows)]
    dist[start[0]][start[1]] = 0

    # prev[node] = node cha (dùng để tái tạo đường đi)
    prev: dict[tuple, tuple | None] = {start: None}

    # Min-heap: (distance, row, col)
    # Ưu tiên node có khoảng cách nhỏ nhất → đảm bảo tìm đường tối ưu
    heap = [(0, start[0], start[1])]

    visited_order: list[tuple[int, int]] = []
    visited_set: set[tuple[int, int]] = set()

    t0 = time.perf_counter()

    while heap:
        # Bước 1: Lấy node có dist nhỏ nhất khỏi heap
        d, r, c = heapq.heappop(heap)

        # Bỏ qua nếu đã xử lý (lazy deletion — tránh xử lý entry cũ trong heap)
        if (r, c) in visited_set:
            continue
        visited_set.add((r, c))

        if record_visited and (r, c) != start and (r, c) != goal:
            visited_order.append((r, c))

        # Bước 2: Kiểm tra đích
        if (r, c) == goal:
            break

        # Bước 3: Relaxation — cập nhật khoảng cách các node kề
        for dr, dc in DIRS:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 0:
                # Chi phí di chuyển chéo = √2 ≈ 1.414 (Pythagoras), thẳng = 1
                move_cost = 1.414 if dr != 0 and dc != 0 else 1.0
                new_dist = d + move_cost
                # Chỉ cập nhật nếu tìm được đường ngắn hơn (relaxation)
                if new_dist < dist[nr][nc]:
                    dist[nr][nc] = new_dist
                    prev[(nr, nc)] = (r, c)
                    heapq.heappush(heap, (new_dist, nr, nc))

    t1 = time.perf_counter()
    execution_time = (t1 - t0) * 1000  # ms

    # Tái tạo đường đi từ goal về start qua dict prev
    path = _reconstruct_path(prev, start, goal)
    distance = dist[goal[0]][goal[1]]

    return {
        "path": path,
        "visited_order": visited_order,
        "execution_time": round(execution_time, 4),
        "nodes_visited": len(visited_set),
        "distance": distance if distance != float("inf") else -1,
        "found": distance != float("inf"),
    }


def dijkstra_graph(
    graph: dict,
    start: Any,
    goal: Any,
) -> dict[str, Any]:
    """
    Dijkstra trên Đồ thị thực tế (OSM — OpenStreetMap).

    Tham số:
      graph    : { node_id: [(neighbor_id, weight_meters), ...] }
                 Trọng số là khoảng cách thực (mét) giữa 2 node GPS.

    Ghi chú:
      Đây là đồ thị có hướng (directed graph) từ dữ liệu OSM đường đi xe.
      Dijkstra vẫn đảm bảo tìm đường ngắn nhất vì trọng số ≥ 0.
    """
    dist: dict[Any, float] = {start: 0.0}
    prev: dict[Any, Any | None] = {start: None}

    # Heap: (distance_meters, node_id)
    heap = [(0.0, start)]
    visited_set: set = set()
    visited_order: list[Any] = []

    t0 = time.perf_counter()

    while heap:
        d, node = heapq.heappop(heap)

        if node in visited_set:
            continue
        visited_set.add(node)

        if node != start and node != goal:
            visited_order.append(node)

        if node == goal:
            break

        # Relaxation: duyệt các cạnh kề
        for neighbor, weight in graph.get(node, []):
            new_dist = d + weight
            if new_dist < dist.get(neighbor, float("inf")):
                dist[neighbor] = new_dist
                prev[neighbor] = node
                heapq.heappush(heap, (new_dist, neighbor))

    t1 = time.perf_counter()
    execution_time = (t1 - t0) * 1000

    path = _reconstruct_path_graph(prev, start, goal)
    distance = dist.get(goal, float("inf"))

    return {
        "path": path,
        "visited_order": visited_order,
        "execution_time": round(execution_time, 4),
        "nodes_visited": len(visited_set),
        "distance": round(distance, 2) if distance != float("inf") else -1,
        "found": distance != float("inf"),
    }


def _reconstruct_path(
    prev: dict,
    start: tuple,
    goal: tuple,
) -> list[tuple[int, int]]:
    """
    Tái tạo đường đi từ dict prev (truy ngược từ goal về start).
    Trả về danh sách node theo thứ tự start → goal.
    Trả về [] nếu không có đường.
    """
    if goal not in prev:
        return []
    path = []
    node = goal
    while node is not None:
        path.append(node)
        node = prev.get(node)
    path.reverse()
    if path[0] != start:
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
