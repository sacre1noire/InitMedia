from sqlalchemy import Column, Integer, String, ForeignKey, Enum, ARRAY, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.user import User
import enum

class Specialization(str, enum.Enum):
    PR = "PR"
    JOURNALISM = "Journalism"
    MEDIA_COM = "MediaCom"
    MARKETING = "Marketing"
    SMM = "SMM"

class SkillLevel(str, enum.Enum):
    NOVICE = "Novice"
    BEGINNER = "Beginner"
    CONFIDENT = "Confident"
    ADVANCED = "Advanced"

class EmploymentType(str, enum.Enum):
    INTERNSHIP = "internship"
    VACANCY = "vacancy"
    PROJECT = "project"

class SchedulePreference(str, enum.Enum):
    FULL_TIME = "full-time"
    PART_TIME = "part-time"
    REMOTE = "remote"
    OFFICE = "office"
    HYBRID = "hybrid"

class ApplicantProfile(Base):
    __tablename__ = "applicant_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    
    specialization = Column(Enum(Specialization), nullable=True)
    skill_level = Column(Enum(SkillLevel), nullable=True)
    
    # Using ARRAY for PostgreSQL, but need to be careful if user switches to SQLite
    # For MVP simplicity with potential SQLite local dev, storing as JSON might be safer, 
    # but plan explicitly says Postgres. I'll stick to Postgres specific types if possible
    # or use simple comma-separated strings if ARRAY is problematic. 
    # Let's try ARRAY of strings first.
    employment_types = Column(ARRAY(String), nullable=True) 
    schedule_preferences = Column(ARRAY(String), nullable=True)
    
    bio = Column(Text, nullable=True)
    city = Column(String, nullable=True)
    telegram = Column(String, nullable=True)
    portfolio_url = Column(String, nullable=True)

    user = relationship("User", back_populates="profile")

# Add relationship to User model
User.profile = relationship("ApplicantProfile", back_populates="user", uselist=False)
