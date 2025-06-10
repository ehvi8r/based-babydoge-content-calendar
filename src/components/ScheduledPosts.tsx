
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Edit, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ScheduledPost {
  id: string;
  content: string;
  hashtags?: string;
  image_url?: string;
  scheduled_for: string;
  status: string;
  error_message?: string;
  retry_count: number;
}

interface ScheduledPostsProps {
  onPostUpdate?: () => void;
}

const ScheduledPosts = ({ onPostUpdate }: ScheduledPostsProps) => {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setPosts([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('scheduled_posts')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_for', { ascending: true });

      if (error) {
        console.error('Error loading posts:', error);
        toast({
          title: "Error",
          description: "Failed to load scheduled posts",
          variant: "destructive",
        });
        return;
      }

      setPosts(data || []);
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
          error_message: null 
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
        title: "Post Queued for Retry",
        description: "The post will be attempted again at the next scheduled time",
      });
    } catch (error) {
      console.error('Error retrying post:', error);
    }
  };

  const getStatusColor = (status: string) => {
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

  const getStatusIcon = (status: string) => {
    if (status === 'publishing') {
      return <Loader2 className="animate-spin" size={12} />;
    }
    return null;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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
              {posts.map((post) => (
                <div key={post.id} className="bg-slate-700/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(post.status)}
                      <Badge variant="secondary" className={`${getStatusColor(post.status)} text-white`}>
                        {post.status}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      {post.status === 'failed' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0 text-blue-400 hover:bg-blue-400/20"
                          onClick={() => handleRetryPost(post.id)}
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
                  
                  <div className="text-xs text-slate-400">
                    Scheduled for: {formatDateTime(post.scheduled_for)}
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

export default ScheduledPosts;
