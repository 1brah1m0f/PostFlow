from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import os

from app.database import Base, engine
from app.routers import auth, posts, accounts, ai
from app.services.scheduler import start_scheduler
from app.core.config import settings


os.makedirs(settings.UPLOADS_DIR, exist_ok=True)

# Comma-separated list of allowed origins, e.g. "http://localhost:3000,https://postflow.vercel.app"
_raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    start_scheduler()
    yield


app = FastAPI(title="PostFlow API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    origin = request.headers.get("origin", ALLOWED_ORIGINS[0] if ALLOWED_ORIGINS else "*")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers={"Access-Control-Allow-Origin": origin},
    )

app.mount("/uploads", StaticFiles(directory=settings.UPLOADS_DIR), name="uploads")

app.include_router(auth.router)
app.include_router(posts.router)
app.include_router(accounts.router)
app.include_router(ai.router)


@app.get("/health")
def health():
    return {"status": "ok"}
