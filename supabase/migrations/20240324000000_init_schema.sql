-- 1. Create candidates table
CREATE TABLE IF NOT EXISTS public.candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  applied_position TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Interviewing', 'Hired', 'Rejected')),
  resume_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Enable Row-Level Security (RLS)
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Users can only see their own candidates
CREATE POLICY "Users can view own candidates"
  ON public.candidates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can only insert candidates for themselves
CREATE POLICY "Users can insert own candidates"
  ON public.candidates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own candidates
CREATE POLICY "Users can update own candidates"
  ON public.candidates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own candidates
CREATE POLICY "Users can delete own candidates"
  ON public.candidates FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Enable Realtime for candidates table
ALTER PUBLICATION supabase_realtime ADD TABLE public.candidates;

-- 5. Setup Storage Bucket (Note: This might require manual setup in the Dashboard if not allowed via SQL in some environments)
-- Inserting bucket definition into storage.buckets table
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'resumes' bucket
CREATE POLICY "Authenticated users can upload resumes"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Public can view resumes"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'resumes');
