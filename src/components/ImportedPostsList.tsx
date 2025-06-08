
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SpreadsheetPost {
  content: string;
  date: string;
  time: string;
  hashtags: string;
  status: string;
}

interface Post {
  id: string;
  content: string;
  date: string;
  time: string;
  status: string;
  hashtags?: string;
}

interface ImportedPostsListProps {
  importedPosts: SpreadsheetPost[];
  scheduledPosts: Post[];
  onSchedulePost: (post: SpreadsheetPost, index: number) => void;
  onScheduleAll: () => void;
  onEditPost: (post: SpreadsheetPost, index: number) => void;
}

const ImportedPostsList = ({ 
  importedPosts, 
  scheduledPosts, 
  onSchedulePost, 
  onScheduleAll, 
  onEditPost 
}: ImportedPostsListProps) => {
  const [editingPost, setEditingPost] = useState<{ post: SpreadsheetPost; index: number } | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editHashtags, setEditHashtags] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const { toast } = useToast();

  const handleEditClick = (post: SpreadsheetPost, index: number) => {
    setEditingPost({ post, index });
    // Populate form fields with existing data
    setEditContent(post.content || '');
    setEditHashtags(post.hashtags || '');
    setEditDate(post.date || '');
    setEditTime(post.time || '');
  };

  const handleSaveEdit = () => {
    if (!editingPost) return;

    const updatedPost: SpreadsheetPost = {
      content: editContent,
      hashtags: editHashtags,
      date: editDate,
      time: editTime,
      status: 'imported'
    };

    onEditPost(updatedPost, editingPost.index);
    setEditingPost(null);
    
    toast({
      title: "Post Updated",
      description: "Imported post has been updated successfully",
    });
  };

  const handleCloseDialog = () => {
    setEditingPost(null);
    // Reset form fields when closing
    setEditContent('');
    setEditHashtags('');
    setEditDate('');
    setEditTime('');
  };

  if (importedPosts.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="bg-slate-800/50 border-blue-500/20 mt-4">
        <CardHeader>
          <CardTitle className="text-white">Imported Posts ({importedPosts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {importedPosts.map((post, index) => (
              <div key={index} className="bg-slate-700/50 rounded-lg p-3">
                <p className="text-white text-sm mb-2">{post.content}</p>
                <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
                  <span>{post.date} at {post.time}</span>
                  <span>{post.hashtags}</span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-blue-500 text-blue-400 hover:bg-blue-500/20"
                    onClick={() => handleEditClick(post, index)}
                  >
                    <Edit size={12} className="mr-1" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => onSchedulePost(post, index)}
                  >
                    Schedule This Post
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Button 
            className="w-full mt-4 bg-green-600 hover:bg-green-700"
            onClick={onScheduleAll}
          >
            Schedule All Posts
          </Button>
        </CardContent>
      </Card>

      <Dialog open={!!editingPost} onOpenChange={handleCloseDialog}>
        <DialogContent className="bg-slate-800 border-slate-600 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Imported Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-content" className="text-blue-200">Content</Label>
              <Textarea
                id="edit-content"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[120px] bg-slate-700 border-slate-600 text-white"
                maxLength={25000}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-hashtags" className="text-blue-200">Hashtags</Label>
              <Input
                id="edit-hashtags"
                value={editHashtags}
                onChange={(e) => setEditHashtags(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-date" className="text-blue-200">Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="edit-time" className="text-blue-200">Time</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleSaveEdit}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Save Changes
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCloseDialog}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImportedPostsList;
