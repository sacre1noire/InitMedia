from sqlalchemy import Boolean, Column, Integer, String, DateTime, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base


class UserRole(str, enum.Enum):
    """Роли пользователей"""
    APPLICANT = "applicant"  # Соискатель
    EMPLOYER = "employer"   # Работодатель
    ADMIN = "admin"         # Администратор


class User(Base):
    """Модель пользователя"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.APPLICANT, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    profile = relationship("ApplicantProfile", back_populates="user", uselist=False)
    company = relationship("Company", back_populates="owner", uselist=False)
    resumes = relationship("Resume", back_populates="applicant")
    applications = relationship("Application", back_populates="applicant")
    course_progress = relationship("app.models.course.CourseProgress", back_populates="user")

