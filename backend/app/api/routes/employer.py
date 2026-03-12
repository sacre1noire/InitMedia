from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.company import Company
from app.models.vacancy import Vacancy, VacancyStatus, VacancyType
from app.models.application import Application, ApplicationStatus
from app.models.profile import ApplicantProfile

from app.api.deps import get_current_user

from app.schemas.vacancy import VacancyCreate, VacancyResponse, VacancyUpdate
from app.schemas.application import ApplicationResponse
from pydantic import BaseModel

class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus

# TODO: Move to schemas if reused
class CandidateBrief(BaseModel):
    id: int
    full_name: str
    specialization: Optional[str]
    email: str

    class Config:
        from_attributes = True

router = APIRouter()

# --- Vacancies ---

@router.get("/vacancies", response_model=List[VacancyResponse])
def get_employer_vacancies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Мои вакансии"""
    if current_user.role != UserRole.EMPLOYER:
        raise HTTPException(status_code=403, detail="Только для работодателей")
    
    if not current_user.company:
        return []
        
    return db.query(Vacancy).filter(Vacancy.company_id == current_user.company.id).all()

@router.post("/vacancies", response_model=VacancyResponse)
def create_employer_vacancy(
    vacancy_in: VacancyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.EMPLOYER:
        raise HTTPException(status_code=403, detail="Только для работодателей")
        
    company = db.query(Company).filter(Company.owner_id == current_user.id).first()
    if not company:
        raise HTTPException(status_code=400, detail="Сначала создайте профиль компании")
        
    vacancy_data = vacancy_in.model_dump()
    
    # Remove fields that we are setting explicitly or want to override
    if 'company_id' in vacancy_data:
        del vacancy_data['company_id']
    if 'status' in vacancy_data:
        del vacancy_data['status']
        
    # We encountered issues with is_salary_hidden not being accepted by Vacancy contructor in some environments
    is_salary_hidden = vacancy_data.pop('is_salary_hidden', False)
    
    vacancy = Vacancy(
        **vacancy_data,
        is_salary_hidden=is_salary_hidden,
        company_id=company.id,
        status=VacancyStatus.ACTIVE 
    )
    db.add(vacancy)
    db.commit()
    db.refresh(vacancy)
    return vacancy

@router.put("/vacancies/{id}", response_model=VacancyResponse)
def update_employer_vacancy(
    id: int,
    vacancy_in: VacancyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.EMPLOYER:
        raise HTTPException(status_code=403, detail="Только для работодателей")
        
    vacancy = db.query(Vacancy).filter(
        Vacancy.id == id,
        Vacancy.company_id == current_user.company.id
    ).first()
    
    if not vacancy:
        raise HTTPException(status_code=404, detail="Вакансия не найдена")
        
    for field, value in vacancy_in.model_dump(exclude_unset=True).items():
        setattr(vacancy, field, value)
        
    db.commit()
    db.refresh(vacancy)
    return vacancy

@router.delete("/vacancies/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employer_vacancy(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.EMPLOYER:
        raise HTTPException(status_code=403, detail="Только для работодателей")
        
    vacancy = db.query(Vacancy).filter(
        Vacancy.id == id,
        Vacancy.company_id == current_user.company.id
    ).first()
    
    if not vacancy:
        raise HTTPException(status_code=404, detail="Вакансия не найдена")
        
    db.delete(vacancy)
    db.commit()

# --- Applications ---

@router.get("/applications", response_model=List[ApplicationResponse])
def get_employer_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Все отклики на мои вакансии"""
    if current_user.role != UserRole.EMPLOYER:
        raise HTTPException(status_code=403, detail="Только для работодателей")
    
    if not current_user.company:
        return []
        
    return db.query(Application).join(Vacancy).filter(
        Vacancy.company_id == current_user.company.id
    ).all()

@router.patch("/applications/{id}/status", response_model=ApplicationResponse)
def update_application_status(
    id: int,
    status_update: ApplicationStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.EMPLOYER:
        raise HTTPException(status_code=403, detail="Только для работодателей")
        
    application = db.query(Application).join(Vacancy).filter(
        Application.id == id,
        Vacancy.company_id == current_user.company.id
    ).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Отклик не найден")
        
    application.status = status_update.status
    db.commit()
    db.refresh(application)
    return application

# --- Candidates ---

@router.get("/candidates", response_model=List[CandidateBrief])
def search_candidates(
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.EMPLOYER:
        raise HTTPException(status_code=403, detail="Только для работодателей")
        
    # Search profiles based on name or skills
    query = db.query(ApplicantProfile).join(User)
    
    if search:
        query = query.filter(
            or_(
                ApplicantProfile.first_name.ilike(f"%{search}%"),
                ApplicantProfile.last_name.ilike(f"%{search}%"),
                ApplicantProfile.about.ilike(f"%{search}%")
            )
        )
        
    profiles = query.all()
    
    # Map to brief response
    results = []
    for p in profiles:
        results.append(CandidateBrief(
            id=p.user_id, # Using user_id as candidate ID for simplicity
            full_name=f"{p.first_name} {p.last_name}",
            specialization=str(p.specialization.value) if p.specialization else None,
            email=p.user.email
        ))
        
    return results

from app.schemas.candidate import CandidateDetail

@router.get("/candidates/{id}", response_model=CandidateDetail)
def get_candidate_detail(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.EMPLOYER:
        raise HTTPException(status_code=403, detail="Только для работодателей")
        
    profile = db.query(ApplicantProfile).filter(ApplicantProfile.user_id == id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Кандидат не найден")
        
    # Manually construct response or rely on schema matching
    return CandidateDetail(
        **{k: v for k, v in profile.__dict__.items() if k in CandidateDetail.model_fields},
        id=profile.id,
        user_id=profile.user_id,
        email=profile.user.email,
        schedule_preferences=profile.schedule_preferences, # JSON list
        employment_types=profile.employment_types # JSON list
    )
