from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.models.course import Course, Lesson, CourseProgress, CourseStatus
from app.models.user import User
from app.api.deps import get_current_user
from app.schemas.course import CourseResponse, CourseCreate, LessonResponse, CourseBase, LessonCreate
from app.models.course import CourseStatus
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Temporary Pydantic models in file to fix circular or missing imports if schemas not fully there or complex
class CourseProgressResponse(BaseModel):
    id: int
    user_id: int
    course_id: int
    completed_lessons: list[int]
    started_at: datetime
    completed_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}

class CourseProgressUpdate(BaseModel):
    lesson_id: int
    completed: bool = True

router = APIRouter()

@router.get("/", response_model=List[CourseResponse])
def get_courses(
    skip: int = 0, 
    limit: int = 20, 
    db: Session = Depends(get_db)
):
    """Список курсов"""
    return db.query(Course).filter(Course.status == CourseStatus.PUBLISHED).order_by(Course.order).offset(skip).limit(limit).all()

@router.get("/my-progress", response_model=List[CourseProgressResponse])
def get_my_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Прогресс пользователя"""
    return db.query(CourseProgress).filter(CourseProgress.user_id == current_user.id).all()

@router.get("/{id}", response_model=CourseResponse)
def get_course_details(
    id: int, 
    db: Session = Depends(get_db)
):
    """Детали курса"""
    course = db.query(Course).filter(Course.id == id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

@router.get("/{id}/lessons/{lesson_id}", response_model=LessonResponse)
def get_lesson(
    id: int,
    lesson_id: int,
    current_user: User = Depends(get_current_user), # Ensure only logged in
    db: Session = Depends(get_db)
):
    """Получить урок"""
    course = db.query(Course).filter(Course.id == id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id, Lesson.course_id == id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    # Auto-start course if not started? Or require explicit start. Let's create progress if missing.
    progress = db.query(CourseProgress).filter(
        CourseProgress.course_id == id, 
        CourseProgress.user_id == current_user.id
    ).first()
    
    if not progress:
        progress = CourseProgress(
            user_id=current_user.id,
            course_id=id,
            completed_lessons=[]
        )
        db.add(progress)
        db.commit()
    
    return lesson

@router.post("/{id}/start", response_model=CourseProgressResponse)
def start_course(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Начать прохождение курса"""
    course = db.query(Course).filter(Course.id == id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
        
    progress = db.query(CourseProgress).filter(
        CourseProgress.course_id == id,
        CourseProgress.user_id == current_user.id
    ).first()
    
    if not progress:
        progress = CourseProgress(
            user_id=current_user.id,
            course_id=id,
            completed_lessons=[]
        )
        db.add(progress)
        db.commit()
        db.refresh(progress)
        
    return progress

@router.post("/{id}/lessons/{lesson_id}/complete")
def complete_lesson(
    id: int,
    lesson_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Отметить урок как пройденный"""
    progress = db.query(CourseProgress).filter(
        CourseProgress.course_id == id,
        CourseProgress.user_id == current_user.id
    ).first()
    
    if not progress:
        raise HTTPException(status_code=400, detail="Start course first")
        
    completed_lessons = list(progress.completed_lessons) if progress.completed_lessons else []
    
    if lesson_id not in completed_lessons:
        completed_lessons.append(lesson_id)
        # Assuming simple array update works or need to reassign
        progress.completed_lessons = completed_lessons
        
        # Check if course finished
        count = db.query(Lesson).filter(Lesson.course_id == id).count()
        if len(completed_lessons) >= count:
            progress.completed_at = datetime.utcnow()
            
        db.commit()
        
    return {"status": "ok"}

# Temporary helper for populating
@router.post("/populate-dummy", include_in_schema=False)
def populate_courses(db: Session = Depends(get_db)):
    # Check if exists
    if db.query(Course).count() > 0:
        return {"message": "Already populated"}
        
    c1 = Course(
        title="Основы журналистики",
        description="Введение в профессию журналиста. Этика, жанры, источники.",
        specializations=["journalism"],
        duration_minutes=120,
        status=CourseStatus.PUBLISHED,
        order=1
    )
    db.add(c1)
    db.commit()
    db.refresh(c1)
    
    db.add_all([
        Lesson(course_id=c1.id, title="Что такое новость?", order=1, content="Новость — это оперативное информационное сообщение..."),
        Lesson(course_id=c1.id, title="Структура заметки", order=2, content="Заголовок, лид, основной текст..."),
        Lesson(course_id=c1.id, title="Этика журналиста", order=3, content="Кодекс профессиональной этики...")
    ])
    
    c2 = Course(
        title="SMM для начинающих",
        description="Как вести социальные сети для бизнеса и медиа.",
        specializations=["smm", "marketing"],
        duration_minutes=90,
        status=CourseStatus.PUBLISHED,
        order=2
    )
    db.add(c2)
    db.commit()
    
    return {"message": "Courses created"}
