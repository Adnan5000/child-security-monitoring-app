from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.redis_client import RedisClient
from app.auth.routes import router as auth_router

app = FastAPI(
    title="Child Security Monitoring API",
    description="Backend API for Child Security and Monitoring Application",
    version="1.0.0"
)

# Configure CORS to allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)


@app.on_event("startup")
async def startup_event():
    """Initialize connections on startup"""
    # Test Redis connection
    if RedisClient.ping():
        print("✓ Redis connection established")
    else:
        print("⚠ Redis connection failed - continuing without Redis cache")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    pass


@app.get("/")
async def root():
    return {
        "message": "Child Security Monitoring API",
        "status": "running",
        "version": "1.0.0",
        "database": "PostgreSQL",
        "cache": "Redis"
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    redis_status = RedisClient.ping()
    
    return {
        "status": "healthy",
        "service": "Child Security Monitoring API",
        "database": "PostgreSQL",
        "redis": "connected" if redis_status else "disconnected"
    }
