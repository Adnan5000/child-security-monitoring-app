from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.geofences.schemas import (
    GeofenceCreate,
    GeofenceUpdate,
    GeofenceResponse,
    GeofenceEventResponse,
)
from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.child import Child
from app.models.geofence import Geofence, GeofenceEvent
from app.models.user import Parent, User
import json

router = APIRouter(prefix="/api/geofences", tags=["geofences"])


def get_current_parent(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Parent:
    parent = db.query(Parent).filter(Parent.user_id == current_user.user_id).first()
    if not parent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parent profile not found"
        )
    return parent


@router.get("/child/{child_id}", response_model=List[GeofenceResponse])
async def list_geofences(
    child_id: str,
    current_parent: Parent = Depends(get_current_parent),
    db: Session = Depends(get_db)
):
    """Get all geofences for a child"""
    child = db.query(Child).filter(
        Child.child_id == child_id,
        Child.parent_id == current_parent.parent_id
    ).first()

    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found"
        )

    geofences = db.query(Geofence).filter(
        Geofence.child_id == child_id
    ).order_by(Geofence.name).all()

    result = []
    for geofence in geofences:
        geofence_dict = {
            "geofence_id": geofence.geofence_id,
            "child_id": geofence.child_id,
            "name": geofence.name,
            "description": geofence.description,
            "geofence_type": geofence.geofence_type.value,
            "center_latitude": geofence.center_latitude,
            "center_longitude": geofence.center_longitude,
            "radius_meters": geofence.radius_meters,
            "polygon_coordinates": json.loads(geofence.polygon_coordinates) if geofence.polygon_coordinates else None,
            "alert_on_entry": geofence.alert_on_entry,
            "alert_on_exit": geofence.alert_on_exit,
            "is_active": geofence.is_active,
            "created_at": geofence.created_at,
            "updated_at": geofence.updated_at,
        }
        result.append(GeofenceResponse(**geofence_dict))

    return result


@router.post("/child/{child_id}", response_model=GeofenceResponse, status_code=status.HTTP_201_CREATED)
async def create_geofence(
    child_id: str,
    geofence_data: GeofenceCreate,
    current_parent: Parent = Depends(get_current_parent),
    db: Session = Depends(get_db)
):
    """Create a new geofence for a child"""
    child = db.query(Child).filter(
        Child.child_id == child_id,
        Child.parent_id == current_parent.parent_id
    ).first()

    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found"
        )

    # Validate geofence data
    if geofence_data.geofence_type == "CIRCLE" and not geofence_data.radius_meters:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="radius_meters is required for CIRCLE type geofence"
        )

    if geofence_data.geofence_type == "POLYGON":
        if not geofence_data.polygon_coordinates or len(geofence_data.polygon_coordinates) < 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="polygon_coordinates must have at least 3 points for POLYGON type"
            )

    new_geofence = Geofence(
        child_id=child.child_id,
        name=geofence_data.name,
        description=geofence_data.description,
        geofence_type=geofence_data.geofence_type,
        center_latitude=geofence_data.center_latitude,
        center_longitude=geofence_data.center_longitude,
        radius_meters=geofence_data.radius_meters,
        polygon_coordinates=json.dumps(geofence_data.polygon_coordinates) if geofence_data.polygon_coordinates else None,
        alert_on_entry=geofence_data.alert_on_entry,
        alert_on_exit=geofence_data.alert_on_exit,
        is_active=geofence_data.is_active,
    )

    db.add(new_geofence)
    db.commit()
    db.refresh(new_geofence)

    return GeofenceResponse(
        geofence_id=new_geofence.geofence_id,
        child_id=new_geofence.child_id,
        name=new_geofence.name,
        description=new_geofence.description,
        geofence_type=new_geofence.geofence_type.value,
        center_latitude=new_geofence.center_latitude,
        center_longitude=new_geofence.center_longitude,
        radius_meters=new_geofence.radius_meters,
        polygon_coordinates=json.loads(new_geofence.polygon_coordinates) if new_geofence.polygon_coordinates else None,
        alert_on_entry=new_geofence.alert_on_entry,
        alert_on_exit=new_geofence.alert_on_exit,
        is_active=new_geofence.is_active,
        created_at=new_geofence.created_at,
        updated_at=new_geofence.updated_at,
    )


