"""Local API foundation; no logistics features yet."""

from contextlib import asynccontextmanager, closing
import os
from pathlib import Path
import sqlite3

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal
from backend import gemma, marketplace

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")
database_path = Path(os.getenv("DATABASE_PATH", "backend/data/freshroute.db"))
if not database_path.is_absolute():
    database_path = ROOT / database_path


@asynccontextmanager
async def lifespan(app: FastAPI):
    database_path.parent.mkdir(parents=True, exist_ok=True)
    with closing(sqlite3.connect(database_path)) as connection:
        connection.execute("PRAGMA user_version = 1")
    app.state.database_path = database_path
    marketplace.initialize(database_path)
    yield


app = FastAPI(title="FreshRoute AI", version="0.1.0", lifespan=lifespan)
app.include_router(marketplace.router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",") if origin.strip()],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/api/health")
def health():
    try:
        with closing(sqlite3.connect(database_path)) as connection:
            connection.execute("SELECT 1").fetchone()
    except sqlite3.Error as error:
        raise HTTPException(status_code=503, detail="Database unavailable") from error
    return {"status": "ok", "application": "FreshRoute AI", "database": "ok"}


class AIRequest(BaseModel):
    task: Literal["description", "forecast", "matching", "logistics", "photo"]
    data: dict = Field(default_factory=dict)
    image_base64: str | None = Field(default=None, max_length=4_000_000)
    image_mime: Literal["image/jpeg", "image/png", "image/webp"] | None = None


@app.get("/api/ai/status")
def ai_status():
    return gemma.status()


@app.post("/api/ai/assist")
def ai_assist(request: AIRequest):
    try:
        return gemma.generate(request.task, request.data, request.image_base64, request.image_mime)
    except gemma.AIError as error:
        raise HTTPException(status_code=error.code, detail=str(error)) from None
