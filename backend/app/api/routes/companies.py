from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.company import Company
from app.schemas.company import CompanyResponse, CompanyCreate
from app.api.deps import get_current_user
from app.models.user import User
from typing import List

router = APIRouter()

@router.get("/", response_model=List[CompanyResponse])
def get_companies(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    companies = db.query(Company).offset(skip).limit(limit).all()
    return companies

@router.get("/{id}", response_model=CompanyResponse)
def get_company(id: int, db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.id == id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

@router.post("/", response_model=CompanyResponse)
def create_company(
    company_data: CompanyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing = db.query(Company).filter(Company.owner_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already has a company")
        
    company = Company(
        **company_data.model_dump(),
        owner_id=current_user.id
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    return company
