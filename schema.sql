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
