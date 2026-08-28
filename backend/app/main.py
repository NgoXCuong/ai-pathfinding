import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import grid_router, benchmark_router, history_router, realmap_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Khởi động: tạo DB tables."""
    logger.info("Đang khởi tạo database...")
    await init_db()
    logger.info("Database sẵn sàng.")
    yield
    logger.info("Server đang tắt...")


app = FastAPI(
    title="AI Pathfinding API",
    version="2.0.0",
    description="Dijkstra vs A* — Grid & Real Map",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────────
app.include_router(grid_router.router)
app.include_router(benchmark_router.router)
app.include_router(history_router.router)
app.include_router(realmap_router.router)


@app.get("/")
def root():
    return {
        "message": "AI Pathfinding API v2",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "message": "Backend is connected",
    }

