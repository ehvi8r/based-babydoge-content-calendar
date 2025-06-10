
-- Create the media-uploads storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media-uploads',
  'media-uploads', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the media-uploads bucket
CREATE POLICY "Users can upload their own media files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'media-uploads' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view media files" ON storage.objects
  FOR SELECT USING (bucket_id = 'media-uploads');

CREATE POLICY "Users can delete their own media files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'media-uploads' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
