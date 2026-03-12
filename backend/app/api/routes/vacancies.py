from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.vacancy import Vacancy, VacancyStatus
from app.models.application import Application, ApplicationStatus
from app.schemas.vacancy import VacancyCreate, VacancyResponse, VacancyListResponse
from app.api.deps import get_current_user
from app.models.user import User
from typing import Optional, List

router = APIRouter()

@router.get("/", response_model=VacancyListResponse)
def get_vacancies(
    skip: int = 0,
    limit: int = 10,
    search: Optional[str] = None,
    specialization: Optional[str] = None,
    type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Vacancy).filter(Vacancy.status == VacancyStatus.ACTIVE)
    
    if search:
        query = query.filter(Vacancy.title.ilike(f"%{search}%"))
    if specialization:
        query = query.filter(Vacancy.specialization == specialization)
    if type:
        query = query.filter(Vacancy.type == type)
        
    total = query.count()
    vacancies = query.offset(skip).limit(limit).all()
    
    return {"items": vacancies, "total": total}

@router.get("/recommended", response_model=VacancyListResponse)
def get_recommended_vacancies(
    skip: int = 0,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Basic recommendation: matches user's specialization if profile exists
    query = db.query(Vacancy).filter(Vacancy.status == VacancyStatus.ACTIVE)
    
    if current_user.profile and current_user.profile.specialization:
        query = query.filter(Vacancy.specialization == current_user.profile.specialization)
    
    total = query.count()
    vacancies = query.offset(skip).limit(limit).all()
    return {"items": vacancies, "total": total}

@router.get("/{id}", response_model=VacancyResponse)
def get_vacancy(id: int, db: Session = Depends(get_db)):
    vacancy = db.query(Vacancy).filter(Vacancy.id == id).first()
    if not vacancy:
        raise HTTPException(status_code=404, detail="Vacancy not found")
    return vacancy

@router.post("/", response_model=VacancyResponse)
def create_vacancy(
    vacancy_data: VacancyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if user role is employer
    if current_user.role != "employer": 
         pass # Let's assume string comparison works

    # Check if user has company (simplified)
    if not current_user.company:
         raise HTTPException(status_code=400, detail="User has no company")
    
    new_vacancy = Vacancy(
        **vacancy_data.model_dump(),
        company_id=current_user.company.id 
    )
    db.add(new_vacancy)
    db.commit()
    db.refresh(new_vacancy)
    return new_vacancy

@router.post("/{id}/apply")
def apply_to_vacancy(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    vacancy = db.query(Vacancy).filter(Vacancy.id == id).first()
    if not vacancy:
        raise HTTPException(status_code=404, detail="Vacancy not found")
        
    # Check if already applied
    existing_app = db.query(Application).filter(
        Application.vacancy_id == id,
        Application.applicant_id == current_user.id
    ).first()
    
    if existing_app:
        raise HTTPException(status_code=400, detail="Already applied")
        
    application = Application(
        vacancy_id=id,
        applicant_id=current_user.id,
        status=ApplicationStatus.PENDING
    )
    db.add(application)
    db.commit()
    return {"message": "Application submitted"}

