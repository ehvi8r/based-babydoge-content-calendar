
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, Loader2, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePublishedPosts } from '@/hooks/usePublishedPosts';
import { hasPotentialDuplicates, cleanupDuplicates } from '@/utils/duplicatePostUtils';
import PublishedPostItem from './PublishedPostItem';

const PublishedPostsHistory = () => {
  const { publishedPosts, loading, loadPublishedPosts } = usePublishedPosts();
  const [cleaning, setCleaning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const handleRefresh = async () => {
    setRefreshing(true);
    console.log('Manually refreshing published posts...');
    try {
      await loadPublishedPosts();
      toast({
        title: "Refreshed",
        description: "Published posts list has been refreshed",
      });
    } catch (error) {
      console.error('Error refreshing posts:', error);
      toast({
        title: "Error",
        description: "Failed to refresh posts",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleCleanupDuplicates = async () => {
    if (cleaning) return;
    
    console.log('Starting cleanup process... Current posts:', publishedPosts.length);
    setCleaning(true);
    
    try {
      await cleanupDuplicates(
        publishedPosts,
        async (count) => {
          console.log(`Cleanup completed, removed ${count} posts`);
          if (count > 0) {
            toast({
              title: "Cleanup Complete",
              description: `Removed ${count} duplicate post(s)`,
            });
            
            // Force multiple refreshes to ensure data is updated
            console.log('Forcing data refresh after cleanup...');
            await new Promise(resolve => setTimeout(resolve, 500));
            await loadPublishedPosts();
            
            // Additional refresh after a delay to ensure consistency
            setTimeout(async () => {
              console.log('Secondary refresh to ensure data consistency...');
              await loadPublishedPosts();
            }, 1000);
          } else {
            toast({
              title: "No Duplicates Found",
              description: "All posts are unique",
            });
          }
        },
        (error) => {
          console.error('Cleanup error:', error);
          toast({
            title: "Error",
            description: error,
            variant: "destructive",
          });
        }
      );
    } catch (error) {
      console.error('Unexpected error during cleanup:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during cleanup",
        variant: "destructive",
      });
    } finally {
      setCleaning(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-blue-500/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-400" size={24} />
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasDuplicates = hasPotentialDuplicates(publishedPosts);
  console.log('Has duplicates:', hasDuplicates, 'Posts count:', publishedPosts.length);

  return (
    <Card className="bg-slate-800/50 border-blue-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <CheckCircle className="text-green-400" size={20} />
            Published Posts History ({publishedPosts.length})
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
            >
              {refreshing ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <RefreshCw size={14} />
              )}
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            {hasDuplicates && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCleanupDuplicates}
                disabled={cleaning}
                className="border-red-500/50 text-red-400 hover:bg-red-500/20"
              >
                {cleaning ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <Trash2 size={14} />
                )}
                {cleaning ? 'Cleaning...' : 'Remove Duplicates'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {publishedPosts.length === 0 ? (
          <div className="text-center py-6 text-slate-400">
            No published posts yet
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-3 pr-4">
              {publishedPosts.map((post) => (
                <PublishedPostItem key={post.id} post={post} />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default PublishedPostsHistory;
