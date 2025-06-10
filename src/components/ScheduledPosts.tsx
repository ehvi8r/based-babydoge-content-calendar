
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Trash2, RefreshCw, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import EditScheduledPostDialog from './EditScheduledPostDialog';

interface ScheduledPost {
  id: string;
  content: string;
  hashtags?: string;
  image_url?: string;
  scheduled_for: string;
  status: string;
  error_message?: string;
  retry_count: number;
  max_retries: number;
}

interface PublishedPost {
  id: string;
  original_scheduled_post_id: string;
  published_at: string;
  tweet_url?: string;
}

interface ScheduledPostsProps {
  onPostUpdate?: () => void;
}

const ScheduledPosts = ({ onPostUpdate }: ScheduledPostsProps) => {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [publishedPosts, setPublishedPosts] = useState<PublishedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setPosts([]);
        setPublishedPosts([]);
        setLoading(false);
        return;
      }

      // Load scheduled posts
      const { data: scheduledData, error: scheduledError } = await supabase
        .from('scheduled_posts')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_for', { ascending: true });

      if (scheduledError) {
        console.error('Error loading scheduled posts:', scheduledError);
        toast({
          title: "Error",
          description: "Failed to load scheduled posts",
          variant: "destructive",
        });
        return;
      }

      // Load published posts for reference
      const { data: publishedData, error: publishedError } = await supabase
        .from('published_posts')
        .select('*')
        .eq('user_id', user.id)
        .order('published_at', { ascending: false });

      if (publishedError) {
        console.error('Error loading published posts:', publishedError);
      }

      setPosts(scheduledData || []);
      setPublishedPosts(publishedData || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('scheduled-posts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scheduled_posts'
        },
        () => {
          loadPosts();
          onPostUpdate?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onPostUpdate]);

  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_posts')
        .delete()
        .eq('id', postId);

      if (error) {
        console.error('Error deleting post:', error);
        toast({
          title: "Error",
          description: "Failed to delete post",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Post Deleted",
        description: "The scheduled post has been deleted",
      });
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleRetryPost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_posts')
        .update({ 
          status: 'scheduled',
          error_message: null,
          retry_count: 0
        })
        .eq('id', postId);

      if (error) {
        console.error('Error retrying post:', error);
        toast({
          title: "Error",
          description: "Failed to retry post",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Post Reset for Retry",
        description: "The post has been reset and will be attempted again",
      });
    } catch (error) {
      console.error('Error retrying post:', error);
    }
  };

  const getStatusColor = (status: string, retryCount: number, maxRetries: number) => {
    if (retryCount >= maxRetries && status === 'scheduled') {
      return 'bg-orange-600'; // Max retries reached
    }
    switch (status) {
      case 'scheduled':
        return 'bg-blue-600';
      case 'publishing':
        return 'bg-yellow-600';
      case 'published':
        return 'bg-green-600';
      case 'failed':
        return 'bg-red-600';
      default:
        return 'bg-blue-600';
    }
  };

  const getStatusIcon = (status: string, retryCount: number, maxRetries: number) => {
    if (retryCount >= maxRetries && status === 'scheduled') {
      return <AlertTriangle size={12} />;
    }
    if (status === 'publishing') {
      return <Loader2 className="animate-spin" size={12} />;
    }
    if (status === 'published') {
      return <CheckCircle2 size={12} />;
    }
    return null;
  };

  const getStatusText = (status: string, retryCount: number, maxRetries: number) => {
    if (retryCount >= maxRetries && status === 'scheduled') {
      return 'failed (max retries)';
    }
    return status;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getPublishedInfo = (postId: string) => {
    return publishedPosts.find(p => p.original_scheduled_post_id === postId);
  };

  const getStatusDisplay = (post: ScheduledPost) => {
    const isMaxRetriesReached = post.retry_count >= post.max_retries;
    
    if (post.status === 'published') {
      const publishedInfo = getPublishedInfo(post.id);
      if (publishedInfo) {
        const publishedTime = new Date(publishedInfo.published_at).toLocaleString();
        return (
          <div className="space-y-1">
            <div className="text-green-300 text-xs font-medium">
              Posted to X at {publishedTime}
            </div>
            {publishedInfo.tweet_url && (
              <a 
                href={publishedInfo.tweet_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-xs underline"
              >
                View on X
              </a>
            )}
          </div>
        );
      }
    }

    if (isMaxRetriesReached && post.status === 'scheduled') {
      return (
        <div className="space-y-1">
          <div className="text-orange-300 text-xs font-medium">
            Failed after {post.retry_count} attempts
          </div>
          <div className="text-xs text-slate-400">
            Was scheduled for: {formatDateTime(post.scheduled_for)}
          </div>
        </div>
      );
    }

    return (
      <div className="text-xs text-slate-400">
        Scheduled for: {formatDateTime(post.scheduled_for)}
        {post.retry_count > 0 && (
          <div className="text-yellow-300">
            Retry count: {post.retry_count}/{post.max_retries}
          </div>
        )}
      </div>
    );
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
        <CardTitle className="text-white flex items-center gap-2">
          <Clock className="text-blue-400" size={20} />
          Scheduled Posts ({posts.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <div className="text-center py-6 text-slate-400">
            No scheduled posts yet
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-3 pr-4">
              {posts.map((post) => {
                const isMaxRetriesReached = post.retry_count >= post.max_retries;
                const canRetry = isMaxRetriesReached || post.status === 'failed';
                
                return (
                  <div key={post.id} className="bg-slate-700/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(post.status, post.retry_count, post.max_retries)}
                        <Badge 
                          variant="secondary" 
                          className={`${getStatusColor(post.status, post.retry_count, post.max_retries)} text-white`}
                        >
                          {getStatusText(post.status, post.retry_count, post.max_retries)}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        {post.status !== 'published' && (
                          <EditScheduledPostDialog post={post} onPostUpdate={loadPosts} />
                        )}
                        {canRetry && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0 text-blue-400 hover:bg-blue-400/20"
                            onClick={() => handleRetryPost(post.id)}
                            title="Reset and retry this post"
                          >
                            <RefreshCw size={12} />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0 text-red-400 hover:bg-red-400/20"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          <Trash2 size={12} />
                        </Button>
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

                    {post.error_message && (
                      <p className="text-red-300 text-xs bg-red-900/20 p-2 rounded">
                        Error: {post.error_message}
                      </p>
                    )}
                    
                    {getStatusDisplay(post)}

                    {isMaxRetriesReached && post.status === 'scheduled' && (
                      <div className="text-orange-300 text-xs bg-orange-900/20 p-2 rounded">
                        This post has reached the maximum number of retry attempts. Check your Twitter API configuration and click the retry button to try again.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default ScheduledPosts;
