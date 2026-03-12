from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.profile import Specialization, SchedulePreference
from app.models.vacancy import VacancyType, VacancyStatus
from app.schemas.company import CompanyResponse

class VacancyBase(BaseModel):
    title: str
    description: str
    requirements: Optional[str] = None
    type: VacancyType
    specialization: Specialization
    schedule: Optional[SchedulePreference] = None
    salary_from: Optional[int] = None
    salary_to: Optional[int] = None
    is_salary_hidden: bool = False
    city: Optional[str] = None
    is_remote: bool = False
    status: VacancyStatus = VacancyStatus.DRAFT

class VacancyCreate(VacancyBase):
    company_id: int

class VacancyUpdate(VacancyBase):
    pass

class VacancyResponse(VacancyBase):
    id: int
    company_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    company: Optional[CompanyResponse] = None
    
    model_config = {"from_attributes": True}

class VacancyListResponse(BaseModel):
    items: list[VacancyResponse]
    total: int
