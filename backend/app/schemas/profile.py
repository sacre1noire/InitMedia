from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from app.models.profile import Specialization, SkillLevel, EmploymentType, SchedulePreference

class ProfileBase(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    specialization: Optional[Specialization] = None
    skill_level: Optional[SkillLevel] = None
    employment_types: Optional[List[str]] = None
    schedule_preferences: Optional[List[str]] = None
    bio: Optional[str] = None
    city: Optional[str] = None
    telegram: Optional[str] = None
    portfolio_url: Optional[str] = None

class ProfileCreate(ProfileBase):
    pass

class ProfileUpdate(ProfileBase):
    pass

class ProfileResponse(ProfileBase):
    id: int
    user_id: int
    
    model_config = {"from_attributes": True}
