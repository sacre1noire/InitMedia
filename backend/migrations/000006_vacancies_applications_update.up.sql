-- Align vacancies fields with frontend payloads and ensure application uniqueness.

ALTER TABLE vacancies
    ALTER COLUMN specialization TYPE VARCHAR(64) USING specialization::text,
    ALTER COLUMN schedule TYPE VARCHAR(32) USING schedule::text;

DO $$ BEGIN
    ALTER TABLE applications ADD CONSTRAINT uq_applications_vacancy_applicant UNIQUE (vacancy_id, applicant_id);
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN duplicate_table THEN null;
END $$;
