"""
Thuật toán A* (A-Star) — Tìm đường đi ngắn nhất có hướng dẫn (informed search).

=== LÝ THUYẾT ===
A* (Hart, Nilsson & Raphael, 1968) là thuật toán tìm kiếm có thông tin (informed search).

Nguyên lý:
  - Mở rộng Dijkstra bằng cách thêm hàm heuristic h(n) ước lượng chi phí từ n → goal.
  - Ưu tiên duyệt những node "hứa hẹn" nhất theo hướng đích.

Hàm đánh giá:
  f(n) = g(n) + h(n)
  Trong đó:
    g(n) = chi phí thực tế đã đi từ Start → n  (giống Dijkstra)
    h(n) = heuristic: ước lượng chi phí từ n → Goal  (A* bổ sung)
  
  → Node có f(n) nhỏ nhất được ưu tiên duyệt trước.
  → Nhờ h(n), A* "biết hướng" đến goal → duyệt ít node hơn Dijkstra.

Điều kiện để A* tìm được đường tối ưu (Optimal):
  → Heuristic phải là ADMISSIBLE: h(n) ≤ h*(n) với mọi n
     (h(n) không được đánh giá CAO HƠN chi phí thực tế)
  → Heuristic phải là CONSISTENT (Monotone): h(n) ≤ w(n,n') + h(n')
     (đảm bảo f không giảm dọc theo path)

=== SO SÁNH 4 HEURISTIC ===

1. Manhattan Distance: h(n) = |Δrow| + |Δcol|
   - Phù hợp nhất cho grid 4 HƯỚNG (lên/xuống/trái/phải)
   - Admissible vì không thể đi ít hơn |Δrow| + |Δcol| bước theo 4 hướng
   - KHÔNG phù hợp khi cho phép di chuyển chéo (underestimates quá nhiều)

2. Euclidean Distance: h(n) = √(Δrow² + Δcol²)
   - Phù hợp cho grid 8 HƯỚNG (kể cả chéo)
   - Admissible vì đường thẳng ≤ đường thực tế
   - Với grid 4 hướng: h(n) < Manhattan(n) → A* duyệt nhiều node hơn Manhattan

3. Chebyshev Distance: h(n) = max(|Δrow|, |Δcol|)
   - Phù hợp cho grid 8 HƯỚNG khi chi phí chéo = 1.0
   - VẪN admissible & consistent khi chi phí chéo = √2:
     mỗi bước di chuyển tốn ≥ 1.0 và cần ≥ max(|Δrow|, |Δcol|) bước
     → h(n) ≤ chi phí thực tế (không bao giờ overestimate)
   - Nhưng under-estimate nhiều hơn octile → A* duyệt nhiều node hơn

4. Octile Distance: h(n) = (√2 - 1)·min(|Δr|,|Δc|) + max(|Δr|,|Δc|)
   - Heuristic CHÍNH XÁC NHẤT (tightest) cho grid 8 hướng với chi phí chéo = √2
   - Admissible & Consistent: bằng đúng chi phí tối thiểu khi không có vật cản
   - Đây là lựa chọn tốt nhất cho di chuyển 8 hướng (thay cho Euclidean)

Lưu ý thực tế (trong code này):
  - Chi phí chéo = 1.414 (√2) → Octile là heuristic tốt nhất cho grid 8 hướng
  - Chi phí thẳng = 1.0 → Manhattan là heuristic tốt nhất cho grid 4 hướng
  - Euclidean luôn admissible & consistent nhưng lỏng hơn Octile

=== ĐỘ PHỨC TẠP ===
  - Thời gian: O((V + E) log V) — tương đương Dijkstra về worst case
  - Không gian: O(V)
  
  Trong thực tế: A* thường nhanh hơn Dijkstra đáng kể
  vì h(n) loại bỏ nhiều node không cần duyệt.

=== KHI NÀO DIJKSTRA NHANH HƠN A*? ===
  - Grid rất nhỏ: overhead tính h(n) lớn hơn lợi ích.
  - Vật cản phức tạp lừa heuristic (heuristic dẫn đi sai hướng nhiều lần).
  - Điểm đích ở trung tâm (Dijkstra đã "bao phủ" từ các hướng).
  Trong những trường hợp này, A* vẫn tìm đường tối ưu, chỉ không nhanh hơn.
"""

import heapq
import math
import time
from typing import Any


# ─────────────────────────────── Heuristics ───────────────────────────────

def heuristic_manhattan(a: tuple[int, int], b: tuple[int, int]) -> float:
    """
    Khoảng cách Manhattan: |Δrow| + |Δcol|
    Tốt nhất cho grid 4 hướng (chi phí di chuyển = 1.0).
    Admissible & Consistent cho grid 4 hướng.
    """
    return abs(a[0] - b[0]) + abs(a[1] - b[1])


def heuristic_euclidean(a: tuple[int, int], b: tuple[int, int]) -> float:
    """
    Khoảng cách Euclidean: √(Δrow² + Δcol²)
    Tốt nhất cho grid 8 hướng với chi phí chéo = √2.
    Admissible & Consistent cho mọi trường hợp (đường thẳng ≤ đường thực).
    """
    return math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)


