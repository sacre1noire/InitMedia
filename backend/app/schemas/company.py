from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from datetime import datetime
from app.models.company import CompanySize

class CompanyBase(BaseModel):
    name: str
    logo_url: Optional[str] = None
    description: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    city: Optional[str] = None
    size: Optional[CompanySize] = None
    career_opportunities: Optional[str] = None
    requirements_description: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(CompanyBase):
    pass

class CompanyResponse(CompanyBase):
    id: int
    owner_id: int
    is_verified: bool
    created_at: datetime
    
    model_config = {"from_attributes": True}
