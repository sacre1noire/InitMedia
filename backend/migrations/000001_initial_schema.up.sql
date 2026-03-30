-- Initial Schema Migration (based on Alembic revisions)

-- Enum Types (conditionally created, but "up" assumes clean state or use "IF NOT EXISTS" logic if possible in pure SQL, though ENUM creation usually fails if exists)
DO $$ BEGIN
    CREATE TYPE userrole AS ENUM ('APPLICANT', 'EMPLOYER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE specialization AS ENUM ('PR', 'JOURNALISM', 'MEDIA_COM', 'MARKETING', 'SMM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE skilllevel AS ENUM ('NOVICE', 'BEGINNER', 'CONFIDENT', 'ADVANCED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE companysize AS ENUM ('SMALL', 'MEDIUM', 'LARGE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE vacancytype AS ENUM ('INTERNSHIP', 'VACANCY', 'PROJECT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE schedulepreference AS ENUM ('FULL_TIME', 'PART_TIME', 'REMOTE', 'OFFICE', 'HYBRID');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE vacancystatus AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED', 'MODERATION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE applicationstatus AS ENUM ('PENDING', 'VIEWED', 'ACCEPTED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE coursestatus AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR NOT NULL UNIQUE,
    hashed_password VARCHAR NOT NULL,
    role userrole NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ix_users_email ON users(email);

-- 2. Applicant Profiles
CREATE TABLE IF NOT EXISTS applicant_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    first_name VARCHAR,
    last_name VARCHAR,
    phone VARCHAR,
    avatar_url VARCHAR,
    specialization specialization,
    skill_level skilllevel,
    employment_types VARCHAR[], 
    schedule_preferences VARCHAR[],
    bio TEXT,
    city VARCHAR,
    telegram VARCHAR,
    portfolio_url VARCHAR,
    CONSTRAINT uq_applicant_profiles_user_id UNIQUE (user_id)
);

-- 3. Companies
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id),
    name VARCHAR NOT NULL,
    logo_url VARCHAR,
    description TEXT,
    industry VARCHAR,
    website VARCHAR,
    city VARCHAR,
    size companysize,
    career_opportunities TEXT,
    requirements_description TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    CONSTRAINT uq_companies_owner_id UNIQUE (owner_id)
);
CREATE INDEX IF NOT EXISTS ix_companies_name ON companies(name);

-- 4. Resume Templates
CREATE TABLE IF NOT EXISTS resume_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    preview_url VARCHAR,
    structure JSONB, -- Using JSONB for better performance/indexing in PG usually, though Alembic said JSON
    specializations VARCHAR[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Resumes
CREATE TABLE IF NOT EXISTS resumes (
    id SERIAL PRIMARY KEY,
    applicant_id INTEGER NOT NULL REFERENCES users(id),
    template_id INTEGER REFERENCES resume_templates(id),
    title VARCHAR NOT NULL,
    content JSONB,
    is_primary BOOLEAN,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- 6. Vacancies
CREATE TABLE IF NOT EXISTS vacancies (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    title VARCHAR NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    type vacancytype NOT NULL,
    specialization specialization NOT NULL,
    schedule schedulepreference, -- Alembic: schedule (Enum), created as single enum
    salary_from INTEGER,
    salary_to INTEGER,
    is_salary_hidden BOOLEAN,
    city VARCHAR,
    is_remote BOOLEAN,
    status vacancystatus NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ix_vacancies_title ON vacancies(title);

-- 7. Applications
CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    vacancy_id INTEGER NOT NULL REFERENCES vacancies(id),
    applicant_id INTEGER NOT NULL REFERENCES users(id),
    status applicationstatus NOT NULL,
    cover_letter TEXT,
    resume_id INTEGER REFERENCES resumes(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- 8. Courses
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR NOT NULL,
    description TEXT NOT NULL,
    cover_url VARCHAR,
    specializations JSONB, -- Alembic said JSON
    duration_minutes INTEGER,
    is_free BOOLEAN,
    "order" INTEGER,
    status coursestatus,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- 9. Lessons
CREATE TABLE IF NOT EXISTS lessons (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id),
    title VARCHAR NOT NULL,
    content TEXT,
    video_url VARCHAR,
    "order" INTEGER
);

-- 10. Course Progress
CREATE TABLE IF NOT EXISTS course_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    course_id INTEGER NOT NULL REFERENCES courses(id),
    completed_lessons JSONB,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
