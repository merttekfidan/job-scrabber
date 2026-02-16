-- PostgreSQL Schema for Job Application Tracker
-- Run this after creating your PostgreSQL database

CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    application_date TIMESTAMP NOT NULL,
    job_title VARCHAR(500) NOT NULL,
    company VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    work_mode VARCHAR(50) CHECK (work_mode IN ('Remote', 'Hybrid', 'Onsite', 'Unknown')),
    salary VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Applied',
    job_url TEXT NOT NULL,
    company_url TEXT,
    
    -- JSON fields (using JSONB for better performance)
    key_responsibilities JSONB,
    required_skills JSONB,
    preferred_skills JSONB,
    
    -- Text fields
    company_description TEXT,
    
    -- Interview prep fields (JSONB)
    interview_prep_key_talking_points JSONB,
    interview_prep_questions_to_ask JSONB,
    interview_prep_potential_red_flags JSONB,
    
    -- Metadata
    source VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_company ON applications(company);
CREATE INDEX IF NOT EXISTS idx_applications_work_mode ON applications(work_mode);
CREATE INDEX IF NOT EXISTS idx_applications_application_date ON applications(application_date DESC);
CREATE INDEX IF NOT EXISTS idx_applications_job_url ON applications(job_url);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_applications_updated_at ON applications;
CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create full-text search index for better search performance
CREATE INDEX IF NOT EXISTS idx_applications_search ON applications 
USING GIN (to_tsvector('english', 
    COALESCE(job_title, '') || ' ' || 
    COALESCE(company, '') || ' ' || 
    COALESCE(location, '') || ' ' ||
    COALESCE(company_description, '')
));
