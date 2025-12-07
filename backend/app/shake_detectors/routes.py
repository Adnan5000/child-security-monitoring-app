from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, Parent
from app.models.child import Child
from app.models.shake_detector import ShakeDetector
from app.shake_detectors.schemas import (
    ShakeDetectorCreate,
    ShakeDetectorUpdate,
    ShakeDetectorResponse,
    ShakeDetectorListResponse
)
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/shake-detectors", tags=["shake-detectors"])


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


@router.get("", response_model=ShakeDetectorListResponse)
async def list_shake_detectors(
    current_parent: Parent = Depends(get_current_parent),
    db: Session = Depends(get_db)
):
    """Get all shake detector configurations for the current parent's children"""
    detectors = db.query(ShakeDetector).join(Child).filter(
        Child.parent_id == current_parent.parent_id
    ).all()
    
    return ShakeDetectorListResponse(
        detectors=[
            ShakeDetectorResponse(
                detector_id=str(detector.detector_id),
                child_id=str(detector.child_id),
                sensitivity=detector.sensitivity,
                threshold=detector.threshold,
                is_enabled=detector.is_enabled,
                created_at=detector.created_at,
                updated_at=detector.updated_at
            )
            for detector in detectors
        ]
    )


@router.get("/child/{child_id}", response_model=ShakeDetectorResponse)
async def get_shake_detector(
    child_id: str,
    current_parent: Parent = Depends(get_current_parent),
    db: Session = Depends(get_db)
):
    """Get shake detector configuration for a specific child"""
    child = db.query(Child).filter(
        Child.child_id == child_id,
        Child.parent_id == current_parent.parent_id
    ).first()
    
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found"
        )
    
    detector = child.shake_detector
    if not detector:
        # Create default detector if it doesn't exist
        detector = ShakeDetector(
            child_id=child.child_id,
            sensitivity=1.5,
            threshold=2.0,
            is_enabled=True
        )
        db.add(detector)
        db.commit()
        db.refresh(detector)
    
    return ShakeDetectorResponse(
        detector_id=str(detector.detector_id),
        child_id=str(detector.child_id),
        sensitivity=detector.sensitivity,
        threshold=detector.threshold,
        is_enabled=detector.is_enabled,
        created_at=detector.created_at,
        updated_at=detector.updated_at
    )


@router.post("/child/{child_id}", response_model=ShakeDetectorResponse, status_code=status.HTTP_201_CREATED)
async def create_shake_detector(
    child_id: str,
    detector_data: ShakeDetectorCreate,
    current_parent: Parent = Depends(get_current_parent),
    db: Session = Depends(get_db)
):
    """Create shake detector configuration for a child"""
    child = db.query(Child).filter(
        Child.child_id == child_id,
        Child.parent_id == current_parent.parent_id
    ).first()
    
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found"
        )
    
    # Check if detector already exists
    existing = child.shake_detector
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Shake detector already exists for this child. Use PUT to update."
        )
    
    new_detector = ShakeDetector(
        child_id=child.child_id,
        sensitivity=detector_data.sensitivity,
        threshold=detector_data.threshold,
        is_enabled=detector_data.is_enabled
    )
    
    db.add(new_detector)
    db.commit()
    db.refresh(new_detector)
    
    return ShakeDetectorResponse(
        detector_id=str(new_detector.detector_id),
        child_id=str(new_detector.child_id),
        sensitivity=new_detector.sensitivity,
        threshold=new_detector.threshold,
        is_enabled=new_detector.is_enabled,
        created_at=new_detector.created_at,
        updated_at=new_detector.updated_at
    )


@router.put("/child/{child_id}", response_model=ShakeDetectorResponse)
async def update_shake_detector(
    child_id: str,
    detector_data: ShakeDetectorUpdate,
    current_parent: Parent = Depends(get_current_parent),
    db: Session = Depends(get_db)
):
    """Update shake detector configuration for a child"""
    child = db.query(Child).filter(
        Child.child_id == child_id,
        Child.parent_id == current_parent.parent_id
    ).first()
    
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found"
        )
    
    detector = child.shake_detector
    if not detector:
        # Create with defaults if it doesn't exist
        detector = ShakeDetector(
            child_id=child.child_id,
            sensitivity=detector_data.sensitivity or 1.5,
            threshold=detector_data.threshold or 2.0,
            is_enabled=detector_data.is_enabled if detector_data.is_enabled is not None else True
        )
        db.add(detector)
    else:
        # Update existing detector
        if detector_data.sensitivity is not None:
            detector.sensitivity = detector_data.sensitivity
        if detector_data.threshold is not None:
            detector.threshold = detector_data.threshold
        if detector_data.is_enabled is not None:
            detector.is_enabled = detector_data.is_enabled
    
    db.commit()
    db.refresh(detector)
    
    return ShakeDetectorResponse(
        detector_id=str(detector.detector_id),
        child_id=str(detector.child_id),
        sensitivity=detector.sensitivity,
        threshold=detector.threshold,
        is_enabled=detector.is_enabled,
        created_at=detector.created_at,
        updated_at=detector.updated_at
    )


@router.delete("/child/{child_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_shake_detector(
    child_id: str,
    current_parent: Parent = Depends(get_current_parent),
    db: Session = Depends(get_db)
):
    """Delete shake detector configuration for a child"""
    child = db.query(Child).filter(
        Child.child_id == child_id,
        Child.parent_id == current_parent.parent_id
    ).first()
    
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found"
        )
    
    detector = child.shake_detector
    if not detector:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shake detector not found for this child"
        )
    
    db.delete(detector)
    db.commit()
    
    return None

