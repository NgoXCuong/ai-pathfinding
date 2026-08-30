import uuid
from datetime import datetime, timezone
from sqlalchemy import Integer, Float, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class SearchHistory(Base):
    __tablename__ = "search_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    start_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    start_lon: Mapped[float | None] = mapped_column(Float, nullable=True)
    end_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    end_lon: Mapped[float | None] = mapped_column(Float, nullable=True)
    map_type: Mapped[str] = mapped_column(String(20), default="grid")
    grid_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    results: Mapped[list["RouteResult"]] = relationship(
        "RouteResult", back_populates="search", cascade="all, delete-orphan"
    )


class RouteResult(Base):
    __tablename__ = "route_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    search_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("search_history.id"), index=True
    )
    algorithm: Mapped[str] = mapped_column(String(20))
    heuristic: Mapped[str | None] = mapped_column(String(20), nullable=True)
    distance: Mapped[float | None] = mapped_column(Float, nullable=True)
    execution_time: Mapped[float | None] = mapped_column(Float, nullable=True)
    nodes_visited: Mapped[int | None] = mapped_column(Integer, nullable=True)
    steps: Mapped[int | None] = mapped_column(Integer, nullable=True)
    path: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    found: Mapped[bool | None] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    search: Mapped["SearchHistory"] = relationship(
        "SearchHistory", back_populates="results"
    )
