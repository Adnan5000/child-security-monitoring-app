from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

@app.get("/")
async def root():
    return {
        "message": "Child Security Monitoring API",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Child Security Monitoring API"
    }

