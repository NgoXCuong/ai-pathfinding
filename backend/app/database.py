import logging
import os

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

# Load biến môi trường từ backend/.env nếu có
load_dotenv()

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/ai_pathfinding",
)

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    """Tạo tất cả tables nếu chưa có. Không raise nếu DB chưa sẵn sàng."""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database sẵn sàng.")
    except Exception as e:
        # Để server vẫn khởi động cho demo (grid/benchmark/realmap không cần DB).
        # Các endpoint /api/history sẽ trả lỗi 500 khi DB không khả dụng.
        logger.error(f"Không thể kết nối database ({type(e).__name__}: {e}). "
                     "Lịch sử sẽ không hoạt động. Hãy chạy: docker compose up -d")
