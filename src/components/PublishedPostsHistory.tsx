
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePublishedPosts } from '@/hooks/usePublishedPosts';
import { hasPotentialDuplicates, cleanupDuplicates } from '@/utils/duplicatePostUtils';
import PublishedPostItem from './PublishedPostItem';

const PublishedPostsHistory = () => {
  const { publishedPosts, loading, loadPublishedPosts } = usePublishedPosts();
  const [cleaning, setCleaning] = useState(false);
  const { toast } = useToast();

  const handleCleanupDuplicates = async () => {
    setCleaning(true);
    
    await cleanupDuplicates(
      publishedPosts,
      (count) => {
        if (count > 0) {
          toast({
            title: "Cleanup Complete",
            description: `Removed ${count} duplicate post(s)`,
          });
          loadPublishedPosts();
        } else {
          toast({
            title: "No Duplicates Found",
            description: "All posts are unique",
          });
        }
      },
      (error) => {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      }
    );
    
    setCleaning(false);
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

  return (
    <Card className="bg-slate-800/50 border-blue-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <CheckCircle className="text-green-400" size={20} />
            Published Posts History ({publishedPosts.length})
          </CardTitle>
          {hasPotentialDuplicates(publishedPosts) && (
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
