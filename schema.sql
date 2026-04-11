-- ── Auth Tables (NextAuth.js) ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  email_verified TIMESTAMP,
  last_login TIMESTAMP,
  image TEXT,
  password_hash TEXT
);

CREATE TABLE IF NOT EXISTS accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type VARCHAR(255),
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  UNIQUE(provider, provider_account_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires TIMESTAMP NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- ── User Profiles (onboarding data, settings) ──────────────────────────────

CREATE TABLE IF NOT EXISTS user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    cv_raw_text TEXT,
    cv_extracted JSONB DEFAULT '{}'::jsonb,
    onboarding_qa JSONB DEFAULT '[]'::jsonb,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Applications ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    job_title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    work_mode VARCHAR(50),
    salary VARCHAR(100),
    application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    job_url TEXT,
    company_url TEXT,
    status VARCHAR(50) DEFAULT 'Applied',
    source_url TEXT,
    notes TEXT,
    interview_date TIMESTAMP,
    job_data JSONB DEFAULT '{}'::jsonb,
    company_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(user_id, status);
CREATE INDEX IF NOT EXISTS applications_search_idx ON applications
USING GIN (to_tsvector('english',
    COALESCE(job_title, '') || ' ' ||
    COALESCE(company, '') || ' ' ||
    COALESCE(location, '')
));

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

-- ── Mock Interview Sessions ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS mock_sessions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    round_type VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) NOT NULL DEFAULT 'Medium',
    interview_plan JSONB NOT NULL DEFAULT '{}'::jsonb,
    questions_and_answers JSONB DEFAULT '[]'::jsonb,
    overall_score INTEGER,
    grade VARCHAR(5),
    hiring_decision VARCHAR(30),
    category_scores JSONB DEFAULT '{}'::jsonb,
    debrief JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(20) DEFAULT 'in_progress',
    questions_answered INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    duration_seconds INTEGER,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mock_user ON mock_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_mock_app ON mock_sessions(application_id);

-- ── Feedback ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS feedbacks (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    email VARCHAR(255),
    type VARCHAR(50) DEFAULT 'general',
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
