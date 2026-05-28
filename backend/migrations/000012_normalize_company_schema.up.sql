-- Normalize companies schema: enum types, slug, search_vector, verification status.
-- Previously this lived in cmd/api/main.go ensureCompanySchema(). Moved to a proper
-- versioned migration so production state matches what runs at startup.

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

ALTER TABLE companies ADD COLUMN IF NOT EXISTS slug VARCHAR(160);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS industry_id INTEGER;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS website_url VARCHAR(255);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Migrate legacy companysize enum to new company_size_range range
DO $$
DECLARE
    size_type text;
BEGIN
    SELECT udt_name INTO size_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'size';
    IF size_type = 'companysize' THEN
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
    END IF;
END $$;

-- Convert is_verified BOOLEAN to company_verification_status enum
DO $$
DECLARE
    verified_type text;
BEGIN
    SELECT data_type INTO verified_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'is_verified';
    IF verified_type = 'boolean' THEN
        ALTER TABLE companies
        ALTER COLUMN is_verified TYPE company_verification_status
        USING (CASE WHEN is_verified THEN 'verified'::company_verification_status ELSE 'pending'::company_verification_status END);
    ELSIF verified_type IS NULL THEN
        ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_verified company_verification_status;
    END IF;
END $$;

UPDATE companies SET is_verified = 'pending' WHERE is_verified IS NULL;
ALTER TABLE companies ALTER COLUMN is_verified SET DEFAULT 'pending';

-- Backfill slug for legacy rows
UPDATE companies
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || id
WHERE slug IS NULL OR slug = '';
