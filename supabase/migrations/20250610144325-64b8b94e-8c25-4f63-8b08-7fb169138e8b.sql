
-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Set up cron job to process scheduled posts every minute
SELECT cron.schedule(
  'process-scheduled-posts',
  '* * * * *', -- Every minute
  $$
  SELECT
    net.http_post(
      url := 'https://pzwdzsijkpzatnsfmcjq.supabase.co/functions/v1/schedule-processor',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6d2R6c2lqa3B6YXRuc2ZtY2pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDcyMjYsImV4cCI6MjA2NTEyMzIyNn0.HMK0L-P4bFBW6UNZ0_q-wvUY3MKRbdFEivLkGzR0v1I"}'::jsonb,
      body := '{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);

-- Clean up any existing posts with invalid localStorage image references
UPDATE scheduled_posts 
SET image_url = NULL 
WHERE image_url LIKE 'image_%' AND image_url NOT LIKE 'http%';
