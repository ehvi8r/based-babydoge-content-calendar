
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, Clock, Image, Video, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import OptimalTimeSuggestions from './OptimalTimeSuggestions';
import MediaUpload from './MediaUpload';
import ContentPreview from './ContentPreview';
import ScheduledPosts from './ScheduledPosts';
import SpreadsheetUpload from './SpreadsheetUpload';

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

const ContentScheduler = () => {
  const [content, setContent] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [importedPosts, setImportedPosts] = useState<SpreadsheetPost[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<Post[]>([]);
  const { toast } = useToast();

  const optimalTimes = [
    { time: '9:00 AM', engagement: 'High', reason: 'Morning commute' },
    { time: '1:00 PM', engagement: 'Medium', reason: 'Lunch break' },
    { time: '7:00 PM', engagement: 'High', reason: 'Evening social time' }
  ];

  // Load scheduled posts from localStorage on mount
  useEffect(() => {
    const savedPosts = localStorage.getItem('scheduledPosts');
    if (savedPosts) {
      try {
        const parsedPosts = JSON.parse(savedPosts);
        setScheduledPosts(parsedPosts);
      } catch (error) {
        console.error('Error loading scheduled posts:', error);
      }
    }
  }, []);

  const handlePostsImported = (posts: SpreadsheetPost[]) => {
    setImportedPosts(posts);
    console.log('Imported posts:', posts);
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

    const newPost: Post = {
      id: Date.now().toString(),
      content,
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: selectedTime,
      hashtags,
      status: 'scheduled'
    };

    const updatedPosts = [...scheduledPosts, newPost];
    setScheduledPosts(updatedPosts);
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

  const handleScheduleImportedPost = (importedPost: SpreadsheetPost, index: number) => {
    const newPost: Post = {
      id: `imported-${Date.now()}-${index}`,
      content: importedPost.content,
      date: importedPost.date,
      time: importedPost.time,
      hashtags: importedPost.hashtags,
      status: 'scheduled'
    };

    const updatedPosts = [...scheduledPosts, newPost];
    setScheduledPosts(updatedPosts);
    localStorage.setItem('scheduledPosts', JSON.stringify(updatedPosts));

    // Remove from imported posts
    setImportedPosts(prev => prev.filter((_, i) => i !== index));

    toast({
      title: "Post Scheduled",
      description: "Imported post has been scheduled successfully",
    });
  };

  const handleScheduleAllImported = () => {
    const newPosts: Post[] = importedPosts.map((importedPost, index) => ({
      id: `imported-${Date.now()}-${index}`,
      content: importedPost.content,
      date: importedPost.date,
      time: importedPost.time,
      hashtags: importedPost.hashtags,
      status: 'scheduled'
    }));

    const updatedPosts = [...scheduledPosts, ...newPosts];
    setScheduledPosts(updatedPosts);
    localStorage.setItem('scheduledPosts', JSON.stringify(updatedPosts));

    toast({
      title: "All Posts Scheduled",
      description: `${importedPosts.length} posts have been scheduled successfully`,
    });

    setImportedPosts([]);
  };

  const handlePostsUpdate = (posts: Post[]) => {
    setScheduledPosts(posts);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Content Creation */}
      <div className="lg:col-span-2 space-y-6">
        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 border border-blue-500/20">
            <TabsTrigger 
              value="single" 
              className="text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Single Post
            </TabsTrigger>
            <TabsTrigger 
              value="bulk" 
              className="text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Bulk Import
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="single" className="mt-4">
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
          </TabsContent>
          
          <TabsContent value="bulk" className="mt-4">
            <SpreadsheetUpload onPostsImported={handlePostsImported} />
            
            {importedPosts.length > 0 && (
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
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleScheduleImportedPost(post, index)}
                        >
                          Schedule This Post
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button 
                    className="w-full mt-4 bg-green-600 hover:bg-green-700"
                    onClick={handleScheduleAllImported}
                  >
                    Schedule All Posts
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <ContentPreview content={content} hashtags={hashtags} media={mediaFiles} />
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <OptimalTimeSuggestions times={optimalTimes} />
        <ScheduledPosts onPostUpdate={handlePostsUpdate} />
      </div>
    </div>
  );
};

export default ContentScheduler;
