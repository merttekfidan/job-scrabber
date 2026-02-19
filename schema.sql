CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    job_title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    work_mode VARCHAR(50),
    salary VARCHAR(100),
    application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    job_url TEXT UNIQUE,
    company_url TEXT,
    status VARCHAR(50) DEFAULT 'Applied',
    key_responsibilities JSONB DEFAULT '[]',
    required_skills JSONB DEFAULT '[]',
    preferred_skills JSONB DEFAULT '[]',
    company_description TEXT,
    original_content TEXT,
    interview_stages JSONB DEFAULT '[]',
    interview_prep_key_talking_points JSONB DEFAULT '[]',
    interview_prep_questions_to_ask JSONB DEFAULT '[]',
    interview_prep_potential_red_flags JSONB DEFAULT '[]',
    formatted_content TEXT,
    negative_signals JSONB DEFAULT '[]',
    notes TEXT,
    source VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for full-text search
CREATE INDEX IF NOT EXISTS applications_search_idx ON applications 
USING GIN (to_tsvector('english', 
    COALESCE(job_title, '') || ' ' || 
    COALESCE(company, '') || ' ' || 
    COALESCE(location, '') || ' ' || 
    COALESCE(company_description, '')
));

-- CV Storage Table
CREATE TABLE IF NOT EXISTS cv_data (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    raw_text TEXT NOT NULL,
    ai_analysis JSONB,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_cv_active ON cv_data(is_active);

-- Auth Tables (NextAuth.js)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  email_verified TIMESTAMP,
  image TEXT
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

-- Add user_id to existing tables
ALTER TABLE applications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE cv_data ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
