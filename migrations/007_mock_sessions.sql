-- Migration: 007_mock_sessions.sql
-- Phase 8: Mock Interview Simulator

CREATE TABLE IF NOT EXISTS mock_sessions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,

    round_type VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) NOT NULL DEFAULT 'Medium',

    interview_plan JSONB NOT NULL DEFAULT '{}',
    questions_and_answers JSONB DEFAULT '[]',

    overall_score INTEGER,
    grade VARCHAR(5),
    hiring_decision VARCHAR(30),
    category_scores JSONB DEFAULT '{}',
    debrief JSONB DEFAULT '{}',

    status VARCHAR(20) DEFAULT 'in_progress',
    questions_answered INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    duration_seconds INTEGER,

    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mock_user ON mock_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_mock_app ON mock_sessions(application_id);
CREATE INDEX IF NOT EXISTS idx_mock_scores ON mock_sessions(user_id, overall_score) WHERE status = 'completed';
