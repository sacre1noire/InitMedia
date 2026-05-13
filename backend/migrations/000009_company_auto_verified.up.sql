-- Auto-verify all companies (remove moderation stage).

UPDATE companies
SET is_verified = 'verified'::company_verification_status
WHERE is_verified IS NULL
   OR is_verified <> 'verified'::company_verification_status;
