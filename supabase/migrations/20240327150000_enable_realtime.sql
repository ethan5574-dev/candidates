-- Enable Realtime for candidates table
BEGIN;
  -- Add candidates to the realtime publication
  ALTER PUBLICATION supabase_realtime ADD TABLE candidates;
COMMIT;
