from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.db.session import engine
from app.routers import dealers, leads, vehicles


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    yield
    await engine.dispose()


app = FastAPI(
    title="Datrovo API",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(leads.router, prefix="/api/v1")
app.include_router(dealers.router, prefix="/api/v1")
app.include_router(vehicles.router, prefix="/api/v1")
