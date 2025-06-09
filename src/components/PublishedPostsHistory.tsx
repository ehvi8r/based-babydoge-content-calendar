
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { postScheduler } from '@/services/postScheduler';
import { useToast } from '@/hooks/use-toast';

interface PublishedPost {
  id: string;
  content: string;
  date: string;
  time: string;
  status: string;
  hashtags?: string;
  imageUrl?: string;
  publishedAt?: string;
  tweetId?: string;
  tweetUrl?: string;
  error?: string;
}

const PublishedPostsHistory = () => {
  const [publishedPosts, setPublishedPosts] = useState<PublishedPost[]>([]);
  const { toast } = useToast();

  // Load published posts from localStorage
  useEffect(() => {
    const loadPublishedPosts = () => {
      const savedPosts = localStorage.getItem('publishedPosts');
      if (savedPosts) {
        try {
          const parsedPosts = JSON.parse(savedPosts);
          setPublishedPosts(parsedPosts);
        } catch (error) {
          console.error('Error loading published posts:', error);
        }
      }
    };

    loadPublishedPosts();

    // Listen for new published posts
    const handlePostPublished = (event: CustomEvent) => {
      loadPublishedPosts();
      toast({
        title: "Post Published!",
        description: "Your scheduled post has been published to X/Twitter",
      });
    };

    window.addEventListener('postPublished', handlePostPublished as EventListener);
    
    return () => {
      window.removeEventListener('postPublished', handlePostPublished as EventListener);
    };
  }, [toast]);

  const handleRetryPost = async (postId: string) => {
    await postScheduler.retryFailedPost(postId);
    toast({
      title: "Retrying Post",
      description: "Attempting to publish the failed post again",
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="text-green-400" size={16} />;
      case 'failed':
        return <AlertCircle className="text-red-400" size={16} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-600';
      case 'failed':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

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
                      
                      {post.tweetUrl && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0 text-green-400 hover:bg-green-400/20"
                          onClick={() => window.open(post.tweetUrl, '_blank')}
                        >
                          <ExternalLink size={12} />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-white text-sm line-clamp-2">
                    {post.content}
                  </p>

                  {post.imageUrl && (
                    <div className="mt-2">
                      <img 
                        src={post.imageUrl} 
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

                  {post.error && (
                    <p className="text-red-300 text-xs bg-red-900/20 p-2 rounded">
                      Error: {post.error}
                    </p>
                  )}
                  
                  <div className="text-xs text-slate-400">
                    Scheduled: {post.date} at {post.time}
                    {post.publishedAt && (
                      <div>Published: {formatDate(post.publishedAt)}</div>
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
