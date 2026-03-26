-- 1. Create jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Create job_requirements table
CREATE TABLE IF NOT EXISTS public.job_requirements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  skill TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Modify candidates table
ALTER TABLE public.candidates 
  ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS match_score NUMERIC DEFAULT 0;

-- 4. Enable RLS for new tables
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_requirements ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for jobs
CREATE POLICY "Users can view own jobs" ON public.jobs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jobs" ON public.jobs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs" ON public.jobs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own jobs" ON public.jobs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 6. RLS Policies for job_requirements (linked to user's jobs)
CREATE POLICY "Users can view own job requirements" ON public.job_requirements
  FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.jobs WHERE id = job_requirements.job_id AND user_id = auth.uid()));

CREATE POLICY "Users can insert own job requirements" ON public.job_requirements
  FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM public.jobs WHERE id = job_id AND user_id = auth.uid()));

CREATE POLICY "Users can delete own job requirements" ON public.job_requirements
  FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.jobs WHERE id = job_requirements.job_id AND user_id = auth.uid()));
