-- Secure the resumes bucket
-- 1. Make the bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'resumes';

-- 2. Rename column in candidates table for clarity
ALTER TABLE public.candidates RENAME COLUMN resume_url TO resume_path;

-- 3. Update existing data to store only the path (extract from public URL)
UPDATE public.candidates
SET resume_path = split_part(resume_path, '/resumes/', 2)
WHERE resume_path LIKE 'http%';

-- 4. Storage Policies for 'resumes' bucket
-- Remove the old public policy
DROP POLICY IF EXISTS "Public can view resumes" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload resumes" ON storage.objects;

-- Create new secure policies
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resumes'
);

CREATE POLICY "Allow individual read"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes' AND
  owner = auth.uid()
);

CREATE POLICY "Allow individual delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'resumes' AND
  owner = auth.uid()
);
