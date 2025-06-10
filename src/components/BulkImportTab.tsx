import { useState, useEffect } from 'react';
import SpreadsheetUpload from './SpreadsheetUpload';
import ImportedPostsList from './ImportedPostsList';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SpreadsheetPost {
  content: string;
  date: string;
  time: string;
  hashtags: string;
  status: string;
  imageUrl: string;
}

interface BulkImportTabProps {
  onPostsUpdate: () => void;
}

const BulkImportTab = ({ onPostsUpdate }: BulkImportTabProps) => {
  const [importedPosts, setImportedPosts] = useState<SpreadsheetPost[]>([]);
  const { toast } = useToast();

  // Load imported posts from localStorage on mount
  useEffect(() => {
    const savedImportedPosts = localStorage.getItem('importedPosts');
    if (savedImportedPosts) {
      try {
        const parsedPosts = JSON.parse(savedImportedPosts);
        setImportedPosts(parsedPosts);
        console.log('Loaded imported posts from localStorage:', parsedPosts);
      } catch (error) {
        console.error('Error loading imported posts:', error);
      }
    }
  }, []);

  // Save imported posts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('importedPosts', JSON.stringify(importedPosts));
    console.log('Saved imported posts to localStorage:', importedPosts);
  }, [importedPosts]);

  const handlePostsImported = (posts: SpreadsheetPost[]) => {
    setImportedPosts(posts);
    console.log('Imported posts:', posts);
  };

  const isValidFutureDateTime = (date: string, time: string): boolean => {
    const scheduledDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    return scheduledDateTime > now;
  };

  const handleScheduleImportedPost = async (importedPost: SpreadsheetPost, index: number) => {
    // Validate that the scheduled date/time is in the future
    if (!isValidFutureDateTime(importedPost.date, importedPost.time)) {
      toast({
        title: "Invalid Date/Time",
        description: "Cannot schedule posts in the past. Please select a future date and time.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to schedule posts",
          variant: "destructive",
        });
        return;
      }

      const scheduledFor = new Date(`${importedPost.date}T${importedPost.time}`);

      const { error } = await supabase
        .from('scheduled_posts')
        .insert({
          user_id: user.id,
          content: importedPost.content,
          hashtags: importedPost.hashtags,
          image_url: importedPost.imageUrl,
          scheduled_for: scheduledFor.toISOString(),
          status: 'scheduled'
        });

      if (error) {
        console.error('Error scheduling post:', error);
        toast({
          title: "Error",
          description: "Failed to schedule post",
          variant: "destructive",
        });
        return;
      }

      // Remove from imported posts
      const updatedImportedPosts = importedPosts.filter((_, i) => i !== index);
      setImportedPosts(updatedImportedPosts);

      onPostsUpdate();

      toast({
        title: "Post Scheduled",
        description: "Imported post has been scheduled successfully",
      });
    } catch (error) {
      console.error('Error scheduling post:', error);
      toast({
        title: "Error",
        description: "Failed to schedule post",
        variant: "destructive",
      });
    }
  };

  const handleScheduleAllImported = async () => {
    // Filter out posts with past dates/times
    const validPosts = importedPosts.filter(post => 
      isValidFutureDateTime(post.date, post.time)
    );
    
    const invalidPosts = importedPosts.filter(post => 
      !isValidFutureDateTime(post.date, post.time)
    );

    if (invalidPosts.length > 0) {
      toast({
        title: "Some Posts Skipped",
        description: `${invalidPosts.length} posts were skipped because they have past dates/times`,
        variant: "destructive",
      });
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to schedule posts",
          variant: "destructive",
        });
        return;
      }

      const postsToInsert = validPosts.map(post => ({
        user_id: user.id,
        content: post.content,
        hashtags: post.hashtags,
        image_url: post.imageUrl,
        scheduled_for: new Date(`${post.date}T${post.time}`).toISOString(),
        status: 'scheduled' as const
      }));

      const { error } = await supabase
        .from('scheduled_posts')
        .insert(postsToInsert);

      if (error) {
        console.error('Error scheduling posts:', error);
        toast({
          title: "Error",
          description: "Failed to schedule posts",
          variant: "destructive",
        });
        return;
      }

      onPostsUpdate();

      toast({
        title: "Posts Scheduled",
        description: `${validPosts.length} posts have been scheduled successfully`,
      });

      // Keep only the invalid posts in imported posts
      setImportedPosts(invalidPosts);
    } catch (error) {
      console.error('Error scheduling posts:', error);
      toast({
        title: "Error",
        description: "Failed to schedule posts",
        variant: "destructive",
      });
    }
  };

  const handleEditImportedPost = (updatedPost: SpreadsheetPost, index: number) => {
    const updatedImportedPosts = importedPosts.map((post, i) => 
      i === index ? updatedPost : post
    );
    setImportedPosts(updatedImportedPosts);
  };

  const handleDeleteImportedPost = (index: number) => {
    const updatedImportedPosts = importedPosts.filter((_, i) => i !== index);
    setImportedPosts(updatedImportedPosts);
    
    toast({
      title: "Post Deleted",
      description: "Imported post has been deleted",
    });
  };

  return (
    <>
      <SpreadsheetUpload onPostsImported={handlePostsImported} />
      
      <ImportedPostsList
        importedPosts={importedPosts}
        scheduledPosts={[]}
        onSchedulePost={handleScheduleImportedPost}
        onScheduleAll={handleScheduleAllImported}
        onEditPost={handleEditImportedPost}
        onDeletePost={handleDeleteImportedPost}
      />
    </>
  );
};

export default BulkImportTab;
