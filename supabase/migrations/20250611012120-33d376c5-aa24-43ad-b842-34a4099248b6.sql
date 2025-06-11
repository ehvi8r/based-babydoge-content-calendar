
-- Add DELETE RLS policy to allow users to delete their own published posts
CREATE POLICY "Users can delete their own published posts" ON published_posts
FOR DELETE USING (auth.uid() = user_id);

-- Add UPDATE RLS policy for completeness (in case we need to update posts later)
CREATE POLICY "Users can update their own published posts" ON published_posts
FOR UPDATE USING (auth.uid() = user_id);
