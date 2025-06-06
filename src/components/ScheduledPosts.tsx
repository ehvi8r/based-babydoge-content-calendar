
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Edit, Trash2 } from 'lucide-react';
import EditPostDialog from './EditPostDialog';

interface Post {
  id: string;
  content: string;
  date: string;
  time: string;
  status: string;
  hashtags?: string;
}

const ScheduledPosts = () => {
  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1',
      content: 'Exciting news! BabyDoge is making waves in the DeFi space...',
      date: '2024-01-15',
      time: '09:00',
      status: 'scheduled',
      hashtags: '#BabyDoge #DeFi #Crypto'
    },
    {
      id: '2',
      content: 'Community update: Our latest partnership announcement...',
      date: '2024-01-15',
      time: '13:00',
      status: 'scheduled',
      hashtags: '#BabyDoge #Partnership #Announcement'
    },
    {
      id: '3',
      content: 'Weekly market analysis and BabyDoge performance...',
      date: '2024-01-15',
      time: '19:00',
      status: 'scheduled',
      hashtags: '#BabyDoge #MarketAnalysis #Weekly'
    }
  ]);

  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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
  };

  const handleDeletePost = (postId: string) => {
    setPosts(posts.filter(post => post.id !== postId));
  };

  return (
    <>
      <Card className="bg-slate-800/50 border-blue-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="text-blue-400" size={20} />
            Scheduled Posts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {posts.length === 0 ? (
            <div className="text-center py-6 text-slate-400">
              No scheduled posts yet
            </div>
          ) : (
            posts.map((post) => (
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
                
                {post.hashtags && (
                  <p className="text-blue-300 text-xs">
                    {post.hashtags}
                  </p>
                )}
                
                <div className="text-xs text-slate-400">
                  {post.date} at {post.time}
                </div>
              </div>
            ))
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
