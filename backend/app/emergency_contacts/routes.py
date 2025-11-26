from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.emergency_contacts.schemas import (
    EmergencyContactCreate,
    EmergencyContactResponse,
    EmergencyContactUpdate,
    EmergencyContactsListResponse,
)
from app.models.emergency_contact import EmergencyContact
from app.models.user import Parent, User

router = APIRouter(prefix="/api/emergency-contacts", tags=["emergency-contacts"])


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


@router.get("", response_model=EmergencyContactsListResponse)
async def list_emergency_contacts(
    current_parent: Parent = Depends(get_current_parent),
    db: Session = Depends(get_db)
):
    contacts = db.query(EmergencyContact).filter(
        EmergencyContact.parent_id == current_parent.parent_id
    ).order_by(EmergencyContact.priority.asc(), EmergencyContact.created_at.asc()).all()

    return EmergencyContactsListResponse(
        contacts=[
            EmergencyContactResponse(
                contact_id=str(contact.contact_id),
                parent_id=str(contact.parent_id),
                name=contact.name,
                phone_number=contact.phone_number,
                email=contact.email,
                priority=contact.priority,
                is_verified=contact.is_verified,
                created_at=contact.created_at,
                updated_at=contact.updated_at,
            )
            for contact in contacts
        ]
    )


@router.post("", response_model=EmergencyContactResponse, status_code=status.HTTP_201_CREATED)
async def create_emergency_contact(
    contact_data: EmergencyContactCreate,
    current_parent: Parent = Depends(get_current_parent),
    db: Session = Depends(get_db)
):
    new_contact = EmergencyContact(
        parent_id=current_parent.parent_id,
        name=contact_data.name,
        phone_number=contact_data.phone_number,
        email=contact_data.email,
        priority=contact_data.priority,
    )

    db.add(new_contact)
    db.commit()
    db.refresh(new_contact)

    return EmergencyContactResponse(
        contact_id=str(new_contact.contact_id),
        parent_id=str(new_contact.parent_id),
        name=new_contact.name,
        phone_number=new_contact.phone_number,
        email=new_contact.email,
        priority=new_contact.priority,
        is_verified=new_contact.is_verified,
        created_at=new_contact.created_at,
        updated_at=new_contact.updated_at,
    )


@router.put("/{contact_id}", response_model=EmergencyContactResponse)
async def update_emergency_contact(
    contact_id: str,
    contact_data: EmergencyContactUpdate,
    current_parent: Parent = Depends(get_current_parent),
    db: Session = Depends(get_db)
):
    contact = db.query(EmergencyContact).filter(
        EmergencyContact.contact_id == contact_id,
        EmergencyContact.parent_id == current_parent.parent_id
    ).first()

    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency contact not found"
        )

    if contact_data.name is not None:
        contact.name = contact_data.name
    if contact_data.phone_number is not None:
        contact.phone_number = contact_data.phone_number
    if contact_data.email is not None:
        contact.email = contact_data.email
    if contact_data.priority is not None:
        contact.priority = contact_data.priority
    if contact_data.is_verified is not None:
        contact.is_verified = contact_data.is_verified

    db.commit()
    db.refresh(contact)

    return EmergencyContactResponse(
        contact_id=str(contact.contact_id),
        parent_id=str(contact.parent_id),
        name=contact.name,
        phone_number=contact.phone_number,
        email=contact.email,
        priority=contact.priority,
        is_verified=contact.is_verified,
        created_at=contact.created_at,
        updated_at=contact.updated_at,
    )


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_emergency_contact(
    contact_id: str,
    current_parent: Parent = Depends(get_current_parent),
    db: Session = Depends(get_db)
):
    contact = db.query(EmergencyContact).filter(
        EmergencyContact.contact_id == contact_id,
        EmergencyContact.parent_id == current_parent.parent_id
    ).first()

    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency contact not found"
        )

    db.delete(contact)
    db.commit()

    return None


