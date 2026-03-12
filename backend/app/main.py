from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import auth, profile, vacancies, companies, applications, employer, courses


app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роуты
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(profile.router, prefix="/api/profile", tags=["profile"])
app.include_router(vacancies.router, prefix="/api/vacancies", tags=["vacancies"])
app.include_router(companies.router, prefix="/api/companies", tags=["companies"])
app.include_router(applications.router, prefix="/api/applications", tags=["applications"])
app.include_router(employer.router, prefix="/api/employer", tags=["employer"])
app.include_router(courses.router, prefix="/api/courses", tags=["courses"])





@app.get("/")
def root():
    return {"message": "InitMedia API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
