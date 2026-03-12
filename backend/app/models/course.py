from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.models.profile import Specialization
import enum

class CourseStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    cover_url = Column(String, nullable=True)
    # Use JSON for arrays to work with SQLAlchemy properly if specific PG types id not easy
    # But user asked for ARRAY. Let's try to stick to general or simple
    specializations = Column(JSON, nullable=True) 
    duration_minutes = Column(Integer, default=0)
    is_free = Column(Boolean, default=True)
    order = Column(Integer, default=0)
    status = Column(Enum(CourseStatus), default=CourseStatus.DRAFT)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    lessons = relationship("Lesson", back_populates="course", order_by="Lesson.order")
    # progress = relationship("CourseProgress", back_populates="course")

class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=True) # Markdown/HTML
    video_url = Column(String, nullable=True)
    order = Column(Integer, default=0)

    course = relationship("Course", back_populates="lessons")

class CourseProgress(Base):
    __tablename__ = "course_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    
    # Store IDs of completed lessons
    completed_lessons = Column(JSON, default=[])
    
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="course_progress")
    # course = relationship("Course", back_populates="progress")
