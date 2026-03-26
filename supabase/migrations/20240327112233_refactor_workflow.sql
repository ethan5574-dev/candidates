-- Migration: Refactor Skill & Job Workflow
-- Date: 2024-03-27

-- Backup/Drop old structure (CAUTION: Resets data)
DROP TABLE IF EXISTS job_requirements;
DROP TABLE IF EXISTS candidates CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS skills CASCADE;

-- 1. Skills Directory
CREATE TABLE skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Jobs with weighted skills
CREATE TABLE jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  skills jsonb NOT NULL DEFAULT '[]'::jsonb, -- Array of {skill_name, weight}
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Candidates linked to Jobs
CREATE TABLE candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  status text NOT NULL DEFAULT 'New',
  resume_url text, 
  skills jsonb NOT NULL DEFAULT '[]'::jsonb, -- Array of skill_names
  match_score int DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Row Level Security
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Policies for Skills (Accessible by all HRs)
CREATE POLICY "Enable all for authenticated users" ON skills
  FOR ALL TO authenticated USING (true);

-- Policies for Jobs (Private to owner)
CREATE POLICY "Enable all for owners" ON jobs
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Policies for Candidates (Private to owner)
CREATE POLICY "Enable all for owners" ON candidates
  FOR ALL TO authenticated USING (auth.uid() = user_id);
