from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from datetime import datetime, timedelta
from app.database import get_db
from app.models.user import User, Parent
from app.models.child import Child
from app.models.location import Location
from app.locations.schemas import LocationCreate, LocationResponse, LocationUpdate, ChildrenLocationsResponse
from app.auth.dependencies import get_current_user
from app.redis_client import set_location, get_location, invalidate_location

router = APIRouter(prefix="/api/locations", tags=["locations"])


def get_current_parent(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Parent:
    """Get the parent profile for the current user"""
    parent = db.query(Parent).filter(Parent.user_id == current_user.user_id).first()
    if not parent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parent profile not found"
        )
    return parent


@router.post("", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
async def create_location(
    location_data: LocationCreate,
    current_parent: Parent = Depends(get_current_parent),
    db: Session = Depends(get_db)
):
    """Create a new location update for a child (from mobile device)"""
    # Verify child belongs to current parent
    child = db.query(Child).filter(
        Child.child_id == location_data.child_id,
        Child.parent_id == current_parent.parent_id
    ).first()
    
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found"
        )
    
    # Create location record in database
    new_location = Location(
        child_id=location_data.child_id,
        latitude=location_data.latitude,
        longitude=location_data.longitude,
        accuracy=location_data.accuracy,
        address=location_data.address,
        timestamp=datetime.utcnow()
    )
    
    db.add(new_location)
    db.commit()
    db.refresh(new_location)
    
    # Cache in Redis for fast real-time access (TTL: 5 minutes)
    location_cache = {
        "location_id": str(new_location.location_id),
        "child_id": str(new_location.child_id),
        "child_name": child.name,
        "latitude": new_location.latitude,
        "longitude": new_location.longitude,
        "accuracy": new_location.accuracy,
        "address": new_location.address,
        "timestamp": new_location.timestamp.isoformat()
    }
    set_location(str(child.child_id), location_cache, ttl=300)
    
    return LocationResponse(
        location_id=str(new_location.location_id),
        child_id=str(new_location.child_id),
        child_name=child.name,
        latitude=new_location.latitude,
        longitude=new_location.longitude,
        accuracy=new_location.accuracy,
        address=new_location.address,
        timestamp=new_location.timestamp
    )


@router.get("/children", response_model=ChildrenLocationsResponse)
async def get_children_locations(
    current_parent: Parent = Depends(get_current_parent),
    db: Session = Depends(get_db)
):
    """Get current locations of all children for the current parent"""
    # Get all children for this parent
    children = db.query(Child).filter(
        Child.parent_id == current_parent.parent_id,
        Child.is_active == True
    ).all()
    
    locations = []
    
    for child in children:
        # Try to get from Redis cache first
        cached_location = get_location(str(child.child_id))
        
        if cached_location:
            # Use cached location
            locations.append(LocationResponse(
                location_id=cached_location["location_id"],
                child_id=cached_location["child_id"],
                child_name=cached_location["child_name"],
                latitude=cached_location["latitude"],
                longitude=cached_location["longitude"],
                accuracy=cached_location.get("accuracy"),
                address=cached_location.get("address"),
                timestamp=datetime.fromisoformat(cached_location["timestamp"])
            ))
        else:
            # Fallback to database - get most recent location
            latest_location = db.query(Location).filter(
                Location.child_id == child.child_id
            ).order_by(desc(Location.timestamp)).first()
            
            if latest_location:
                # Check if location is recent (within last 10 minutes)
                if latest_location.timestamp > datetime.utcnow() - timedelta(minutes=10):
                    locations.append(LocationResponse(
                        location_id=str(latest_location.location_id),
                        child_id=str(latest_location.child_id),
                        child_name=child.name,
                        latitude=latest_location.latitude,
                        longitude=latest_location.longitude,
                        accuracy=latest_location.accuracy,
                        address=latest_location.address,
                        timestamp=latest_location.timestamp
                    ))
                    # Cache it for future requests
                    location_cache = {
                        "location_id": str(latest_location.location_id),
                        "child_id": str(latest_location.child_id),
                        "child_name": child.name,
                        "latitude": latest_location.latitude,
                        "longitude": latest_location.longitude,
                        "accuracy": latest_location.accuracy,
                        "address": latest_location.address,
                        "timestamp": latest_location.timestamp.isoformat()
                    }
                    set_location(str(child.child_id), location_cache, ttl=300)
    
    return ChildrenLocationsResponse(children=locations)


