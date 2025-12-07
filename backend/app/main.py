from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.redis_client import RedisClient
from app.alerts.routes import router as alerts_router
from app.auth.routes import router as auth_router
from app.children.routes import router as children_router
from app.devices.routes import router as devices_router
from app.emergency_contacts.routes import router as emergency_contacts_router
from app.locations.routes import router as locations_router
from app.shake_detectors.routes import router as shake_detectors_router
from app.geofences.routes import router as geofences_router

app = FastAPI(
    title="Child Security Monitoring API",
    description="Backend API for Child Security and Monitoring Application",
    version="1.0.0"
)

# Configure CORS to allow React frontend and React Native mobile app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development (restrict in production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(children_router)
app.include_router(locations_router)
app.include_router(emergency_contacts_router)
app.include_router(alerts_router)
app.include_router(devices_router)
app.include_router(shake_detectors_router)
app.include_router(geofences_router)


@app.on_event("startup")
async def startup_event():
    """Initialize connections on startup"""
    # Test Redis connection
    if RedisClient.ping():
        print("✓ Redis connection established")
    else:
        print("⚠ Redis connection failed - continuing without Redis cache")
    
    # Check notification services
    from app.notifications.service import notification_service
    if notification_service.sms_enabled:
        print("✓ SMS notifications enabled (Twilio)")
    else:
        print("⚠ SMS notifications disabled (configure TWILIO_* in .env)")
    
    if notification_service.email_enabled:
        print("✓ Email notifications enabled (SendGrid)")
    else:
        print("⚠ Email notifications disabled (configure SENDGRID_* in .env)")


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
