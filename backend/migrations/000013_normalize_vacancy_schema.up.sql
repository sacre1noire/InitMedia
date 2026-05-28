-- Normalize vacancies schema: duties/published_at columns, switch enums to VARCHAR.
-- Previously this lived in cmd/api/main.go ensureVacancySchema(). Moved to a proper
-- versioned migration.

ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS duties TEXT;
ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE vacancies ALTER COLUMN specialization TYPE VARCHAR(64) USING specialization::text;
ALTER TABLE vacancies ALTER COLUMN schedule TYPE VARCHAR(32) USING schedule::text;
