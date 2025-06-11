
-- Add content_hash column to both tables
ALTER TABLE public.published_posts 
ADD COLUMN content_hash TEXT;

ALTER TABLE public.scheduled_posts 
ADD COLUMN content_hash TEXT;

-- Add function to generate content hash
CREATE OR REPLACE FUNCTION generate_content_hash(content_text TEXT, hashtags_text TEXT DEFAULT NULL)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(COALESCE(content_text, '') || COALESCE(hashtags_text, ''), 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update existing records with content hashes
UPDATE public.published_posts 
SET content_hash = generate_content_hash(content, hashtags)
WHERE content_hash IS NULL;

UPDATE public.scheduled_posts 
SET content_hash = generate_content_hash(content, hashtags)
WHERE content_hash IS NULL;

-- Make content_hash NOT NULL after populating existing records
ALTER TABLE public.published_posts ALTER COLUMN content_hash SET NOT NULL;
ALTER TABLE public.scheduled_posts ALTER COLUMN content_hash SET NOT NULL;

-- Create indexes for performance
CREATE INDEX idx_published_posts_content_hash ON public.published_posts(content_hash);
CREATE INDEX idx_scheduled_posts_content_hash ON public.scheduled_posts(content_hash);
CREATE INDEX idx_published_posts_user_content ON public.published_posts(user_id, content_hash);
CREATE INDEX idx_published_posts_user_published_at ON public.published_posts(user_id, published_at);

-- Add a check function to prevent recent duplicates (to be used in application logic)
CREATE OR REPLACE FUNCTION check_recent_duplicate(
  p_user_id UUID,
  p_content_hash TEXT,
  p_hours_window INTEGER DEFAULT 24
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.published_posts 
    WHERE user_id = p_user_id 
      AND content_hash = p_content_hash 
      AND published_at > (NOW() - (p_hours_window || ' hours')::INTERVAL)
  );
END;
$$ LANGUAGE plpgsql STABLE;
