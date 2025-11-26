# Architecture Overview

## Database Architecture: PostgreSQL + Redis

### Why This Approach?

**PostgreSQL (Primary Database)**
- ✅ Excellent for relational data (Users → Parents → Children → Locations)
- ✅ ACID compliance for data integrity
- ✅ Complex queries and joins
- ✅ Time-series data with timestamp indexing
- ✅ Geospatial queries (can extend with PostGIS)
- ✅ Strong Python/FastAPI integration

**Redis (Caching Layer)**
- ✅ Ultra-fast real-time location caching
- ✅ Temporary device status storage
- ✅ Reduces database load for frequent queries
- ✅ Perfect for mobile app real-time updates

### Data Flow

```
Mobile App (Android)
    ↓ (Location Updates)
FastAPI Backend
    ↓
Redis Cache (5min TTL) ← Fast lookups for real-time tracking
    ↓ (Periodic sync)
PostgreSQL ← Permanent storage, historical data, relationships
```

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration settings
│   ├── database.py          # SQLAlchemy setup
│   ├── redis_client.py      # Redis connection & utilities
│   └── models/              # Database models
│       ├── __init__.py
│       ├── user.py          # User, Parent
│       ├── child.py         # Child
│       ├── location.py      # Location, LocationHistory
│       ├── emergency_contact.py
│       ├── alert.py         # Alert, AlertDistribution
│       ├── device.py        # DeviceStatus
│       └── shake_detector.py
├── alembic/                 # Database migrations
│   ├── versions/
│   └── env.py
├── alembic.ini
├── requirements.txt
└── run.py
```

## Database Models

### Core Entities

1. **User** - Base user account (authentication)
2. **Parent** - Extends User, has children and contacts
3. **Child** - Child profile with device tracking
4. **Location** - GPS coordinates with timestamps
5. **LocationHistory** - Aggregated location records
6. **EmergencyContact** - Contact information
7. **Alert** - Emergency alerts (SHAKE_TRIGGER, SOS_BUTTON)
8. **AlertDistribution** - Alert delivery tracking
9. **DeviceStatus** - Real-time device info (battery, network)
10. **ShakeDetector** - Shake detection configuration

### Relationships

- User (1) → Parent (1)
- Parent (1) → Children (*)
- Child (1) → Locations (*)
- Child (1) → Alerts (*)
- Child (1) → DeviceStatus (1)
- Child (1) → ShakeDetector (1)
- Parent (1) → EmergencyContacts (*)
- Alert (1) → AlertDistribution (1)
- AlertDistribution (*) ↔ EmergencyContact (*) [Many-to-Many]

## Redis Usage

### Key Patterns

- `location:{child_id}` - Current location (TTL: 300s)
- `device:{device_id}` - Device status (TTL: 60s)

### Functions

- `set_location()` - Cache current location
- `get_location()` - Retrieve cached location
- `cache_device_status()` - Cache device info
- `get_device_status()` - Retrieve cached device info
- `invalidate_location()` - Clear location cache

## API Endpoints

### Health Check
- `GET /api/health` - System status (checks PostgreSQL & Redis)

### Authentication & Parents
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Children & Location Tracking
- `CRUD /api/children`
- `POST /api/locations` - Insert new sample + cache
- `GET /api/locations/children` - Batch snapshot
- `GET /api/locations/child/{child_id}`
- `GET /api/locations/child/{child_id}/history`

### Emergency Contacts
- `GET|POST /api/emergency-contacts`
- `PUT|DELETE /api/emergency-contacts/{contact_id}`

### Alerts & SOS
- `POST /api/alerts` - Trigger SHAKE/SOS alerts (auto-distributes to contacts)
- `GET /api/alerts?status_filter=` - Filter by status
- `POST /api/alerts/{alert_id}/acknowledge`

### Device Telemetry
- `GET /api/devices/status` - All devices for parent
- `GET|PUT /api/devices/child/{child_id}/status`

## Next Steps

1. **Notifications**
   - SMS/e-mail fan-out via providers
   - Push notifications for mobile/web

2. **Geofencing**
   - Safe zone definitions
   - Auto alerts on boundary breaches

3. **Advanced Analytics**
   - Weekly movement digests
   - Device health trends

## Performance Considerations

- **Connection Pooling**: SQLAlchemy pool configured (size: 10, overflow: 20)
- **Indexes**: Created on foreign keys and frequently queried columns
- **Caching Strategy**: Redis with appropriate TTLs
- **Migration Management**: Alembic for version control

## Security Notes

- All passwords stored as hashes (bcrypt)
- UUIDs for primary keys (security through obscurity)
- Environment variables for sensitive config
- CORS configured for frontend only