@router.get("/child/{child_id}", response_model=LocationResponse)
async def get_child_location(
    child_id: str,
    current_parent: Parent = Depends(get_current_parent),
    db: Session = Depends(get_db)
):
    """Get current location of a specific child"""
    # Verify child belongs to current parent
    child = db.query(Child).filter(
        Child.child_id == child_id,
        Child.parent_id == current_parent.parent_id
    ).first()
    
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found"
        )
    
    # Try Redis cache first
    cached_location = get_location(child_id)
    
    if cached_location:
        return LocationResponse(
            location_id=cached_location["location_id"],
            child_id=cached_location["child_id"],
            child_name=cached_location["child_name"],
            latitude=cached_location["latitude"],
            longitude=cached_location["longitude"],
            accuracy=cached_location.get("accuracy"),
            address=cached_location.get("address"),
            timestamp=datetime.fromisoformat(cached_location["timestamp"])
        )
    
    # Fallback to database
    latest_location = db.query(Location).filter(
        Location.child_id == child_id
    ).order_by(desc(Location.timestamp)).first()
    
    if not latest_location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No location data found for this child"
        )
    
    return LocationResponse(
        location_id=str(latest_location.location_id),
        child_id=str(latest_location.child_id),
        child_name=child.name,
        latitude=latest_location.latitude,
        longitude=latest_location.longitude,
        accuracy=latest_location.accuracy,
        address=latest_location.address,
        timestamp=latest_location.timestamp
    )


@router.get("/child/{child_id}/history", response_model=List[LocationResponse])
async def get_child_location_history(
    child_id: str,
    hours: int = 24,  # Default: last 24 hours
    current_parent: Parent = Depends(get_current_parent),
    db: Session = Depends(get_db)
):
    """Get location history for a specific child"""
    # Verify child belongs to current parent
    child = db.query(Child).filter(
        Child.child_id == child_id,
        Child.parent_id == current_parent.parent_id
    ).first()
    
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found"
        )
    
    # Get locations within the specified time range
    start_time = datetime.utcnow() - timedelta(hours=hours)
    locations = db.query(Location).filter(
        Location.child_id == child_id,
        Location.timestamp >= start_time
    ).order_by(desc(Location.timestamp)).limit(100).all()  # Limit to 100 most recent
    
    return [
        LocationResponse(
            location_id=str(loc.location_id),
            child_id=str(loc.child_id),
            child_name=child.name,
            latitude=loc.latitude,
            longitude=loc.longitude,
            accuracy=loc.accuracy,
            address=loc.address,
            timestamp=loc.timestamp
        )
        for loc in locations
    ]


