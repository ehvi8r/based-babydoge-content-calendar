
-- Enable required extensions for cron jobs and HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create storage bucket for media uploads (images/videos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media-uploads', 
  'media-uploads', 
  true, 
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
);

-- Create storage policies for the media uploads bucket
CREATE POLICY "Users can upload their own media files" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'media-uploads' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view media files" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'media-uploads');

CREATE POLICY "Users can update their own media files" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'media-uploads' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own media files" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'media-uploads' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

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

-- Set up cron job to update analytics every 30 minutes
SELECT cron.schedule(
  'update-post-analytics',
  '*/30 * * * *', -- Every 30 minutes
  $$
  SELECT
    net.http_post(
      url := 'https://pzwdzsijkpzatnsfmcjq.supabase.co/functions/v1/analytics-updater',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6d2R6c2lqa3B6YXRuc2ZtY2pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDcyMjYsImV4cCI6MjA2NTEyMzIyNn0.HMK0L-P4bFBW6UNZ0_q-wvUY3MKRbdFEivLkGzR0v1I"}'::jsonb,
      body := '{"analytics": true}'::jsonb
    ) as request_id;
  $$
);

-- Add unique constraint on post_analytics to prevent duplicates
ALTER TABLE public.post_analytics 
ADD CONSTRAINT unique_tweet_analytics 
UNIQUE (tweet_id);
