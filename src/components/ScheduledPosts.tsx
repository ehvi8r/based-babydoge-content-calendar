
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Edit, Trash2 } from 'lucide-react';
import EditPostDialog from './EditPostDialog';

interface Post {
  id: string;
  content: string;
  date: string;
  time: string;
  status: string;
  hashtags?: string;
  imageUrl?: string;
}

interface ScheduledPostsProps {
  onPostUpdate?: (posts: Post[]) => void;
}

const ScheduledPosts = ({ onPostUpdate }: ScheduledPostsProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Load posts from localStorage on component mount
  useEffect(() => {
    const loadPosts = () => {
      const savedPosts = localStorage.getItem('scheduledPosts');
      if (savedPosts) {
        try {
          const parsedPosts = JSON.parse(savedPosts);
          setPosts(parsedPosts);
          console.log('Loaded scheduled posts from localStorage:', parsedPosts);
        } catch (error) {
          console.error('Error loading scheduled posts:', error);
        }
      } else {
        setPosts([]);
      }
    };

    loadPosts();
  }, []);

  // Save posts to localStorage whenever posts change and notify parent
  useEffect(() => {
    if (posts.length >= 0) {
      localStorage.setItem('scheduledPosts', JSON.stringify(posts));
      console.log('Saved scheduled posts to localStorage:', posts);
      onPostUpdate?.(posts);
    }
  }, [posts, onPostUpdate]);

  // Listen for external updates to scheduled posts
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'scheduledPosts' && e.newValue) {
        try {
          const updatedPosts = JSON.parse(e.newValue);
          setPosts(updatedPosts);
        } catch (error) {
          console.error('Error parsing updated scheduled posts:', error);
        }
      }
    };

    const handlePostsUpdate = () => {
      const savedPosts = localStorage.getItem('scheduledPosts');
      if (savedPosts) {
        try {
          const parsedPosts = JSON.parse(savedPosts);
          setPosts(parsedPosts);
          console.log('Posts updated via custom event:', parsedPosts);
        } catch (error) {
          console.error('Error loading updated scheduled posts:', error);
        }
      } else {
        setPosts([]);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('scheduledPostsUpdated', handlePostsUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('scheduledPostsUpdated', handlePostsUpdate);
    };
  }, []);

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setIsEditDialogOpen(true);
  };

  const handleSavePost = (updatedPost: Post) => {
    setPosts(posts.map(post => 
      post.id === updatedPost.id ? updatedPost : post
    ));
    setEditingPost(null);
    setIsEditDialogOpen(false);
    
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('scheduledPostsUpdated'));
  };

  const handleDeletePost = (postId: string) => {
    const updatedPosts = posts.filter(post => post.id !== postId);
    setPosts(updatedPosts);
    if (updatedPosts.length === 0) {
      localStorage.removeItem('scheduledPosts');
    }
    
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('scheduledPostsUpdated'));
  };

  // Sort posts by date and time (most recent first)
  const sortedPosts = [...posts].sort((a, b) => {
    const dateTimeA = new Date(`${a.date}T${a.time}`);
    const dateTimeB = new Date(`${b.date}T${b.time}`);
    return dateTimeB.getTime() - dateTimeA.getTime();
  });

  return (
    <>
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
                {sortedPosts.map((post) => (
                  <div key={post.id} className="bg-slate-700/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="bg-blue-600 text-white">
                        {post.status}
                      </Badge>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0 text-blue-400 hover:bg-blue-400/20"
                          onClick={() => handleEditPost(post)}
                        >
                          <Edit size={12} />
                        </Button>
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
                    
                    <div className="text-xs text-slate-400">
                      {post.date} at {post.time}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <EditPostDialog
        post={editingPost}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingPost(null);
        }}
        onSave={handleSavePost}
      />
    </>
  );
};

export default ScheduledPosts;
