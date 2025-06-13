
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Clock, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import PostMediaUpload from './PostMediaUpload';

interface SinglePostFormProps {
  onPostScheduled?: () => void;
}

const SinglePostForm = ({ onPostScheduled }: SinglePostFormProps) => {
  const [content, setContent] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Helper function to generate content hash using the database function
  const generateContentHash = async (content: string, hashtags: string = ''): Promise<string> => {
    try {
      const { data, error } = await supabase
        .rpc('generate_content_hash', {
          content_text: content,
          hashtags_text: hashtags || null
        });

      if (error) {
        console.error('Error generating content hash:', error);
        // Fallback to a simple hash if the database function fails
        return Math.abs(content.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0)).toString(16);
      }

      return data || '';
    } catch (error) {
      console.error('Error calling generate_content_hash:', error);
      // Fallback hash
      return Math.abs(content.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0)).toString(16);
    }
  };

  // Enhanced duplicate detection
  const checkForDuplicates = async (contentHash: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Check for duplicates in both scheduled and published posts within 48 hours
      const { data: isDuplicate, error } = await supabase
        .rpc('check_recent_duplicate', {
          p_user_id: user.id,
          p_content_hash: contentHash,
          p_hours_window: 48
        });

      if (error) {
        console.error('Error checking for duplicates:', error);
        return false;
      }

      return isDuplicate || false;
    } catch (error) {
      console.error('Error in duplicate check:', error);
      return false;
    }
  };

  const isValidFutureDateTime = (date: Date, time: string): boolean => {
    const scheduledDateTime = new Date(`${format(date, 'yyyy-MM-dd')}T${time}`);
    const now = new Date();
    return scheduledDateTime > now;
  };

  const handleSchedulePost = async () => {
    if (!content || !selectedDate || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!isValidFutureDateTime(selectedDate, selectedTime)) {
      const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
      toast({
        title: "Invalid Date/Time",
        description: isToday 
          ? "Please select a future time for today's date." 
          : "Cannot schedule posts in the past. Please select a future date and time.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to schedule posts",
          variant: "destructive",
        });
        return;
      }

      // Generate content hash
      const contentHash = await generateContentHash(content, hashtags);

      // Check for duplicates before submitting
      const isDuplicate = await checkForDuplicates(contentHash);
      if (isDuplicate) {
        toast({
          title: "Duplicate Content Detected",
          description: "Similar content has been posted recently. Please modify your content or wait before posting similar content.",
          variant: "destructive",
        });
        return;
      }

      const scheduledFor = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}`);

      const { error } = await supabase
        .from('scheduled_posts')
        .insert({
          user_id: user.id,
          content,
          hashtags,
          image_url: mediaUrls.length > 0 ? mediaUrls[0] : null, // Use first media URL
          scheduled_for: scheduledFor.toISOString(),
          status: 'scheduled' as const,
          content_hash: contentHash
        });

      if (error) {
        console.error('Error scheduling post:', error);
        toast({
          title: "Error",
          description: "Failed to schedule post. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Post Scheduled",
        description: `Your post has been scheduled for ${format(selectedDate, 'PPP')} at ${selectedTime}`,
      });

      // Reset form
      setContent('');
      setSelectedDate(undefined);
      setSelectedTime('');
      setHashtags('');
      setMediaUrls([]);
      
      // Notify parent component
      onPostScheduled?.();

    } catch (error) {
      console.error('Error scheduling post:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Card className="bg-slate-800/50 border-blue-500/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Sparkles className="text-blue-400" size={20} />
          Create New Post
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="content" className="text-blue-200">Content</Label>
          <Textarea
            id="content"
            placeholder="What's happening with BabyDoge today? Share updates, news, or engage with the community..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            maxLength={25000}
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-slate-400">
              {content.length}/25,000 characters (Premium X/Twitter limit)
            </span>
            <Badge variant={content.length > 24000 ? "destructive" : "secondary"}>
              {25000 - content.length} remaining
            </Badge>
          </div>
        </div>

        <div>
          <Label htmlFor="hashtags" className="text-blue-200">Hashtags</Label>
          <Input
            id="hashtags"
            placeholder="#BabyDoge #Crypto #Base #DeFi"
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
          />
        </div>

        <PostMediaUpload onMediaChange={setMediaUrls} />

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
            <Label htmlFor="time-input" className="text-blue-200">Time (HH:MM)</Label>
            <Input
              id="time-input"
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
              min={selectedDate && format(selectedDate, 'yyyy-MM-dd') === today ? format(new Date(), 'HH:mm') : undefined}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={handleSchedulePost}
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Clock className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Scheduling...' : 'Schedule Post'}
          </Button>
          <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
            Save Draft
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SinglePostForm;
