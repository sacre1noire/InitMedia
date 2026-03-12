from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.profile import ApplicantProfile, SkillLevel, Specialization
from app.schemas.profile import ProfileUpdate, ProfileResponse
from app.api.deps import get_current_user
from typing import List

router = APIRouter()

@router.get("/me", response_model=ProfileResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить профиль текущего пользователя"""
    profile = db.query(ApplicantProfile).filter(ApplicantProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    return profile

@router.put("/me", response_model=ProfileResponse)
def update_my_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Обновить или создать профиль текущего пользователя"""
    profile = db.query(ApplicantProfile).filter(ApplicantProfile.user_id == current_user.id).first()
    
    if not profile:
        # Create new profile
        profile = ApplicantProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    
    # Update fields
    # Using exclude_unset=True to only update fields that were sent
    update_data = profile_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(profile, field, value)
        
    db.commit()
    db.refresh(profile)
    return profile

@router.patch("/me/avatar", response_model=ProfileResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Загрузить аватар (заглушка)"""
    # In a real app, upload to S3 or local storage and get URL
    # For MVP, just simulate
    fake_url = f"/static/avatars/{current_user.id}_{file.filename}"
    
    profile = db.query(ApplicantProfile).filter(ApplicantProfile.user_id == current_user.id).first()
    if not profile:
        profile = ApplicantProfile(user_id=current_user.id)
        db.add(profile)
    
    profile.avatar_url = fake_url
    db.commit()
    db.refresh(profile)
    return profile
