from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, delete
from sqlalchemy.orm import selectinload
from pydantic import BaseModel

from app.database import get_db
from app.models import SearchHistory, RouteResult

router = APIRouter(prefix="/api/history", tags=["History"])


class SaveHistoryRequest(BaseModel):
    map_type: str = "grid"
    grid_size: int | None = None
    start_lat: float | None = None
    start_lon: float | None = None
    end_lat: float | None = None
    end_lon: float | None = None
    results: list[dict]  # list of algorithm results


@router.get("/")
async def get_history(
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """Lấy lịch sử tìm đường (phân trang)."""
    stmt = (
        select(SearchHistory)
        .options(selectinload(SearchHistory.results))
        .order_by(desc(SearchHistory.created_at))
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(stmt)
    histories = result.scalars().all()

    out = []
    for h in histories:
        out.append({
            "id": h.id,
            "map_type": h.map_type,
            "grid_size": h.grid_size,
            "start_lat": h.start_lat,
            "start_lon": h.start_lon,
            "end_lat": h.end_lat,
            "end_lon": h.end_lon,
            "created_at": h.created_at.isoformat() + "Z",
            "results": [
                {
                    "algorithm": rr.algorithm,
                    "heuristic": rr.heuristic,
                    "distance": rr.distance,
                    "execution_time": rr.execution_time,
                    "nodes_visited": rr.nodes_visited,
                    "steps": rr.steps,
                    "found": rr.found,
                }
                for rr in h.results
            ],
        })

    return {"histories": out, "offset": offset, "limit": limit}


@router.post("/")
async def save_history(
    req: SaveHistoryRequest,
    db: AsyncSession = Depends(get_db),
):
    """Lưu kết quả tìm đường vào DB."""
    history = SearchHistory(
        map_type=req.map_type,
        grid_size=req.grid_size,
        start_lat=req.start_lat,
        start_lon=req.start_lon,
        end_lat=req.end_lat,
        end_lon=req.end_lon,
    )
    db.add(history)
    await db.flush()

    for r in req.results:
        route = RouteResult(
            search_id=history.id,
            algorithm=r.get("algorithm"),
            heuristic=r.get("heuristic"),
            distance=r.get("distance"),
            execution_time=r.get("execution_time"),
            nodes_visited=r.get("nodes_visited"),
            steps=r.get("steps"),
            found=r.get("found", True),
            path=r.get("path"),
        )
        db.add(route)

    await db.commit()
    return {"id": history.id, "message": "Đã lưu thành công"}


@router.delete("/clear/all")
async def clear_all_history(
    db: AsyncSession = Depends(get_db),
):
    """Xóa toàn bộ lịch sử thực thi."""
    await db.execute(delete(RouteResult))
    await db.execute(delete(SearchHistory))
    await db.commit()
    return {"message": "Đã xóa toàn bộ lịch sử"}


@router.delete("/{history_id}")
async def delete_history(
    history_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Xóa một bản ghi lịch sử."""
    stmt = select(SearchHistory).where(SearchHistory.id == history_id)
    result = await db.execute(stmt)
    history = result.scalar_one_or_none()
    if not history:
        raise HTTPException(status_code=404, detail="Không tìm thấy")
    await db.delete(history)
    await db.commit()
    return {"message": "Đã xóa"}
