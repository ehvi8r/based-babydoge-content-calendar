import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Edit, Upload, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

interface EditScheduledPostDialogProps {
  post: ScheduledPost;
  onPostUpdate?: () => void;
}

const EditScheduledPostDialog = ({ post, onPostUpdate }: EditScheduledPostDialogProps) => {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(post.content);
  const [hashtags, setHashtags] = useState(post.hashtags || '');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(post.scheduled_for));
  const [selectedTime, setSelectedTime] = useState(format(new Date(post.scheduled_for), 'HH:mm'));
  const [imageUrl, setImageUrl] = useState(post.image_url || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(post.image_url || '');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Helper function to upload image to Supabase storage
  const uploadImageToStorage = async (file: File): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('media-uploads')
      .upload(fileName, file);

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('media-uploads')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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

    setUploadingImage(true);
    try {
      const uploadedUrl = await uploadImageToStorage(file);
      setImageFile(file);
      setImagePreview(uploadedUrl);
      setImageUrl(uploadedUrl);
      
      toast({
        title: "Image uploaded",
        description: "Image has been uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImageUrl('');
    if (imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview('');
  };

  const handleUpdatePost = async () => {
    if (!content || !selectedDate || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const scheduledFor = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}`);
    const now = new Date();
    
    if (scheduledFor <= now) {
      toast({
        title: "Invalid Date/Time",
        description: "Cannot schedule posts in the past. Please select a future date and time.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('scheduled_posts')
        .update({
          content,
          hashtags,
          image_url: imageUrl || null,
          scheduled_for: scheduledFor.toISOString(),
        })
        .eq('id', post.id);

      if (error) {
        console.error('Error updating post:', error);
        toast({
          title: "Error",
          description: "Failed to update post. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Post Updated",
        description: `Your post has been updated and scheduled for ${format(selectedDate, 'PPP')} at ${selectedTime}`,
      });

      setOpen(false);
      onPostUpdate?.();

    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseDialog = () => {
    setOpen(false);
    // Reset state to original values
    setContent(post.content);
    setHashtags(post.hashtags || '');
    setSelectedDate(new Date(post.scheduled_for));
    setSelectedTime(format(new Date(post.scheduled_for), 'HH:mm'));
    setImageUrl(post.image_url || '');
    setImageFile(null);
    setImagePreview(post.image_url || '');
    if (imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        handleCloseDialog();
      } else {
        setOpen(newOpen);
      }
    }}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0 text-blue-400 hover:bg-blue-400/20"
        >
          <Edit size={12} />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-600 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Scheduled Post</DialogTitle>
          <DialogDescription className="text-slate-400">
            Modify your scheduled post content, hashtags, and timing.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="content" className="text-blue-200">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              maxLength={25000}
            />
          </div>

          <div>
            <Label htmlFor="hashtags" className="text-blue-200">Hashtags</Label>
            <Input
              id="hashtags"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>

          <div>
            <Label className="text-blue-200">Image</Label>
            <div className="space-y-3">
              <div className="flex gap-3 items-center">
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <div className="flex items-center justify-center p-3 border-2 border-dashed border-slate-300/50 rounded-lg hover:border-slate-200 transition-colors bg-slate-50/10 hover:bg-slate-50/20">
                    <div className="text-center">
                      <Upload className="mx-auto h-5 w-5 text-slate-300 mb-1" />
                      <span className="text-xs text-slate-200 font-medium">
                        {uploadingImage ? 'Uploading...' : 'Choose Image'}
                      </span>
                    </div>
                  </div>
                </Label>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
                
                {imagePreview && (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
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
                <Label htmlFor="image-url" className="text-blue-200">Image URL</Label>
                <Input
                  id="image-url"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImagePreview(e.target.value);
                    if (imageFile) {
                      setImageFile(null);
                      if (imagePreview.startsWith('blob:')) {
                        URL.revokeObjectURL(imagePreview);
                      }
                    }
                  }}
                  placeholder="https://example.com/image.jpg"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-blue-200">Schedule Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-slate-700 border-slate-600 text-white",
                      !selectedDate && "text-slate-400"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-600">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    className="pointer-events-auto"
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="time-input" className="text-blue-200">Time (HH:MM)</Label>
              <Input
                id="time-input"
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleUpdatePost}
              disabled={isSubmitting || uploadingImage}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? 'Updating...' : 'Update Post'}
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
  );
};

export default EditScheduledPostDialog;
