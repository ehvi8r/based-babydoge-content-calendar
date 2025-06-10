
import { supabase } from '@/integrations/supabase/client';
import { PublishedPost } from '@/hooks/usePublishedPosts';

export const hasPotentialDuplicates = (publishedPosts: PublishedPost[]): boolean => {
  const contentMap = new Map();
  for (const post of publishedPosts) {
    const normalizedContent = post.content.trim().toLowerCase().replace(/\s+/g, ' ');
    if (contentMap.has(normalizedContent)) {
      console.log('Found duplicate content:', normalizedContent.substring(0, 50));
      return true;
    }
    contentMap.set(normalizedContent, true);
  }
  return false;
};

export const cleanupDuplicates = async (
  publishedPosts: PublishedPost[],
  onSuccess: (count: number) => void,
  onError: (message: string) => void
): Promise<void> => {
  try {
    console.log('Starting duplicate cleanup for posts:', publishedPosts.length);

    // First, let's check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth error:', authError);
      onError(`Authentication error: ${authError.message}`);
      return;
    }

    if (!user) {
      console.error('User not authenticated');
      onError("User not authenticated");
      return;
    }

    console.log('User authenticated:', user.id);

    // Group posts by normalized content to find duplicates
    const postGroups: Record<string, PublishedPost[]> = {};
    
    publishedPosts.forEach(post => {
      const normalizedContent = post.content.trim().toLowerCase().replace(/\s+/g, ' ');
      if (!postGroups[normalizedContent]) {
        postGroups[normalizedContent] = [];
      }
      postGroups[normalizedContent].push(post);
    });

    console.log('Post groups created:', Object.keys(postGroups).length);

    const postsToDelete: string[] = [];

    // For each group of posts with the same content
    Object.entries(postGroups).forEach(([content, posts]) => {
      if (posts.length > 1) {
        console.log(`Found ${posts.length} duplicates for content: "${content.substring(0, 50)}..."`);
        
        // Sort by: posts with valid tweet_id first, then by published_at (most recent first)
        const sortedPosts = posts.sort((a, b) => {
          // Prioritize posts with tweet_id and tweet_url
          const aHasValidTweet = a.tweet_id && a.tweet_url;
          const bHasValidTweet = b.tweet_id && b.tweet_url;
          
          if (aHasValidTweet && !bHasValidTweet) return -1;
          if (!aHasValidTweet && bHasValidTweet) return 1;
          
          // If both have or don't have tweet_id, sort by published_at (most recent first)
          return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
        });

        // Keep the first one (best one), mark the rest for deletion
        const [keepPost, ...duplicates] = sortedPosts;
        console.log(`Keeping post ${keepPost.id} (has tweet_id: ${!!keepPost.tweet_id})`);
        console.log(`Marking ${duplicates.length} duplicates for deletion:`, duplicates.map(p => ({ id: p.id, has_tweet_id: !!p.tweet_id })));
        
        postsToDelete.push(...duplicates.map(p => p.id));
      }
    });

    console.log('Total posts to delete:', postsToDelete);

    if (postsToDelete.length > 0) {
      console.log('Attempting to delete duplicate posts with IDs:', postsToDelete);
      
      // First, let's test if we can query these posts
      const { data: postsToCheck, error: queryError } = await supabase
        .from('published_posts')
        .select('id, user_id')
        .in('id', postsToDelete);

      if (queryError) {
        console.error('Error querying posts to delete:', queryError);
        onError(`Failed to query posts: ${queryError.message}`);
        return;
      }

      console.log('Posts found for deletion:', postsToCheck);

      // Check if all posts belong to current user
      const userPosts = postsToCheck?.filter(post => post.user_id === user.id);
      console.log('User owns posts:', userPosts?.length, 'out of', postsToDelete.length);

      // Delete posts one by one to ensure they get deleted
      let deletedCount = 0;
      const errors: string[] = [];

      for (const postId of postsToDelete) {
        console.log(`Attempting to delete post ${postId}...`);
        
        const { data, error } = await supabase
          .from('published_posts')
          .delete()
          .eq('id', postId)
          .eq('user_id', user.id)
          .select('id');

        if (error) {
          console.error(`Error deleting post ${postId}:`, error);
          errors.push(`Failed to delete post ${postId}: ${error.message}`);
        } else {
          console.log(`Successfully deleted post ${postId}`, data);
          deletedCount++;
        }
      }

      if (errors.length > 0) {
        console.error('Some deletions failed:', errors);
        onError(`Partially successful: deleted ${deletedCount} posts, ${errors.length} failed. Errors: ${errors.join(', ')}`);
      } else {
        console.log(`Successfully deleted all ${deletedCount} duplicate posts`);
        onSuccess(deletedCount);
      }
    } else {
      console.log('No duplicates found to delete');
      onSuccess(0);
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
    onError(`Failed to cleanup duplicate posts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
