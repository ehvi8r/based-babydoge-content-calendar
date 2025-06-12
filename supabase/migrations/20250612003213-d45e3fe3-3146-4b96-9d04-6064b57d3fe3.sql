
-- Fix storage policies for media-uploads bucket to allow both banner and post uploads

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can upload their own media files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own media files" ON storage.objects;

-- Create new policies that allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload media files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'media-uploads' AND 
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Authenticated users can update media files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'media-uploads' AND 
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Authenticated users can delete media files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'media-uploads' AND 
    auth.uid() IS NOT NULL
  );

-- Ensure the media-uploads bucket exists with proper configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media-uploads',
  'media-uploads', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
