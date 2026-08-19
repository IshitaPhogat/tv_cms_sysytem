from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import Base, engine
from .routers import (  # Import viewer_auth
    artwork,
    publishing,
    seeding,
    viewer_auth,
    viewers,
)

# Automatically create database tables when the app starts (if they don't exist yet)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Peblo TV Mini Backend")
app.mount(
    "/storage_data",
    StaticFiles(directory="/app/storage_data"),
    name="storage_data"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include our routers
app.include_router(artwork.router)
app.include_router(seeding.router)
app.include_router(publishing.router)
app.include_router(viewer_auth.router)  #  Register the viewer auth routes (/viewer/register & /viewer/login)
app.include_router(viewers.router)  #  Register the viewers routes (/viewers)


@app.get("/")
def read_root():
    return {"message": "Peblo TV Mini Backend is running with validation rules!"}

@app.get("/health", tags=["Operability"])
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "service": "Peblo TV Mini Backend"
    }