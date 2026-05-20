-- Add quiz tables and extend course progress for skill tracks

ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS xp_reward INTEGER NOT NULL DEFAULT 0;

ALTER TABLE course_progress
    ADD COLUMN IF NOT EXISTS completed_lessons JSONB,
    ADD COLUMN IF NOT EXISTS quiz_passed BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS quiz_score INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS quiz_attempts INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS xp_earned INTEGER NOT NULL DEFAULT 0;

UPDATE course_progress
SET completed_lessons = '[]'::jsonb
WHERE completed_lessons IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_course_progress_user_course
    ON course_progress(user_id, course_id);

CREATE TABLE IF NOT EXISTS course_quiz_questions (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id),
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_index INTEGER NOT NULL,
    explanation TEXT,
    "order" INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_course_quiz_questions_course_id ON course_quiz_questions(course_id);

CREATE TABLE IF NOT EXISTS course_quiz_attempts (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    answers JSONB NOT NULL,
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    passed BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_course_quiz_attempts_user_course ON course_quiz_attempts(user_id, course_id);
