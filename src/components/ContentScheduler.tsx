
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
import GlobalBannerManager from './GlobalBannerManager';
import TeamManagement from './TeamManagement';
import { useGlobalBanners } from '@/hooks/useGlobalBanners';
import { useUserRole } from '@/hooks/useUserRole';

const ContentScheduler = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const { banners, loading: bannersLoading } = useGlobalBanners();
  const { isAdmin, isTeamMember } = useUserRole();

  const optimalTimes = [
    { time: '9:00 AM', engagement: 'High', reason: 'Morning commute' },
    { time: '1:00 PM', engagement: 'Medium', reason: 'Lunch break' },
    { time: '7:00 PM', engagement: 'High', reason: 'Evening social time' }
  ];

  const handlePostsUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Show loading state while banners are loading
  if (bannersLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Get the first active banner
  const activeBanner = banners.find(banner => banner.is_active);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Content Creation */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Content Scheduler</h1>
          <TwitterApiConfig />
        </div>

        {/* Team members see read-only notice */}
        {isTeamMember && (
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <div className="text-blue-300 text-sm">
              <strong>Team Member Access:</strong> You have read-only access to view and monitor content. 
              Content creation and editing is restricted to the admin.
            </div>
          </div>
        )}

        {/* Only show content creation tabs for admin and regular users */}
        {!isTeamMember && (
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
        )}

        {/* Admin-only components */}
        {isAdmin && (
          <>
            <GlobalBannerManager />
            <TeamManagement />
          </>
        )}

        {/* Global Banner Display - Show for all users */}
        {activeBanner && (
          <AdBanner
            imageUrl={activeBanner.image_url}
            linkUrl={activeBanner.link_url}
            altText={activeBanner.title || "BabyDoge Advertisement"}
            title="Sponsored"
          />
        )}

        {/* Content Preview - Only for content creators */}
        {!isTeamMember && (
          <ContentPreview content="" hashtags="" media={[]} />
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <OptimalTimeSuggestions times={optimalTimes} />
        {isAdmin && <SchedulingDebugPanel />}
        <ScheduledPosts onPostUpdate={handlePostsUpdate} />
        <PublishedPostsHistory />
      </div>
    </div>
  );
};

export default ContentScheduler;
