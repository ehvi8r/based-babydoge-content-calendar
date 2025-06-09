
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Edit, Trash2, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SpreadsheetPost {
  content: string;
  date: string;
  time: string;
  hashtags: string;
  status: string;
  imageUrl: string;
}

interface Post {
  id: string;
  content: string;
  date: string;
  time: string;
  status: string;
  hashtags?: string;
  imageUrl?: string;
}

interface ImportedPostsListProps {
  importedPosts: SpreadsheetPost[];
  scheduledPosts: Post[];
  onSchedulePost: (post: SpreadsheetPost, index: number) => void;
  onScheduleAll: () => void;
  onEditPost: (post: SpreadsheetPost, index: number) => void;
  onDeletePost: (index: number) => void;
}

const ImportedPostsList = ({ 
  importedPosts, 
  scheduledPosts, 
  onSchedulePost, 
  onScheduleAll, 
  onEditPost,
  onDeletePost 
}: ImportedPostsListProps) => {
  const [editingPost, setEditingPost] = useState<{ post: SpreadsheetPost; index: number } | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editHashtags, setEditHashtags] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState('');
  const { toast } = useToast();

  // Helper function to save image to localStorage
  const saveImageToStorage = (file: File): string => {
    const reader = new FileReader();
    const imageId = `image_${Date.now()}_${Math.random()}`;
    
    reader.onload = (e) => {
      if (e.target?.result) {
        localStorage.setItem(imageId, e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    
    return imageId;
  };

  const handleEditClick = (post: SpreadsheetPost, index: number) => {
    setEditingPost({ post, index });
    setEditContent(post.content || '');
    setEditHashtags(post.hashtags || '');
    setEditDate(post.date || '');
    setEditTime(post.time || '');
    setEditImageUrl(post.imageUrl || '');
    setEditImageFile(null);
    setEditImagePreview(post.imageUrl || '');
  };

  const isValidFutureDateTime = (date: string, time: string): boolean => {
    const now = new Date();
    const selectedDateTime = new Date(`${date}T${time}`);
    return selectedDateTime > now;
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload only image files",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload images smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      setEditImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setEditImagePreview(previewUrl);
      setEditImageUrl('');
    }
  };

  const removeImage = () => {
    setEditImageFile(null);
    setEditImageUrl('');
    if (editImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(editImagePreview);
    }
    setEditImagePreview('');
  };

  const handleSaveEdit = () => {
    if (!editingPost) return;

    if (!isValidFutureDateTime(editDate, editTime)) {
      toast({
        title: "Invalid Date/Time",
        description: "Please select a future date and time",
        variant: "destructive",
      });
      return;
    }

    let finalImageUrl = editImageUrl;
    
    // If there's a file, save it to localStorage and use the stored version
    if (editImageFile) {
      const imageId = saveImageToStorage(editImageFile);
      finalImageUrl = imageId;
    }

    const updatedPost: SpreadsheetPost = {
      content: editContent,
      hashtags: editHashtags,
      date: editDate,
      time: editTime,
      imageUrl: finalImageUrl,
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
    if (editImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(editImagePreview);
    }
    setEditContent('');
    setEditHashtags('');
    setEditDate('');
    setEditTime('');
    setEditImageUrl('');
    setEditImageFile(null);
    setEditImagePreview('');
  };

  const handleDeleteClick = (index: number) => {
    onDeletePost(index);
  };

  const today = new Date().toISOString().split('T')[0];

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
                {post.imageUrl && (
                  <div className="mb-2">
                    <img 
                      src={post.imageUrl.startsWith('image_') ? localStorage.getItem(post.imageUrl) || post.imageUrl : post.imageUrl} 
                      alt="Post image" 
                      className="w-16 h-16 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
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
                    variant="outline"
                    className="border-red-500 text-red-400 hover:bg-red-500/20"
                    onClick={() => handleDeleteClick(index)}
                  >
                    <Trash2 size={12} className="mr-1" />
                    Delete
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

            <div>
              <Label className="text-blue-200">Image</Label>
              <div className="space-y-3">
                <div className="flex gap-3 items-center">
                  <Label htmlFor="edit-image-upload" className="cursor-pointer">
                    <div className="flex items-center justify-center p-3 border-2 border-dashed border-orange-500/70 rounded-lg hover:border-orange-400 transition-colors bg-orange-500/20 hover:bg-orange-500/30">
                      <div className="text-center">
                        <Upload className="mx-auto h-5 w-5 text-orange-300 mb-1" />
                        <span className="text-xs text-orange-200 font-medium">Choose Image</span>
                      </div>
                    </div>
                  </Label>
                  <Input
                    id="edit-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  
                  {editImagePreview && (
                    <div className="relative">
                      <img 
                        src={editImagePreview} 
                        alt="Preview" 
                        className="w-16 h-16 object-cover rounded border border-slate-600"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full"
                      >
                        <X size={12} />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-slate-600"></div>
                  <span className="text-xs text-slate-400">OR</span>
                  <div className="flex-1 h-px bg-slate-600"></div>
                </div>

                <div>
                  <Label htmlFor="edit-image-url" className="text-blue-200">Image URL</Label>
                  <Input
                    id="edit-image-url"
                    value={editImageUrl}
                    onChange={(e) => {
                      setEditImageUrl(e.target.value);
                      setEditImagePreview(e.target.value);
                      if (editImageFile) {
                        setEditImageFile(null);
                        if (editImagePreview.startsWith('blob:')) {
                          URL.revokeObjectURL(editImagePreview);
                        }
                      }
                    }}
                    placeholder="https://example.com/image.jpg"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
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
                  min={today}
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
