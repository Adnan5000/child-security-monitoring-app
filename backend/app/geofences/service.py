import json
import math
from typing import Optional, Tuple
from app.models.geofence import Geofence, GeofenceType
from app.models.location import Location
from app.models.child import Child
from app.models.alert import Alert, AlertType, AlertStatus
from app.models.geofence import GeofenceEvent
from sqlalchemy.orm import Session
from datetime import datetime


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points in meters using Haversine formula"""
    R = 6371000  # Earth radius in meters
    
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi / 2) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c


def point_in_polygon(lat: float, lon: float, polygon: list) -> bool:
    """Check if a point is inside a polygon using ray casting algorithm"""
    if not polygon or len(polygon) < 3:
        return False
    
    inside = False
    j = len(polygon) - 1
    
    for i in range(len(polygon)):
        xi, yi = polygon[i]
        xj, yj = polygon[j]
        
        if ((yi > lon) != (yj > lon)) and (lat < (xj - xi) * (lon - yi) / (yj - yi) + xi):
            inside = not inside
        j = i
    
    return inside


def is_location_in_geofence(lat: float, lon: float, geofence: Geofence) -> bool:
    """Check if a location is inside a geofence"""
    if not geofence.is_active:
        return False
    
    if geofence.geofence_type == GeofenceType.CIRCLE:
        if not geofence.radius_meters:
            return False
        distance = calculate_distance(
            lat, lon,
            geofence.center_latitude,
            geofence.center_longitude
        )
        return distance <= geofence.radius_meters
    
    elif geofence.geofence_type == GeofenceType.POLYGON:
        if not geofence.polygon_coordinates:
            return False
        try:
            polygon = json.loads(geofence.polygon_coordinates)
            return point_in_polygon(lat, lon, polygon)
        except (json.JSONDecodeError, TypeError):
            return False
    
    return False


def check_geofence_transitions(
    child_id: str,
    lat: float,
    lon: float,
    location_id: Optional[str],
    db: Session
) -> Tuple[list, list]:
    """
    Check if location triggers any geofence entry/exit events.
    Returns (entry_events, exit_events) lists of Geofence objects.
    """
    # Get all active geofences for this child
    geofences = db.query(Geofence).filter(
        Geofence.child_id == child_id,
        Geofence.is_active == True
    ).all()
    
    entry_events = []
    exit_events = []
    
    for geofence in geofences:
        is_inside = is_location_in_geofence(lat, lon, geofence)
        
        # Get the last location for this child to determine previous state
        last_location = db.query(Location).filter(
            Location.child_id == child_id
        ).order_by(Location.timestamp.desc()).first()
        
        was_inside = False
        if last_location and last_location.location_id != location_id:
            was_inside = is_location_in_geofence(
                last_location.latitude,
                last_location.longitude,
                geofence
            )
        
        # Check for entry
        if is_inside and not was_inside and geofence.alert_on_entry:
            entry_events.append(geofence)
        
        # Check for exit
        if not is_inside and was_inside and geofence.alert_on_exit:
            exit_events.append(geofence)
    
    return entry_events, exit_events


def create_geofence_event(
    geofence: Geofence,
    child: Child,
    location_id: Optional[str],
    event_type: str,
    lat: float,
    lon: float,
    db: Session
) -> GeofenceEvent:
    """Create a geofence event record"""
    event = GeofenceEvent(
        geofence_id=geofence.geofence_id,
        child_id=child.child_id,
        location_id=location_id,
        event_type=event_type,
        latitude=lat,
        longitude=lon,
        timestamp=datetime.utcnow()
    )
    db.add(event)
    return event


def create_geofence_alert(
    geofence: Geofence,
    child: Child,
    location_id: Optional[str],
    event_type: str,
    db: Session
) -> Alert:
    """Create an alert for geofence entry/exit"""
    alert_type = AlertType.GEOFENCE_ENTRY if event_type == "ENTRY" else AlertType.GEOFENCE_EXIT
    message = f"Child {'entered' if event_type == 'ENTRY' else 'exited'} geofence: {geofence.name}"
    
    alert = Alert(
        child_id=child.child_id,
        child_name=child.name,
        alert_type=alert_type,
        status=AlertStatus.PENDING,
        message=message,
        location_id=location_id,
        timestamp=datetime.utcnow()
    )
    db.add(alert)
    return alert

