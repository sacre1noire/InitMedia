-- Extend applicant profile with education and experience metadata.

ALTER TABLE applicant_profiles
    ADD COLUMN IF NOT EXISTS education_level VARCHAR(32),
    ADD COLUMN IF NOT EXISTS study_course SMALLINT,
    ADD COLUMN IF NOT EXISTS university VARCHAR(64),
    ADD COLUMN IF NOT EXISTS experience VARCHAR(64),
    ADD COLUMN IF NOT EXISTS projects VARCHAR(64),
    ADD COLUMN IF NOT EXISTS achievements VARCHAR(64),
    ADD COLUMN IF NOT EXISTS skills VARCHAR(64);
