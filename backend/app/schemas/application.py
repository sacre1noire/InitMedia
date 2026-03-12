from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.application import ApplicationStatus
from app.schemas.vacancy import VacancyResponse

class ApplicationBase(BaseModel):
    vacancy_id: int
    cover_letter: Optional[str] = None
    resume_id: Optional[int] = None

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationResponse(BaseModel):
    id: int
    status: ApplicationStatus
    created_at: datetime
    updated_at: Optional[datetime]
    vacancy: VacancyResponse

    class Config:
        from_attributes = True
