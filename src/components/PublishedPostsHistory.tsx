
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink, CheckCircle, Loader2 } from 'lucide-react';
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
          <CheckCircle className="text-green-400" size={20} />
          Published Posts History ({publishedPosts.length})
        </CardTitle>
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
