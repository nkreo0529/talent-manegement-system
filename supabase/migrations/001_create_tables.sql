-- TMS Database Schema
-- Run this migration in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum types
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'member');
CREATE TYPE job_type AS ENUM ('engineer', 'designer', 'product_manager', 'sales', 'marketing', 'hr', 'finance', 'operations', 'other');
CREATE TYPE evaluation_grade AS ENUM ('S', 'A', 'B', 'C', 'D');
CREATE TYPE mood_rating AS ENUM ('1', '2', '3', '4', '5');

-- 1. Teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    manager_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Employees table
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    name_kana VARCHAR(100),
    avatar_url TEXT,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    job_title VARCHAR(100),
    job_type job_type,
    role user_role DEFAULT 'member',
    hire_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add manager_id foreign key to teams (after employees table is created)
ALTER TABLE teams ADD CONSTRAINT fk_manager
    FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL;

-- 3. Strengths table (StrengthsFinder results)
CREATE TABLE strengths (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    strengths_order TEXT[] NOT NULL, -- Array of 34 strength IDs in order
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id)
);

-- 4. SPI Results table
CREATE TABLE spi_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    personality_traits JSONB NOT NULL, -- {extroversion, agreeableness, conscientiousness, neuroticism, openness}
    work_style JSONB NOT NULL, -- {leadership, independence, teamwork, persistence, flexibility, stress_tolerance}
    aptitude_scores JSONB NOT NULL, -- {verbal, numerical, logical}
    test_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id)
);

-- 5. Careers table
CREATE TABLE careers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    company_name VARCHAR(200) NOT NULL,
    position VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    description TEXT,
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Evaluations table
CREATE TABLE evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    evaluator_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    period VARCHAR(20) NOT NULL, -- e.g., "2024H1"
    overall_grade evaluation_grade NOT NULL,
    strengths_comment TEXT,
    improvements_comment TEXT,
    goals TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. One-on-One Notes table
CREATE TABLE one_on_one_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    manager_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    meeting_date DATE NOT NULL,
    topics TEXT[] DEFAULT '{}',
    notes TEXT,
    action_items TEXT[] DEFAULT '{}',
    mood mood_rating,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. AI Profiles table
CREATE TABLE ai_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    profile_summary TEXT NOT NULL,
    work_style_analysis TEXT NOT NULL,
    collaboration_tips TEXT NOT NULL,
    development_suggestions TEXT NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    model_version VARCHAR(50) DEFAULT 'claude-sonnet-4-5-20250929',
    UNIQUE(employee_id)
);

-- 9. AI Team Analysis table
CREATE TABLE ai_team_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    team_dynamics TEXT NOT NULL,
    strengths_distribution TEXT NOT NULL,
    potential_challenges TEXT NOT NULL,
    recommendations TEXT NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    model_version VARCHAR(50) DEFAULT 'claude-sonnet-4-5-20250929',
    UNIQUE(team_id)
);

-- Indexes for better query performance
CREATE INDEX idx_employees_team_id ON employees(team_id);
CREATE INDEX idx_employees_job_type ON employees(job_type);
CREATE INDEX idx_employees_is_active ON employees(is_active);
CREATE INDEX idx_strengths_employee_id ON strengths(employee_id);
CREATE INDEX idx_spi_results_employee_id ON spi_results(employee_id);
CREATE INDEX idx_careers_employee_id ON careers(employee_id);
CREATE INDEX idx_evaluations_employee_id ON evaluations(employee_id);
CREATE INDEX idx_evaluations_evaluator_id ON evaluations(evaluator_id);
CREATE INDEX idx_evaluations_period ON evaluations(period);
CREATE INDEX idx_one_on_one_employee_id ON one_on_one_notes(employee_id);
CREATE INDEX idx_one_on_one_manager_id ON one_on_one_notes(manager_id);
CREATE INDEX idx_one_on_one_date ON one_on_one_notes(meeting_date);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strengths_updated_at
    BEFORE UPDATE ON strengths
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spi_results_updated_at
    BEFORE UPDATE ON spi_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evaluations_updated_at
    BEFORE UPDATE ON evaluations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_one_on_one_notes_updated_at
    BEFORE UPDATE ON one_on_one_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