async def check_geofences_task(child_id: str, location_id: str, lat: float, lon: float, db: Session):
    """Background task to check geofence transitions"""
    from app.geofences.service import (
        check_geofence_transitions,
        create_geofence_event,
        create_geofence_alert,
    )
    from app.models.child import Child
    from app.models.location import Location
    from app.models.alert import AlertDistribution
    from app.notifications.service import notification_service
    import logging

    logger = logging.getLogger(__name__)

    try:
        child = db.query(Child).filter(Child.child_id == child_id).first()
        if not child:
            logger.warning(f"Child {child_id} not found for geofence check")
            return

        location = db.query(Location).filter(Location.location_id == location_id).first()

        # Check for geofence transitions
        entry_events, exit_events = check_geofence_transitions(
            child_id, lat, lon, location_id, db
        )

        # Process entry events
        for geofence in entry_events:
            event = create_geofence_event(
                geofence, child, location_id, "ENTRY", lat, lon, db
            )
            alert = create_geofence_alert(
                geofence, child, location_id, "ENTRY", db
            )
            db.flush()

            # Distribute alert to emergency contacts
            if child.parent.emergency_contacts:
                distribution = AlertDistribution(alert_id=alert.alert_id)
                distribution.emergency_contacts = child.parent.emergency_contacts
                db.add(distribution)

            db.commit()

            # Send notifications
            if child.parent.emergency_contacts:
                location_info = notification_service.get_location_string(alert)
                notification_service.send_alert_notifications(
                    alert=alert,
                    contacts=child.parent.emergency_contacts,
                    location_info=location_info
                )
                alert.status = "SENT"
                db.commit()

            logger.info(f"Geofence entry event created for {geofence.name}")

        # Process exit events
        for geofence in exit_events:
            event = create_geofence_event(
                geofence, child, location_id, "EXIT", lat, lon, db
            )
            alert = create_geofence_alert(
                geofence, child, location_id, "EXIT", db
            )
            db.flush()

            # Distribute alert to emergency contacts
            if child.parent.emergency_contacts:
                distribution = AlertDistribution(alert_id=alert.alert_id)
                distribution.emergency_contacts = child.parent.emergency_contacts
                db.add(distribution)

            db.commit()

            # Send notifications
            if child.parent.emergency_contacts:
                location_info = notification_service.get_location_string(alert)
                notification_service.send_alert_notifications(
                    alert=alert,
                    contacts=child.parent.emergency_contacts,
                    location_info=location_info
                )
                alert.status = "SENT"
                db.commit()

            logger.info(f"Geofence exit event created for {geofence.name}")

    except Exception as e:
        logger.error(f"Error checking geofences: {e}", exc_info=True)
        db.rollback()


@router.put("/child/{child_id}", response_model=LocationResponse)
async def update_child_location(
    child_id: str,
    location_data: LocationUpdate,
    background_tasks: BackgroundTasks,
    current_parent: Parent = Depends(get_current_parent),
    db: Session = Depends(get_db)
):
    """Update location for a child (from mobile device)"""
    # Verify child belongs to current parent
    child = db.query(Child).filter(
        Child.child_id == child_id,
        Child.parent_id == current_parent.parent_id
    ).first()
    
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found"
        )
    
    # Create new location record (we store history, not update)
    new_location = Location(
        child_id=child_id,
        latitude=location_data.latitude,
        longitude=location_data.longitude,
        accuracy=location_data.accuracy,
        address=location_data.address,
        timestamp=datetime.utcnow()
    )
    
    db.add(new_location)
    db.commit()
    db.refresh(new_location)
    
    # Update Redis cache
    location_cache = {
        "location_id": str(new_location.location_id),
        "child_id": str(new_location.child_id),
        "child_name": child.name,
        "latitude": new_location.latitude,
        "longitude": new_location.longitude,
        "accuracy": new_location.accuracy,
        "address": new_location.address,
        "timestamp": new_location.timestamp.isoformat()
    }
    set_location(str(child.child_id), location_cache, ttl=300)
    
    # Check geofences in background
    from app.database import SessionLocal
    background_tasks.add_task(
        check_geofences_task,
        str(child.child_id),
        str(new_location.location_id),
        new_location.latitude,
        new_location.longitude,
        SessionLocal()
    )
    
    return LocationResponse(
        location_id=str(new_location.location_id),
        child_id=str(new_location.child_id),
        child_name=child.name,
        latitude=new_location.latitude,
        longitude=new_location.longitude,
        accuracy=new_location.accuracy,
        address=new_location.address,
        timestamp=new_location.timestamp
    )

