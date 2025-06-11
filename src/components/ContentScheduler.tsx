
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SinglePostForm from './SinglePostForm';
import BulkImportTab from './BulkImportTab';
import OptimalTimeSuggestions from './OptimalTimeSuggestions';
import ContentPreview from './ContentPreview';
import ScheduledPosts from './ScheduledPosts';
import PublishedPostsHistory from './PublishedPostsHistory';
import TwitterApiConfig from './TwitterApiConfig';
import ManualTrigger from './ManualTrigger';
import SchedulingDebugPanel from './SchedulingDebugPanel';
import AdBanner from './AdBanner';

const ContentScheduler = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const optimalTimes = [
    { time: '9:00 AM', engagement: 'High', reason: 'Morning commute' },
    { time: '1:00 PM', engagement: 'Medium', reason: 'Lunch break' },
    { time: '7:00 PM', engagement: 'High', reason: 'Evening social time' }
  ];

  const handlePostsUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    // Set up interval to check for posts to schedule every minute
    const interval = setInterval(async () => {
      try {
        // This could call the schedule-processor function
        // For now, we'll let the cron job handle it
        console.log('Checking for posts to schedule...');
      } catch (error) {
        console.error('Error in schedule check:', error);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Content Creation */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Content Scheduler</h1>
          <TwitterApiConfig />
        </div>

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
            <SinglePostForm onPostScheduled={handlePostsUpdate} />
          </TabsContent>
          
          <TabsContent value="bulk" className="mt-4">
            <BulkImportTab onPostsUpdate={handlePostsUpdate} />
          </TabsContent>
        </Tabs>

        {/* Ad Banner */}
        <AdBanner
          imageUrl="https://via.placeholder.com/728x90/1e293b/60a5fa?text=Your+Ad+Here"
          linkUrl="https://babydoge20.com"
          altText="BabyDoge Advertisement"
          title="Sponsored"
        />

        <ContentPreview content="" hashtags="" media={[]} />
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <OptimalTimeSuggestions times={optimalTimes} />
        <SchedulingDebugPanel />
        <ScheduledPosts onPostUpdate={handlePostsUpdate} />
        <PublishedPostsHistory />
      </div>
    </div>
  );
};

export default ContentScheduler;
