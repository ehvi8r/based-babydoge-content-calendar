
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Upload, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Post {
  id: string;
  content: string;
  date: string;
  time: string;
  status: string;
  hashtags?: string;
  imageUrl?: string;
}

interface EditPostDialogProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (post: Post) => void;
}

const EditPostDialog = ({ post, isOpen, onClose, onSave }: EditPostDialogProps) => {
  const [content, setContent] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
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

  useEffect(() => {
    if (post) {
      setContent(post.content);
      setSelectedDate(new Date(post.date));
      setSelectedTime(post.time);
      setHashtags(post.hashtags || '');
      
      // Handle image loading from localStorage if it's an ID
      if (post.imageUrl) {
        if (post.imageUrl.startsWith('image_')) {
          const storedImage = localStorage.getItem(post.imageUrl);
          setImagePreviewUrl(storedImage || post.imageUrl);
        } else {
          setImagePreviewUrl(post.imageUrl);
        }
      } else {
        setImagePreviewUrl('');
      }
      setImageFile(null);
    }
  }, [post]);

  const isValidFutureDateTime = (date: Date, time: string): boolean => {
    const now = new Date();
    const scheduledDateTime = new Date(`${format(date, 'yyyy-MM-dd')}T${time}`);
    return scheduledDateTime > now;
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

      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreviewUrl(previewUrl);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreviewUrl('');
    if (imagePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
  };

  const handleSave = () => {
    if (!post || !content || !selectedDate || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!isValidFutureDateTime(selectedDate, selectedTime)) {
      toast({
        title: "Invalid Date/Time",
        description: "Cannot schedule posts in the past. Please select a future date and time.",
        variant: "destructive",
      });
      return;
    }

    let finalImageUrl = imagePreviewUrl;
    
    // If there's a new file, save it to localStorage
    if (imageFile) {
      const imageId = saveImageToStorage(imageFile);
      finalImageUrl = imageId;
    }

    const updatedPost = {
      ...post,
      content,
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: selectedTime,
      hashtags,
      imageUrl: finalImageUrl,
    };

    onSave(updatedPost);
    toast({
      title: "Post Updated",
      description: "Your scheduled post has been updated successfully",
    });
    onClose();
  };

  const handleClose = () => {
    if (imagePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    onClose();
  };

  if (!post) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-blue-500/20 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Scheduled Post</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-content" className="text-blue-200">Content</Label>
            <Textarea
              id="edit-content"
              placeholder="Edit your post content..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              maxLength={25000}
            />
            <div className="text-xs text-slate-400 mt-1">
              {content.length}/25,000 characters (Premium X/Twitter limit)
            </div>
          </div>

          <div>
            <Label htmlFor="edit-hashtags" className="text-blue-200">Hashtags</Label>
            <Input
              id="edit-hashtags"
              placeholder="#BabyDoge #Crypto #Base #DeFi"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>

          <div>
            <Label className="text-blue-200">Image Upload</Label>
            <div className="flex gap-3">
              <Label htmlFor="edit-image-upload" className="cursor-pointer">
                <div className="flex items-center justify-center p-3 border-2 border-dashed border-orange-500/50 rounded-lg hover:border-orange-400 transition-colors bg-orange-500/10 hover:bg-orange-500/20">
                  <div className="text-center">
                    <Upload className="mx-auto h-5 w-5 text-orange-400 mb-1" />
                    <span className="text-xs text-orange-300 font-medium">Choose Image</span>
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
              
              {imagePreviewUrl && (
                <div className="relative">
                  <img 
                    src={imagePreviewUrl} 
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
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0)) || date > new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="text-blue-200">Time</Label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {Array.from({ length: 24 }, (_, i) => {
                    const hour = i.toString().padStart(2, '0');
                    return (
                      <SelectItem key={i} value={`${hour}:00`} className="text-white">
                        {hour}:00
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleSave}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Changes
            </Button>
            <Button 
              variant="outline" 
              onClick={handleClose}
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

export default EditPostDialog;
