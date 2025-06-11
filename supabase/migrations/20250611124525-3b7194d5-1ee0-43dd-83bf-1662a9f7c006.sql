
-- Create a storage bucket for banner images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'banner-images',
  'banner-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for banner images
CREATE POLICY "Anyone can view banner images" ON storage.objects
  FOR SELECT USING (bucket_id = 'banner-images');

CREATE POLICY "Users can upload banner images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'banner-images' AND 
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update banner images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'banner-images' AND 
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete banner images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'banner-images' AND 
    auth.uid() IS NOT NULL
  );