@router.put("/{geofence_id}", response_model=GeofenceResponse)
async def update_geofence(
    geofence_id: str,
    geofence_data: GeofenceUpdate,
    current_parent: Parent = Depends(get_current_parent),
    db: Session = Depends(get_db)
):
    """Update a geofence"""
    geofence = db.query(Geofence).filter(Geofence.geofence_id == geofence_id).first()

    if not geofence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Geofence not found"
        )

    # Verify child belongs to current parent
    child = db.query(Child).filter(
        Child.child_id == geofence.child_id,
        Child.parent_id == current_parent.parent_id
    ).first()

    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Geofence not found"
        )

    # Update fields
    if geofence_data.name is not None:
        geofence.name = geofence_data.name
    if geofence_data.description is not None:
        geofence.description = geofence_data.description
    if geofence_data.center_latitude is not None:
        geofence.center_latitude = geofence_data.center_latitude
    if geofence_data.center_longitude is not None:
        geofence.center_longitude = geofence_data.center_longitude
    if geofence_data.radius_meters is not None:
        geofence.radius_meters = geofence_data.radius_meters
    if geofence_data.polygon_coordinates is not None:
        geofence.polygon_coordinates = json.dumps(geofence_data.polygon_coordinates)
    if geofence_data.alert_on_entry is not None:
        geofence.alert_on_entry = geofence_data.alert_on_entry
    if geofence_data.alert_on_exit is not None:
        geofence.alert_on_exit = geofence_data.alert_on_exit
    if geofence_data.is_active is not None:
        geofence.is_active = geofence_data.is_active

    geofence.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(geofence)

    return GeofenceResponse(
        geofence_id=geofence.geofence_id,
        child_id=geofence.child_id,
        name=geofence.name,
        description=geofence.description,
        geofence_type=geofence.geofence_type.value,
        center_latitude=geofence.center_latitude,
        center_longitude=geofence.center_longitude,
        radius_meters=geofence.radius_meters,
        polygon_coordinates=json.loads(geofence.polygon_coordinates) if geofence.polygon_coordinates else None,
        alert_on_entry=geofence.alert_on_entry,
        alert_on_exit=geofence.alert_on_exit,
        is_active=geofence.is_active,
        created_at=geofence.created_at,
        updated_at=geofence.updated_at,
    )


@router.delete("/{geofence_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_geofence(
    geofence_id: str,
    current_parent: Parent = Depends(get_current_parent),
    db: Session = Depends(get_db)
):
    """Delete a geofence"""
    geofence = db.query(Geofence).filter(Geofence.geofence_id == geofence_id).first()

    if not geofence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Geofence not found"
        )

    # Verify child belongs to current parent
    child = db.query(Child).filter(
        Child.child_id == geofence.child_id,
        Child.parent_id == current_parent.parent_id
    ).first()

    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Geofence not found"
        )

    db.delete(geofence)
    db.commit()


@router.get("/child/{child_id}/events", response_model=List[GeofenceEventResponse])
async def get_geofence_events(
    child_id: str,
    hours: int = Query(24, ge=1, le=168),  # Default: last 24 hours, max 1 week
    current_parent: Parent = Depends(get_current_parent),
    db: Session = Depends(get_db)
):
    """Get geofence events for a child"""
    from datetime import timedelta

    child = db.query(Child).filter(
        Child.child_id == child_id,
        Child.parent_id == current_parent.parent_id
    ).first()

    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found"
        )

    start_time = datetime.utcnow() - timedelta(hours=hours)
    events = db.query(GeofenceEvent).filter(
        GeofenceEvent.child_id == child_id,
        GeofenceEvent.timestamp >= start_time
    ).order_by(GeofenceEvent.timestamp.desc()).limit(100).all()

    result = []
    for event in events:
        geofence = db.query(Geofence).filter(Geofence.geofence_id == event.geofence_id).first()
        result.append(GeofenceEventResponse(
            event_id=event.event_id,
            geofence_id=event.geofence_id,
            child_id=event.child_id,
            location_id=event.location_id,
            event_type=event.event_type,
            latitude=event.latitude,
            longitude=event.longitude,
            timestamp=event.timestamp,
            geofence_name=geofence.name if geofence else None,
            child_name=child.name,
        ))

    return result

