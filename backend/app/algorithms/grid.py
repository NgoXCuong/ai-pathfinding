import random
from typing import Any


def generate_grid(
    size: int,
    obstacle_density: float = 0.3,
    seed: int | None = None,
) -> list[list[int]]:
    """
    Tạo grid ngẫu nhiên.
    0 = ô trống, 1 = vật cản
    """
    if seed is not None:
        random.seed(seed)

    grid = []
    for r in range(size):
        row = []
        for c in range(size):
            # Protect start corner (0,0) and goal corner (size-1, size-1)
            is_start_corner = (r <= 1 and c <= 1)
            is_goal_corner = (r >= size - 2 and c >= size - 2)
            
            if is_start_corner or is_goal_corner:
                row.append(0)
            else:
                row.append(1 if random.random() < obstacle_density else 0)
        grid.append(row)

    return grid


def ensure_passable(
    grid: list[list[int]],
    start: tuple[int, int],
    goal: tuple[int, int],
) -> list[list[int]]:
    """Đảm bảo start và goal không phải vật cản."""
    grid[start[0]][start[1]] = 0
    grid[goal[0]][goal[1]] = 0
    return grid


def grid_to_obstacles(grid: list[list[int]]) -> list[list[int]]:
    """Chuyển grid thành danh sách tọa độ vật cản."""
    obstacles = []
    for r, row in enumerate(grid):
        for c, cell in enumerate(row):
            if cell == 1:
                obstacles.append([r, c])
    return obstacles


def obstacles_to_grid(
    size: int,
    obstacles: list[list[int]],
) -> list[list[int]]:
    """Chuyển danh sách vật cản thành grid."""
    grid = [[0] * size for _ in range(size)]
    for r, c in obstacles:
        if 0 <= r < size and 0 <= c < size:
            grid[r][c] = 1
    return grid


def validate_grid_input(
    size: int,
    start: list[int],
    goal: list[int],
) -> str | None:
    """Kiểm tra input hợp lệ. Trả về None nếu OK, error message nếu lỗi."""
    if size < 5 or size > 200:
        return "Grid size phải từ 5 đến 200"
    if not (0 <= start[0] < size and 0 <= start[1] < size):
        return "Start nằm ngoài grid"
    if not (0 <= goal[0] < size and 0 <= goal[1] < size):
        return "Goal nằm ngoài grid"
    if start == goal:
        return "Start và Goal không được trùng nhau"
    return None
