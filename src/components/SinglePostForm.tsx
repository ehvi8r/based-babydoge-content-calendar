
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Clock, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import MediaUpload from './MediaUpload';

interface Post {
  id: string;
  content: string;
  date: string;
  time: string;
  status: string;
  hashtags?: string;
}

interface SinglePostFormProps {
  scheduledPosts: Post[];
  onPostScheduled: (posts: Post[]) => void;
}

const SinglePostForm = ({ scheduledPosts, onPostScheduled }: SinglePostFormProps) => {
  const [content, setContent] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const isValidFutureDate = (date: Date, time: string): boolean => {
    const scheduledDateTime = new Date(`${format(date, 'yyyy-MM-dd')}T${time}`);
    const now = new Date();
    return scheduledDateTime > now;
  };

  const handleSchedulePost = () => {
    if (!content || !selectedDate || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate that the scheduled date/time is in the future
    if (!isValidFutureDate(selectedDate, selectedTime)) {
      toast({
        title: "Invalid Date",
        description: "Cannot schedule posts in the past. Please select a future date and time.",
        variant: "destructive",
      });
      return;
    }

    const newPost: Post = {
      id: Date.now().toString(),
      content,
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: selectedTime,
      hashtags,
      status: 'scheduled'
    };

    const updatedPosts = [...scheduledPosts, newPost];
    onPostScheduled(updatedPosts);
    localStorage.setItem('scheduledPosts', JSON.stringify(updatedPosts));
    
    toast({
      title: "Post Scheduled",
      description: `Your post has been scheduled for ${format(selectedDate, 'PPP')} at ${selectedTime}`,
    });

    // Reset form
    setContent('');
    setSelectedDate(undefined);
    setSelectedTime('');
    setHashtags('');
    setMediaFiles([]);
  };

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

        <MediaUpload onMediaChange={setMediaFiles} />

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
                  disabled={(date) => date < new Date() || date > new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)}
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

        <div className="flex gap-3">
          <Button 
            onClick={handleSchedulePost}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Clock className="mr-2 h-4 w-4" />
            Schedule Post
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
