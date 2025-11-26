from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.alerts.schemas import (
    AlertAcknowledgeResponse,
    AlertCreate,
    AlertListResponse,
    AlertResponse,
    AlertLocationPayload,
    EmergencyContactSummary,
)
from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.alert import Alert, AlertDistribution, AlertStatus, AlertType
from app.models.child import Child
from app.models.location import Location
from app.models.user import Parent, User

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


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


def map_alert_to_response(alert: Alert) -> AlertResponse:
    location_payload = None
    if alert.location:
        location_payload = AlertLocationPayload(
            latitude=alert.location.latitude,
            longitude=alert.location.longitude,
            accuracy=alert.location.accuracy,
            address=alert.location.address,
        )

    distribution_contacts: list[EmergencyContactSummary] = []
    if alert.alert_distribution:
        distribution_contacts = [
            EmergencyContactSummary(
                contact_id=str(contact.contact_id),
                name=contact.name,
            )
            for contact in alert.alert_distribution.emergency_contacts
        ]

    return AlertResponse(
        alert_id=str(alert.alert_id),
        child_id=str(alert.child_id),
        child_name=alert.child_name,
        alert_type=alert.alert_type,
        status=alert.status,
        message=alert.message,
        timestamp=alert.timestamp,
        acknowledged_at=alert.acknowledged_at,
        location=location_payload,
        distribution_contacts=distribution_contacts,
    )


@router.post("", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
async def create_alert(
    alert_data: AlertCreate,
    current_parent: Parent = Depends(get_current_parent),
    db: Session = Depends(get_db)
):
    child = db.query(Child).filter(
        Child.child_id == alert_data.child_id,
        Child.parent_id == current_parent.parent_id
    ).first()

    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found for this parent"
        )

    resolved_location = None
    if alert_data.location_id:
        resolved_location = db.query(Location).filter(
            Location.location_id == alert_data.location_id,
            Location.child_id == child.child_id
        ).first()
        if not resolved_location:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Location not found for this child"
            )
    elif alert_data.location:
        resolved_location = Location(
            child_id=child.child_id,
            latitude=alert_data.location.latitude,
            longitude=alert_data.location.longitude,
            accuracy=alert_data.location.accuracy,
            address=alert_data.location.address,
            timestamp=datetime.utcnow()
        )
        db.add(resolved_location)
        db.flush()
    else:
        resolved_location = db.query(Location).filter(
            Location.child_id == child.child_id
        ).order_by(Location.timestamp.desc()).first()

    new_alert = Alert(
        child_id=child.child_id,
        child_name=child.name,
        alert_type=alert_data.alert_type,
        status=AlertStatus.PENDING,
        message=alert_data.message,
        location_id=resolved_location.location_id if resolved_location else None,
        timestamp=datetime.utcnow()
    )
    db.add(new_alert)
    db.flush()

    parent_contacts = current_parent.emergency_contacts
    if parent_contacts:
        distribution = AlertDistribution(alert_id=new_alert.alert_id)
        distribution.emergency_contacts = parent_contacts
        db.add(distribution)

    db.commit()
    db.refresh(new_alert)

    return map_alert_to_response(new_alert)


@router.get("", response_model=AlertListResponse)
async def list_alerts(
    status_filter: AlertStatus | None = Query(None, description="Filter alerts by status"),
    limit: int = Query(50, ge=1, le=200),
    current_parent: Parent = Depends(get_current_parent),
    db: Session = Depends(get_db)
):
    query = db.query(Alert).join(Child).filter(
        Child.parent_id == current_parent.parent_id
    )

    if status_filter:
        query = query.filter(Alert.status == status_filter)

    alerts = query.order_by(Alert.timestamp.desc()).limit(limit).all()

    return AlertListResponse(alerts=[map_alert_to_response(alert) for alert in alerts])


@router.post("/{alert_id}/acknowledge", response_model=AlertAcknowledgeResponse)
async def acknowledge_alert(
    alert_id: str,
    current_parent: Parent = Depends(get_current_parent),
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).join(Child).filter(
        Alert.alert_id == alert_id,
        Child.parent_id == current_parent.parent_id
    ).first()

    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )

    alert.status = AlertStatus.ACKNOWLEDGED
    alert.acknowledged_at = datetime.utcnow()
    db.commit()
    db.refresh(alert)

    return AlertAcknowledgeResponse(
        alert_id=str(alert.alert_id),
        status=alert.status,
        acknowledged_at=alert.acknowledged_at,
    )


