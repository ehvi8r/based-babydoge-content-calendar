
import { supabase } from '@/integrations/supabase/client';
import { PublishedPost } from '@/hooks/usePublishedPosts';

// Generate content hash on client side to match server-side generation
export const generateContentHash = (content: string, hashtags: string = ''): string => {
  const combinedContent = content + (hashtags || '');
  
  // Simple hash function for client-side (matches server-side SHA256 for basic duplicate detection)
  let hash = 0;
  for (let i = 0; i < combinedContent.length; i++) {
    const char = combinedContent.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
};

// Check for duplicates using database function
export const checkForRecentDuplicate = async (
  content: string, 
  hashtags: string = '', 
  hoursWindow: number = 24
): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }

    // Generate content hash using the database function
    const { data: hashResult, error: hashError } = await supabase
      .rpc('generate_content_hash', {
        content_text: content,
        hashtags_text: hashtags || null
      });

    if (hashError) {
      console.error('Error generating content hash:', hashError);
      return false;
    }

    // Check for recent duplicates using the database function
    const { data: isDuplicate, error } = await supabase
      .rpc('check_recent_duplicate', {
        p_user_id: user.id,
        p_content_hash: hashResult,
        p_hours_window: hoursWindow
      });

    if (error) {
      console.error('Error checking for duplicates:', error);
      return false;
    }

    return isDuplicate || false;
  } catch (error) {
    console.error('Error in duplicate check:', error);
    return false;
  }
};

export const hasPotentialDuplicates = (publishedPosts: PublishedPost[]): boolean => {
  const contentMap = new Map();
  for (const post of publishedPosts) {
    const key = post.content_hash || post.content.trim().toLowerCase().replace(/\s+/g, ' ');
    if (contentMap.has(key)) {
      console.log('Found duplicate content hash/content:', key);
      return true;
    }
    contentMap.set(key, true);
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

    // Group posts by content_hash (preferred) or normalized content
    const postGroups: Record<string, PublishedPost[]> = {};
    
    publishedPosts.forEach(post => {
      const key = post.content_hash || post.content.trim().toLowerCase().replace(/\s+/g, ' ');
      if (!postGroups[key]) {
        postGroups[key] = [];
      }
      postGroups[key].push(post);
    });

    console.log('Post groups created:', Object.keys(postGroups).length);

    const postsToDelete: string[] = [];

    // For each group of posts with the same content/hash
    Object.entries(postGroups).forEach(([key, posts]) => {
      if (posts.length > 1) {
        console.log(`Found ${posts.length} duplicates for key: "${key.substring(0, 50)}..."`);
        
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
      
      const { data, error } = await supabase
        .from('published_posts')
        .delete()
        .in('id', postsToDelete)
        .eq('user_id', user.id)
        .select('id');

      if (error) {
        console.error('Error deleting duplicate posts:', error);
        onError(`Failed to delete duplicates: ${error.message}`);
        return;
      }

      const deletedCount = data?.length || 0;
      console.log(`Successfully deleted ${deletedCount} duplicate posts:`, data);
      
      onSuccess(deletedCount);
    } else {
      console.log('No duplicates found to delete');
      onSuccess(0);
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
    onError(`Failed to cleanup duplicate posts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
