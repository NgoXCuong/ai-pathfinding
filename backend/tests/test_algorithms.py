"""Unit test cho các thuật toán tìm đường (Dijkstra & A*)."""

import pytest

from app.algorithms.dijkstra import dijkstra_grid
from app.algorithms.astar import astar_grid, HEURISTICS
from app.algorithms.grid import generate_grid, obstacles_to_grid


# ── Fixtures ────────────────────────────────────────────────────────────────

def make_grid(size: int, obstacles: list[tuple[int, int]]) -> list[list[int]]:
    """Tạo grid với danh sách vật cản cho trước."""
    grid = [[0] * size for _ in range(size)]
    for r, c in obstacles:
        grid[r][c] = 1
    return grid


# ── Kiểm tra tính đúng & tối ưu ─────────────────────────────────────────────

@pytest.mark.parametrize("size,density,seed", [(10, 0.2, 1), (20, 0.3, 42), (30, 0.35, 99)])
@pytest.mark.parametrize("heuristic", list(HEURISTICS.keys()))
def test_astar_matches_dijkstra_4dir(size, density, seed, heuristic):
    """A* (mọi heuristic) phải cho cùng chiều dài đường đi tối ưu với Dijkstra (4 hướng)."""
    grid = generate_grid(size, density, seed=seed)
    start, goal = (0, 0), (size - 1, size - 1)

    d = dijkstra_grid(grid, start, goal)
    a = astar_grid(grid, start, goal, heuristic=heuristic)

    assert d["found"] == a["found"]
    if d["found"]:
        assert a["distance"] == pytest.approx(d["distance"], abs=1e-6)
        # A* tối ưu → đường đi thực tế khớp Dijkstra


@pytest.mark.parametrize("heuristic", ["euclidean", "chebyshev", "octile"])
def test_astar_matches_dijkstra_8dir(heuristic):
    """A* 8 hướng với cost chéo √2 phải tối ưu (all admissible heuristics)."""
    grid = generate_grid(25, 0.25, seed=7)
    start, goal = (0, 0), (24, 24)

    d = dijkstra_grid(grid, start, goal, allow_diagonal=True)
    a = astar_grid(grid, start, goal, heuristic=heuristic, allow_diagonal=True)

    assert d["found"] == a["found"]
    assert a["distance"] == pytest.approx(d["distance"], abs=1e-6)


def test_astar_visits_less_or_equal_nodes():
    """A* không được duyệt nhiều node hơn Dijkstra trên cùng bài toán."""
    grid = generate_grid(40, 0.3, seed=123)
    start, goal = (0, 0), (39, 39)

    d = dijkstra_grid(grid, start, goal)
    a = astar_grid(grid, start, goal, heuristic="manhattan")

    assert d["found"] and a["found"]
    assert a["nodes_visited"] <= d["nodes_visited"]


# ── Trường hợp không có đường đi ────────────────────────────────────────────

def test_no_path_when_blocked():
    """Khi vật cản chặn hoàn toàn, cả 2 thuật toán phải trả found=False."""
    grid = make_grid(10, [(5, c) for c in range(10)])  # hàng 5 chặn kín

    d = dijkstra_grid(grid, (0, 0), (9, 9))
    a = astar_grid(grid, (0, 0), (9, 9), heuristic="manhattan")

    assert d["found"] is False
    assert a["found"] is False
    assert d["distance"] == -1
    assert a["distance"] == -1
    assert d["path"] == []
    assert a["path"] == []


# ── Trường hợp start = goal / đường thẳng không vật cản ────────────────────

def test_start_equals_goal():
    """Start == Goal → đường đi chỉ gồm 1 node, chi phí 0."""
    grid = make_grid(5, [])
    d = dijkstra_grid(grid, (2, 2), (2, 2))
    a = astar_grid(grid, (2, 2), (2, 2), heuristic="manhattan")

    assert d["found"] is True
    assert d["distance"] == 0
    assert d["path"] == [(2, 2)]
    assert a["found"] is True


def test_open_grid_straight_line():
    """Grid không vật cản: đường chéo ngắn nhất (8 hướng) đúng bằng chiều dài diagonal."""
    grid = make_grid(6, [])
    start, goal = (0, 0), (5, 5)
    d = dijkstra_grid(grid, start, goal, allow_diagonal=True)
    a = astar_grid(grid, start, goal, heuristic="octile", allow_diagonal=True)

    # 5 bước chéo × cost chéo 1.414 (code dùng xấp xỉ √2) = 7.07
    assert d["found"] and a["found"]
    assert d["distance"] == pytest.approx(5 * 1.414, abs=1e-6)
    assert a["distance"] == pytest.approx(5 * 1.414, abs=1e-6)


# ── Heuristic ────────────────────────────────────────────────────────────────

def test_all_heuristics_available():
    """Bắt buộc đủ 4 heuristic để chạy trên UI."""
    assert set(HEURISTICS.keys()) == {"manhattan", "euclidean", "chebyshev", "octile"}