def heuristic_chebyshev(a: tuple[int, int], b: tuple[int, int]) -> float:
    """
    Khoảng cách Chebyshev: max(|Δrow|, |Δcol|)
    Tốt nhất cho grid 8 hướng với chi phí chéo = 1.0.
    Vẫn admissible & consistent khi chi phí chéo = √2 (mỗi bước tốn ≥ 1.0),
    nhưng under-estimate hơn octile distance.
    """
    return max(abs(a[0] - b[0]), abs(a[1] - b[1]))


def heuristic_octile(a: tuple[int, int], b: tuple[int, int]) -> float:
    """
    Khoảng cách Octile: (√2 - 1)·min(|Δr|, |Δc|) + max(|Δr|, |Δc|)
    Tightest admissible & consistent cho grid 8 hướng với chi phí chéo = √2.
    Bằng đúng chi phí tối thiểu thực tế khi không có vật cản.
    """
    dr = abs(a[0] - b[0])
    dc = abs(a[1] - b[1])
    return (math.sqrt(2) - 1) * min(dr, dc) + max(dr, dc)


HEURISTICS = {
    "manhattan": heuristic_manhattan,
    "euclidean": heuristic_euclidean,
    "chebyshev": heuristic_chebyshev,
    "octile": heuristic_octile,
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
    A* trên Grid Map (lưới 2D).

    Tham số:
      grid[r][c] = 0: ô trống, 1: vật cản
      heuristic  : "manhattan" | "euclidean" | "chebyshev"
      allow_diagonal: True → 8 hướng, False → 4 hướng

    Khuyến nghị heuristic:
      - 4 hướng (allow_diagonal=False) → dùng "manhattan"
      - 8 hướng (allow_diagonal=True)  → dùng "euclidean"

    Trả về:
      path           : Danh sách (row, col) từ start → goal
      visited_order  : Thứ tự các node được duyệt (dùng cho animation)
      execution_time : Thời gian chạy (ms)
      nodes_visited  : Tổng số node đã đóng (closed_set)
      distance       : Tổng chi phí đường đi (-1 nếu không tìm được)
      found          : True nếu tìm được đường
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

    t0 = time.perf_counter()

    while heap:
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

    t1 = time.perf_counter()
    execution_time = (t1 - t0) * 1000

    path = _reconstruct_path(prev, start, goal)
    distance = g.get(goal, float("inf"))

    return {
        "path": path,
        "visited_order": visited_order,
        "execution_time": round(execution_time, 4),
        "nodes_visited": len(closed_set),
        "distance": distance if distance != float("inf") else -1,
        "found": distance != float("inf"),
    }


# ─────────────────────────────── Graph A* ─────────────────────────────────

def astar_graph(
    graph: dict,
    node_positions: dict,  # {node_id: (lat, lon)}
    start: Any,
    goal: Any,
    heuristic: str = "euclidean",
) -> dict[str, Any]:
    """
    A* trên Đồ thị thực tế (OSM — OpenStreetMap).

    Tham số:
      graph          : { node_id: [(neighbor_id, weight_meters), ...] }
      node_positions : { node_id: (lat, lon) }  — tọa độ GPS của mỗi node
      heuristic      : Tên heuristic (hiện tại dùng Euclidean xấp xỉ trên tọa độ cầu)

    Heuristic cho bản đồ thực:
      h(a, b) = √((Δlat)² + (Δlon)²) × 111,000  (mét xấp xỉ)
      Đây là khoảng cách đường chim bay → luôn ≤ khoảng cách đường thực → ADMISSIBLE ✓
      (111,000 m/độ là xấp xỉ cho vĩ độ trung bình Việt Nam ~21°N)

    Ghi chú:
      Đồ thị OSM là directed graph → không có cạnh ngược chiều tự động.
      A* đảm bảo đường đi tối ưu nhờ heuristic admissible.
    """
    def h(a: Any, b: Any) -> float:
        """Heuristic: khoảng cách đường chim bay (mét) giữa 2 node GPS."""
        pa, pb = node_positions[a], node_positions[b]
        # Euclidean xấp xỉ trên tọa độ cầu, nhân 111,000 m/độ
        return math.sqrt((pa[0] - pb[0]) ** 2 + (pa[1] - pb[1]) ** 2) * 111_000

    # g(n): chi phí thực tế (mét) từ start đến n
    g: dict[Any, float] = {start: 0.0}
    prev: dict[Any, Any | None] = {start: None}

    # Heap: (f, g, node_id)
    heap = [(h(start, goal), 0.0, start)]
    closed_set: set = set()
    visited_order: list[Any] = []

    t0 = time.perf_counter()

    while heap:
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
                # f = g(neighbor) + h(neighbor, goal)
                f_n = tentative_g + h(neighbor, goal)
                prev[neighbor] = node
                heapq.heappush(heap, (f_n, tentative_g, neighbor))

    t1 = time.perf_counter()
    execution_time = (t1 - t0) * 1000

    path = _reconstruct_path_graph(prev, start, goal)
    distance = g.get(goal, float("inf"))

    return {
        "path": path,
        "visited_order": visited_order,
        "execution_time": round(execution_time, 4),
        "nodes_visited": len(closed_set),
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
