-- Vacancy: duties (обязанности), publication timestamp, optional backfill.

ALTER TABLE vacancies
    ADD COLUMN IF NOT EXISTS duties TEXT,
    ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

UPDATE vacancies
SET published_at = created_at
WHERE published_at IS NULL AND status::text = 'ACTIVE';
