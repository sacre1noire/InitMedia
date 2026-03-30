-- Applicant profile model update for Phase 3.1
-- We keep vacancy specialization enum untouched and move applicant profile fields to text-compatible storage.

ALTER TABLE applicant_profiles
    ALTER COLUMN specialization TYPE VARCHAR(64) USING specialization::text,
    ALTER COLUMN skill_level TYPE VARCHAR(32) USING skill_level::text;

-- Normalize arrays to explicit VARCHAR[] in case legacy schema differs.
ALTER TABLE applicant_profiles
    ALTER COLUMN employment_types TYPE VARCHAR[] USING employment_types::varchar[],
    ALTER COLUMN schedule_preferences TYPE VARCHAR[] USING schedule_preferences::varchar[];
