from sqlalchemy import Column, Integer, String, ForeignKey, Enum, Boolean, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class CompanySize(str, enum.Enum):
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    name = Column(String, nullable=False, index=True)
    logo_url = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    industry = Column(String, nullable=True)
    website = Column(String, nullable=True)
    city = Column(String, nullable=True)
    
    size = Column(Enum(CompanySize), nullable=True)
    
    career_opportunities = Column(Text, nullable=True)
    requirements_description = Column(Text, nullable=True)
    
    is_verified = Column(Boolean, default=False, nullable=False)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="company")
    vacancies = relationship("Vacancy", back_populates="company")

# Add to User model
# User.company = relationship("Company", back_populates="owner", uselist=False)
