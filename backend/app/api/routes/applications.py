from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.application import Application, ApplicationStatus
from app.api.deps import get_current_user
from app.models.user import User, UserRole
from app.schemas.application import ApplicationResponse

router = APIRouter()

@router.get("/my", response_model=List[ApplicationResponse])
def get_my_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Получить все мои отклики (для соискателя)
    """
    if current_user.role != UserRole.APPLICANT:
        raise HTTPException(status_code=403, detail="Только для соискателей")
        
    applications = db.query(Application).filter(
        Application.applicant_id == current_user.id
    ).all()
    
    return applications

@router.delete("/{id}", response_model=dict)
def delete_application(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Отменить отклик
    """
    application = db.query(Application).filter(
        Application.id == id,
        Application.applicant_id == current_user.id
    ).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Отклик не найден")
        
    db.delete(application)
    db.commit()
    
    return {"message": "Отклик успешно отменен"}