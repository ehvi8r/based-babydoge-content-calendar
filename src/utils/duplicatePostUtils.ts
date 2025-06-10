import { supabase } from '@/integrations/supabase/client';
import { PublishedPost } from '@/hooks/usePublishedPosts';

export const hasPotentialDuplicates = (publishedPosts: PublishedPost[]): boolean => {
  const contentMap = new Map();
  for (const post of publishedPosts) {
    const normalizedContent = post.content.trim().replace(/\s+/g, ' ');
    if (contentMap.has(normalizedContent)) {
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
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      onError("User not authenticated");
      return;
    }

    console.log('Starting duplicate cleanup for posts:', publishedPosts);

    // Group posts by content to find duplicates (normalize whitespace)
    const postGroups = publishedPosts.reduce((groups, post) => {
      const normalizedContent = post.content.trim().replace(/\s+/g, ' ');
      if (!groups[normalizedContent]) {
        groups[normalizedContent] = [];
      }
      groups[normalizedContent].push(post);
      return groups;
    }, {} as Record<string, PublishedPost[]>);

    console.log('Post groups by content:', postGroups);

    const postsToDelete: string[] = [];

    // For each group of posts with the same content
    for (const [content, posts] of Object.entries(postGroups)) {
      if (posts.length > 1) {
        console.log(`Found ${posts.length} duplicates for content: "${content.substring(0, 50)}..."`);
        
        // Sort by: posts with tweet_id first, then by published_at (most recent first)
        const sortedPosts = posts.sort((a, b) => {
          // Prioritize posts with tweet_id
          if (a.tweet_id && !b.tweet_id) return -1;
          if (!a.tweet_id && b.tweet_id) return 1;
          
          // If both have or don't have tweet_id, sort by published_at (most recent first)
          return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
        });

        // Keep the first one (best one), mark the rest for deletion
        const [keepPost, ...duplicates] = sortedPosts;
        console.log(`Keeping post ${keepPost.id} (has tweet_id: ${!!keepPost.tweet_id})`);
        console.log(`Marking ${duplicates.length} duplicates for deletion:`, duplicates.map(p => ({ id: p.id, has_tweet_id: !!p.tweet_id })));
        
        postsToDelete.push(...duplicates.map(p => p.id));
      }
    }

    if (postsToDelete.length > 0) {
      console.log('Deleting duplicate posts with IDs:', postsToDelete);
      
      const { error } = await supabase
        .from('published_posts')
        .delete()
        .in('id', postsToDelete);

      if (error) {
        console.error('Error deleting duplicates:', error);
        onError("Failed to cleanup duplicate posts");
        return;
      }

      console.log('Successfully deleted duplicates');
      onSuccess(postsToDelete.length);
    } else {
      onSuccess(0);
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
    onError("Failed to cleanup duplicate posts");
  }
};
