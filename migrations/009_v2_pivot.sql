-- HuntIQ v2 Pivot Migration
-- Adds new columns to user_profiles, simplifies applications, adds intelligence_reports

-- ── User Profiles: add onboarding columns ───────────────────────────────────

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS cv_raw_text TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS cv_extracted JSONB DEFAULT '{}'::jsonb;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS onboarding_qa JSONB DEFAULT '[]'::jsonb;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- ── Applications: add new columns ───────────────────────────────────────────

ALTER TABLE applications ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_date TIMESTAMP;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS job_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS company_data JSONB DEFAULT '{}'::jsonb;

-- ── Intelligence Reports ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS intelligence_reports (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    report_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    pdf_url TEXT,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_reports_user ON intelligence_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_app ON intelligence_reports(application_id);
