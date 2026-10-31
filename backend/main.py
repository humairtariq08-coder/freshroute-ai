"""FreshRoute AI API: marketplace, hosted Gemma assistant and road routing."""

from contextlib import asynccontextmanager, closing
import os
from pathlib import Path
import sqlite3
from tempfile import gettempdir

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal
from backend import gemma, marketplace, routing

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")
default_database = (
    str(Path(gettempdir()) / "freshroute-demo.db")
    if os.getenv("VERCEL") == "1"
    else "backend/data/freshroute.db"
)
database_path = Path(os.getenv("DATABASE_PATH", default_database).strip())
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
app.include_router(routing.router)
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
    task: Literal["chat", "description", "forecast", "matching", "logistics", "photo"]
    data: dict = Field(default_factory=dict)
    image_base64: str | None = Field(default=None, max_length=4_000_000)
    image_mime: Literal["image/jpeg", "image/png", "image/webp"] | None = None


@app.get("/api/ai/status")
def ai_status():
    return gemma.status()


@app.post("/api/ai/assist")
def ai_assist(request: AIRequest, http_request: Request):
    try:
        if request.task == "chat":
            message = request.data.get("message")
            if not isinstance(message, str) or not message.strip() or len(message) > 2000:
                raise HTTPException(422, "Enter a message of up to 2,000 characters.")
            snapshot = marketplace.marketplace(http_request)
            request.data = {
                "message": message.strip(),
                "conversation": request.data.get("conversation", [])[-8:] if isinstance(request.data.get("conversation"), list) else [],
                "marketplace": {key: snapshot[key] for key in ("products", "requirements", "history", "summary")},
            }
        return gemma.generate(request.task, request.data, request.image_base64, request.image_mime)
    except gemma.AIError as error:
        raise HTTPException(status_code=error.code, detail=str(error)) from None


app.frontend(
    "/",
    directory=ROOT / "frontend" / "dist",
    fallback="index.html",
    check_dir=False,
)
