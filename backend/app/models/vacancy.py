from sqlalchemy import Column, Integer, String, ForeignKey, Enum, Boolean, Text, DateTime, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.models.profile import Specialization, EmploymentType, SchedulePreference
import enum

class VacancyType(str, enum.Enum):
    INTERNSHIP = "internship"
    VACANCY = "vacancy"
    PROJECT = "project"

class VacancyStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"
    MODERATION = "moderation"

class Vacancy(Base):
    __tablename__ = "vacancies"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=False)
    requirements = Column(Text, nullable=True)
    
    type = Column(Enum(VacancyType), default=VacancyType.VACANCY, nullable=False)
    specialization = Column(Enum(Specialization), nullable=False)
    schedule = Column(Enum(SchedulePreference), nullable=True)
    
    salary_from = Column(Integer, nullable=True)
    salary_to = Column(Integer, nullable=True)
    is_salary_hidden = Column(Boolean, default=False)
    
    city = Column(String, nullable=True)
    is_remote = Column(Boolean, default=False)
    
    status = Column(Enum(VacancyStatus), default=VacancyStatus.DRAFT, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    company = relationship("Company", back_populates="vacancies")
    applications = relationship("Application", back_populates="vacancy")
