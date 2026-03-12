from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.course import CourseStatus
from app.models.profile import Specialization

class LessonBase(BaseModel):
    title: str
    content: Optional[str] = None
    video_url: Optional[str] = None
    order: int = 0

class LessonCreate(LessonBase):
    pass

class LessonResponse(LessonBase):
    id: int
    course_id: int
    
    model_config = {"from_attributes": True}

class CourseBase(BaseModel):
    title: str
    description: str
    cover_url: Optional[str] = None
    specializations: Optional[List[Specialization]] = None
    duration_minutes: int = 0
    is_free: bool = True
    order: int = 0
    status: CourseStatus = CourseStatus.DRAFT

class CourseCreate(CourseBase):
    lessons: List[LessonCreate] = []

class CourseResponse(CourseBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    lessons: List[LessonResponse] = []
    
    model_config = {"from_attributes": True}

class CourseProgressUpdate(BaseModel):
    lesson_id: int
    completed: bool = True

class CourseProgressResponse(BaseModel):
    id: int
    course_id: int
    completed_lessons: List[int]
    started_at: datetime
    completed_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}
