from sqlalchemy import Column, Integer, String, ForeignKey, Enum, Boolean, Text, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from sqlalchemy import ARRAY

class ResumeTemplate(Base):
    __tablename__ = "resume_templates"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    preview_url = Column(String, nullable=True)
    structure = Column(JSON, nullable=True)
    specializations = Column(ARRAY(String), nullable=True) # Postgres specific, JSON otherwise
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class Resume(Base):
    __tablename__ = "resumes"
    id = Column(Integer, primary_key=True, index=True)
    applicant_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    template_id = Column(Integer, ForeignKey("resume_templates.id"), nullable=True) # Optional for now
    
    title = Column(String, nullable=False)
    content = Column(JSON, nullable=True)
    is_primary = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    applicant = relationship("User", back_populates="resumes")
    template = relationship("ResumeTemplate")
    applications = relationship("Application", back_populates="resume")

# Add to User
# User.resumes = relationship("Resume", back_populates="applicant")
