from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.devices.schemas import DeviceStatusListResponse, DeviceStatusResponse, DeviceStatusUpdate
from app.models.child import Child
from app.models.device import DeviceStatus as DeviceStatusModel
from app.models.user import Parent, User

router = APIRouter(prefix="/api/devices", tags=["devices"])


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


@router.get("/status", response_model=DeviceStatusListResponse)
async def list_device_statuses(
    current_parent: Parent = Depends(get_current_parent),
    db: Session = Depends(get_db)
):
    statuses = db.query(DeviceStatusModel).join(Child).filter(
        Child.parent_id == current_parent.parent_id
    ).order_by(DeviceStatusModel.last_update.desc()).all()

    return DeviceStatusListResponse(
        devices=[
            DeviceStatusResponse(
                child_id=str(status.child_id),
                device_id=status.device_id,
                battery_level=status.battery_level,
                network_status=status.network_status,
                app_status=status.app_status,
                last_update=status.last_update,
                updated_at=status.updated_at,
            )
            for status in statuses
        ]
    )


@router.get("/child/{child_id}/status", response_model=DeviceStatusResponse)
async def get_device_status(
    child_id: str,
    current_parent: Parent = Depends(get_current_parent),
    db: Session = Depends(get_db)
):
    child = db.query(Child).filter(
        Child.child_id == child_id,
        Child.parent_id == current_parent.parent_id
    ).first()

    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found"
        )

    status_record = child.device_status
    if not status_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device status not found for this child"
        )

    return DeviceStatusResponse(
        child_id=str(status_record.child_id),
        device_id=status_record.device_id,
        battery_level=status_record.battery_level,
        network_status=status_record.network_status,
        app_status=status_record.app_status,
        last_update=status_record.last_update,
        updated_at=status_record.updated_at,
    )


@router.put("/child/{child_id}/status", response_model=DeviceStatusResponse)
async def upsert_device_status(
    child_id: str,
    status_data: DeviceStatusUpdate,
    current_parent: Parent = Depends(get_current_parent),
    db: Session = Depends(get_db)
):
    child = db.query(Child).filter(
        Child.child_id == child_id,
        Child.parent_id == current_parent.parent_id
    ).first()

    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found"
        )

    status_record = child.device_status
    now = datetime.utcnow()

    if status_record:
        if status_data.device_id is not None:
            status_record.device_id = status_data.device_id
        elif not status_record.device_id:
            status_record.device_id = child.device_id

        if status_data.battery_level is not None:
            status_record.battery_level = status_data.battery_level
        if status_data.network_status is not None:
            status_record.network_status = status_data.network_status
        if status_data.app_status is not None:
            status_record.app_status = status_data.app_status

        status_record.last_update = now
    else:
        status_record = DeviceStatusModel(
            child_id=child.child_id,
            device_id=status_data.device_id or child.device_id,
            battery_level=status_data.battery_level,
            network_status=status_data.network_status,
            app_status=status_data.app_status,
            last_update=now,
        )
        db.add(status_record)

    db.commit()
    db.refresh(status_record)

    return DeviceStatusResponse(
        child_id=str(status_record.child_id),
        device_id=status_record.device_id,
        battery_level=status_record.battery_level,
        network_status=status_record.network_status,
        app_status=status_record.app_status,
        last_update=status_record.last_update,
        updated_at=status_record.updated_at,
    )


