from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from app.database import get_db
from app.models.user import User, Parent
from app.models.child import Child
from app.children.schemas import ChildCreate, ChildUpdate, ChildResponse
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/children", tags=["children"])


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


@router.post("", response_model=ChildResponse, status_code=status.HTTP_201_CREATED)
async def create_child(
    child_data: ChildCreate,
    current_parent: Parent = Depends(get_current_parent),
    db: Session = Depends(get_db)
):
    """Create a new child profile"""
    # Check if device_id is already in use (if provided)
    if child_data.device_id:
        existing_child = db.query(Child).filter(
            Child.device_id == child_data.device_id
        ).first()
        if existing_child:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Device ID already in use"
            )
    
    # Create new child
    new_child = Child(
        parent_id=current_parent.parent_id,
        name=child_data.name,
        age=child_data.age,
        device_id=child_data.device_id,
        is_active=True
    )
    
    db.add(new_child)
    
    try:
        db.commit()
        db.refresh(new_child)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error creating child profile"
        )
    
    return ChildResponse(
        child_id=str(new_child.child_id),
        parent_id=str(new_child.parent_id),
        name=new_child.name,
        age=new_child.age,
        device_id=new_child.device_id,
        is_active=new_child.is_active,
        created_at=new_child.created_at,
        updated_at=new_child.updated_at
    )


@router.get("", response_model=List[ChildResponse])
async def get_children(
    current_parent: Parent = Depends(get_current_parent),
    db: Session = Depends(get_db)
):
    """Get all children for the current parent"""
    children = db.query(Child).filter(
        Child.parent_id == current_parent.parent_id
    ).order_by(Child.created_at.desc()).all()
    
    return [
        ChildResponse(
            child_id=str(child.child_id),
            parent_id=str(child.parent_id),
            name=child.name,
            age=child.age,
            device_id=child.device_id,
            is_active=child.is_active,
            created_at=child.created_at,
            updated_at=child.updated_at
        )
        for child in children
    ]


@router.get("/{child_id}", response_model=ChildResponse)
async def get_child(
    child_id: str,
    current_parent: Parent = Depends(get_current_parent),
    db: Session = Depends(get_db)
):
    """Get a specific child by ID"""
    child = db.query(Child).filter(
        Child.child_id == child_id,
        Child.parent_id == current_parent.parent_id
    ).first()
    
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found"
        )
    
    return ChildResponse(
        child_id=str(child.child_id),
        parent_id=str(child.parent_id),
        name=child.name,
        age=child.age,
        device_id=child.device_id,
        is_active=child.is_active,
        created_at=child.created_at,
        updated_at=child.updated_at
    )


@router.put("/{child_id}", response_model=ChildResponse)
async def update_child(
    child_id: str,
    child_data: ChildUpdate,
    current_parent: Parent = Depends(get_current_parent),
    db: Session = Depends(get_db)
):
    """Update a child's information"""
    child = db.query(Child).filter(
        Child.child_id == child_id,
        Child.parent_id == current_parent.parent_id
    ).first()
    
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found"
        )
    
    # Check if device_id is already in use by another child (if being updated)
    if child_data.device_id and child_data.device_id != child.device_id:
        existing_child = db.query(Child).filter(
            Child.device_id == child_data.device_id,
            Child.child_id != child_id
        ).first()
        if existing_child:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Device ID already in use"
            )
    
    # Update fields
    if child_data.name is not None:
        child.name = child_data.name
    if child_data.age is not None:
        child.age = child_data.age
    if child_data.device_id is not None:
        child.device_id = child_data.device_id
    if child_data.is_active is not None:
        child.is_active = child_data.is_active
    
    try:
        db.commit()
        db.refresh(child)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error updating child profile"
        )
    
    return ChildResponse(
        child_id=str(child.child_id),
        parent_id=str(child.parent_id),
        name=child.name,
        age=child.age,
        device_id=child.device_id,
        is_active=child.is_active,
        created_at=child.created_at,
        updated_at=child.updated_at
    )


@router.delete("/{child_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_child(
    child_id: str,
    current_parent: Parent = Depends(get_current_parent),
    db: Session = Depends(get_db)
):
    """Delete a child profile"""
    child = db.query(Child).filter(
        Child.child_id == child_id,
        Child.parent_id == current_parent.parent_id
    ).first()
    
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found"
        )
    
    db.delete(child)
    db.commit()
    
    return None

