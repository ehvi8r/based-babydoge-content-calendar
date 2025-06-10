import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink, CheckCircle, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PublishedPost {
  id: string;
  content: string;
  hashtags?: string;
  image_url?: string;
  tweet_id?: string;
  tweet_url?: string;
  published_at: string;
}

const PublishedPostsHistory = () => {
  const [publishedPosts, setPublishedPosts] = useState<PublishedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const { toast } = useToast();

  const loadPublishedPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setPublishedPosts([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('published_posts')
        .select('*')
        .eq('user_id', user.id)
        .order('published_at', { ascending: false });

      if (error) {
        console.error('Error loading published posts:', error);
        toast({
          title: "Error",
          description: "Failed to load published posts",
          variant: "destructive",
        });
        return;
      }

      setPublishedPosts(data || []);
    } catch (error) {
      console.error('Error loading published posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const cleanupDuplicates = async () => {
    setCleaning(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "User not authenticated",
          variant: "destructive",
        });
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
          toast({
            title: "Error",
            description: "Failed to cleanup duplicate posts",
            variant: "destructive",
          });
          return;
        }

        console.log('Successfully deleted duplicates');
        toast({
          title: "Cleanup Complete",
          description: `Removed ${postsToDelete.length} duplicate post(s)`,
        });

        // Reload the posts
        await loadPublishedPosts();
      } else {
        toast({
          title: "No Duplicates Found",
          description: "All posts are unique",
        });
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
      toast({
        title: "Error",
        description: "Failed to cleanup duplicate posts",
        variant: "destructive",
      });
    } finally {
      setCleaning(false);
    }
  };

  useEffect(() => {
    loadPublishedPosts();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('published-posts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'published_posts'
        },
        (payload) => {
          console.log('New published post:', payload);
          loadPublishedPosts();
          toast({
            title: "Post Published!",
            description: "Your scheduled post has been published to X/Twitter",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  // Check if there are potential duplicates
  const hasPotentialDuplicates = () => {
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

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-blue-500/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-400" size={24} />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-blue-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <CheckCircle className="text-green-400" size={20} />
            Published Posts History ({publishedPosts.length})
          </CardTitle>
          {hasPotentialDuplicates() && (
            <Button
              variant="outline"
              size="sm"
              onClick={cleanupDuplicates}
              disabled={cleaning}
              className="border-red-500/50 text-red-400 hover:bg-red-500/20"
            >
              {cleaning ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <Trash2 size={14} />
              )}
              {cleaning ? 'Cleaning...' : 'Remove Duplicates'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {publishedPosts.length === 0 ? (
          <div className="text-center py-6 text-slate-400">
            No published posts yet
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-3 pr-4">
              {publishedPosts.map((post) => (
                <div key={post.id} className="bg-slate-700/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="text-green-400" size={16} />
                      <Badge variant="secondary" className="bg-green-600 text-white">
                        published
                      </Badge>
                      {!post.tweet_id && (
                        <Badge variant="secondary" className="bg-yellow-600 text-white">
                          no tweet id
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex gap-1">
                      {post.tweet_url && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0 text-green-400 hover:bg-green-400/20"
                          onClick={() => window.open(post.tweet_url, '_blank')}
                        >
                          <ExternalLink size={12} />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-white text-sm line-clamp-2">
                    {post.content}
                  </p>

                  {post.image_url && (
                    <div className="mt-2">
                      <img 
                        src={post.image_url} 
                        alt="Post image" 
                        className="w-16 h-16 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  {post.hashtags && (
                    <p className="text-blue-300 text-xs">
                      {post.hashtags}
                    </p>
                  )}
                  
                  <div className="text-xs text-slate-400">
                    Published: {formatDate(post.published_at)}
                    {post.tweet_id && (
                      <div>Tweet ID: {post.tweet_id}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default PublishedPostsHistory;
