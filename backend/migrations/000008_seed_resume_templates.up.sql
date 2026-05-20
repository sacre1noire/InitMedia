-- Seed resume templates (original strict black and white template).

INSERT INTO resume_templates (name, preview_url, structure, specializations)
SELECT
    'Classic BW',
    NULL,
    '{"slug":"classic-bw","description":"Strict black and white resume"}'::jsonb,
    ARRAY[]::varchar[]
WHERE NOT EXISTS (
    SELECT 1 FROM resume_templates WHERE name = 'Classic BW'
);
