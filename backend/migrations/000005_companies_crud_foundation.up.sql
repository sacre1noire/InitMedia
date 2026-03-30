-- Companies CRUD foundation migration aligned with current project schema (int IDs).

DO $$ BEGIN
    CREATE TYPE company_size_range AS ENUM ('1-10', '11-50', '51-200', '201-500', '500+');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE company_verification_status AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE companies
    ADD COLUMN IF NOT EXISTS slug VARCHAR(160),
    ADD COLUMN IF NOT EXISTS industry_id INTEGER,
    ADD COLUMN IF NOT EXISTS website_url VARCHAR(255),
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Backfill slug for existing rows.
UPDATE companies
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || id
WHERE slug IS NULL OR slug = '';

-- Keep legacy website column data.
UPDATE companies
SET website_url = website
WHERE website_url IS NULL AND website IS NOT NULL;

-- Convert size enum from legacy buckets to requested range values.
ALTER TABLE companies ADD COLUMN IF NOT EXISTS size_tmp company_size_range;
UPDATE companies
SET size_tmp = CASE
    WHEN size::text = 'SMALL' THEN '1-10'::company_size_range
    WHEN size::text = 'MEDIUM' THEN '11-50'::company_size_range
    WHEN size::text = 'LARGE' THEN '51-200'::company_size_range
    ELSE NULL
END
WHERE size_tmp IS NULL;
ALTER TABLE companies DROP COLUMN IF EXISTS size;
ALTER TABLE companies RENAME COLUMN size_tmp TO size;

-- Convert boolean is_verified to moderation status enum.
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_verified_tmp company_verification_status;
UPDATE companies
SET is_verified_tmp = CASE
    WHEN is_verified = TRUE THEN 'verified'::company_verification_status
    ELSE 'pending'::company_verification_status
END
WHERE is_verified_tmp IS NULL;
ALTER TABLE companies DROP COLUMN IF EXISTS is_verified;
ALTER TABLE companies RENAME COLUMN is_verified_tmp TO is_verified;

ALTER TABLE companies
    ALTER COLUMN slug SET NOT NULL,
    ALTER COLUMN is_verified SET NOT NULL,
    ALTER COLUMN is_verified SET DEFAULT 'pending'::company_verification_status;

-- Keep one company per owner behavior.
DO $$ BEGIN
    ALTER TABLE companies ADD CONSTRAINT uq_companies_owner_id UNIQUE (owner_id);
EXCEPTION
    WHEN duplicate_table THEN null;
    WHEN duplicate_object THEN null;
END $$;

-- tsvector maintenance for full text search.
CREATE OR REPLACE FUNCTION companies_search_vector_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        to_tsvector('simple', coalesce(NEW.name, '') || ' ' || coalesce(NEW.description, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_companies_search_vector_update ON companies;
CREATE TRIGGER trg_companies_search_vector_update
BEFORE INSERT OR UPDATE ON companies
FOR EACH ROW
EXECUTE FUNCTION companies_search_vector_update();

UPDATE companies
SET search_vector = to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(description, ''))
WHERE search_vector IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uix_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS ix_companies_search_vector_gin ON companies USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS ix_companies_slug ON companies(slug);
