
-- Create enum for post status
CREATE TYPE post_status AS ENUM ('scheduled', 'publishing', 'published', 'failed');

-- Create scheduled_posts table
CREATE TABLE public.scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  hashtags TEXT,
  image_url TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status post_status DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3
);

-- Create published_posts table
CREATE TABLE public.published_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  original_scheduled_post_id UUID,
  content TEXT NOT NULL,
  hashtags TEXT,
  image_url TEXT,
  tweet_id TEXT,
  tweet_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analytics table
CREATE TABLE public.post_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  published_post_id UUID REFERENCES public.published_posts(id) ON DELETE CASCADE,
  tweet_id TEXT NOT NULL,
  retweets INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.published_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for scheduled_posts
CREATE POLICY "Users can view their own scheduled posts" 
  ON public.scheduled_posts FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scheduled posts" 
  ON public.scheduled_posts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled posts" 
  ON public.scheduled_posts FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled posts" 
  ON public.scheduled_posts FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS policies for published_posts
CREATE POLICY "Users can view their own published posts" 
  ON public.published_posts FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own published posts" 
  ON public.published_posts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- RLS policies for post_analytics
CREATE POLICY "Users can view analytics for their posts" 
  ON public.post_analytics FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.published_posts 
      WHERE id = published_post_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Service can insert analytics" 
  ON public.post_analytics FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Service can update analytics" 
  ON public.post_analytics FOR UPDATE 
  USING (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at on scheduled_posts
CREATE TRIGGER update_scheduled_posts_updated_at 
  BEFORE UPDATE ON public.scheduled_posts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_scheduled_posts_user_status ON public.scheduled_posts(user_id, status);
CREATE INDEX idx_scheduled_posts_scheduled_for ON public.scheduled_posts(scheduled_for);
CREATE INDEX idx_published_posts_user_id ON public.published_posts(user_id);
CREATE INDEX idx_post_analytics_tweet_id ON public.post_analytics(tweet_id);
