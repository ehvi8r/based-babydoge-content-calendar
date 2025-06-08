
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SinglePostForm from './SinglePostForm';
import BulkImportTab from './BulkImportTab';
import OptimalTimeSuggestions from './OptimalTimeSuggestions';
import ContentPreview from './ContentPreview';
import ScheduledPosts from './ScheduledPosts';

interface Post {
  id: string;
  content: string;
  date: string;
  time: string;
  status: string;
  hashtags?: string;
}

const ContentScheduler = () => {
  const [scheduledPosts, setScheduledPosts] = useState<Post[]>([]);

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
            <SinglePostForm 
              scheduledPosts={scheduledPosts}
              onPostScheduled={handlePostsUpdate}
            />
          </TabsContent>
          
          <TabsContent value="bulk" className="mt-4">
            <BulkImportTab
              scheduledPosts={scheduledPosts}
              onPostsUpdate={handlePostsUpdate}
            />
          </TabsContent>
        </Tabs>

        <ContentPreview content="" hashtags="" media={[]} />
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
