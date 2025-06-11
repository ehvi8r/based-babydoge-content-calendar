
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import MediaUpload from '@/components/MediaUpload';

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
  const [imageUrls, setImageUrls] = useState<string[]>(post.image_url ? [post.image_url] : []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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
          image_url: imageUrls.length > 0 ? imageUrls[0] : null,
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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

          {/* Media Upload Component with initial files */}
          <MediaUpload 
            onMediaChange={setImageUrls} 
            initialFiles={post.image_url ? [post.image_url] : []}
          />

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
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? 'Updating...' : 'Update Post'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
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
