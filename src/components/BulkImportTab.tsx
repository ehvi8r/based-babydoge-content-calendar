import { useState, useEffect } from 'react';
import SpreadsheetUpload from './SpreadsheetUpload';
import ImportedPostsList from './ImportedPostsList';
import { useToast } from '@/hooks/use-toast';

interface SpreadsheetPost {
  content: string;
  date: string;
  time: string;
  hashtags: string;
  status: string;
  imageUrl: string;
}

interface Post {
  id: string;
  content: string;
  date: string;
  time: string;
  status: string;
  hashtags?: string;
  imageUrl?: string;
}

interface BulkImportTabProps {
  scheduledPosts: Post[];
  onPostsUpdate: (posts: Post[]) => void;
}

const BulkImportTab = ({ scheduledPosts, onPostsUpdate }: BulkImportTabProps) => {
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
    if (importedPosts.length >= 0) {
      localStorage.setItem('importedPosts', JSON.stringify(importedPosts));
      console.log('Saved imported posts to localStorage:', importedPosts);
    }
  }, [importedPosts]);

  const handlePostsImported = (posts: SpreadsheetPost[]) => {
    setImportedPosts(posts);
    console.log('Imported posts:', posts);
  };

  const isValidFutureDate = (date: string, time: string): boolean => {
    const scheduledDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    return scheduledDateTime > now;
  };

  const handleScheduleImportedPost = (importedPost: SpreadsheetPost, index: number) => {
    // Validate that the scheduled date/time is in the future
    if (!isValidFutureDate(importedPost.date, importedPost.time)) {
      toast({
        title: "Invalid Date",
        description: "Cannot schedule posts in the past. Please edit the date and time.",
        variant: "destructive",
      });
      return;
    }

    const newPost: Post = {
      id: `imported-${Date.now()}-${index}`,
      content: importedPost.content,
      date: importedPost.date,
      time: importedPost.time,
      hashtags: importedPost.hashtags,
      imageUrl: importedPost.imageUrl,
      status: 'scheduled'
    };

    const updatedPosts = [...scheduledPosts, newPost];
    onPostsUpdate(updatedPosts);
    localStorage.setItem('scheduledPosts', JSON.stringify(updatedPosts));

    // Remove from imported posts
    const updatedImportedPosts = importedPosts.filter((_, i) => i !== index);
    setImportedPosts(updatedImportedPosts);

    toast({
      title: "Post Scheduled",
      description: "Imported post has been scheduled successfully",
    });
  };

  const handleScheduleAllImported = () => {
    // Filter out posts with past dates
    const validPosts = importedPosts.filter(post => 
      isValidFutureDate(post.date, post.time)
    );
    
    const invalidPosts = importedPosts.filter(post => 
      !isValidFutureDate(post.date, post.time)
    );

    if (invalidPosts.length > 0) {
      toast({
        title: "Some Posts Skipped",
        description: `${invalidPosts.length} posts were skipped because they have past dates`,
        variant: "destructive",
      });
    }

    const newPosts: Post[] = validPosts.map((importedPost, index) => ({
      id: `imported-${Date.now()}-${index}`,
      content: importedPost.content,
      date: importedPost.date,
      time: importedPost.time,
      hashtags: importedPost.hashtags,
      imageUrl: importedPost.imageUrl,
      status: 'scheduled'
    }));

    const updatedPosts = [...scheduledPosts, ...newPosts];
    onPostsUpdate(updatedPosts);
    localStorage.setItem('scheduledPosts', JSON.stringify(updatedPosts));

    toast({
      title: "Posts Scheduled",
      description: `${validPosts.length} posts have been scheduled successfully`,
    });

    // Keep only the invalid posts in imported posts
    setImportedPosts(invalidPosts);
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
        scheduledPosts={scheduledPosts}
        onSchedulePost={handleScheduleImportedPost}
        onScheduleAll={handleScheduleAllImported}
        onEditPost={handleEditImportedPost}
        onDeletePost={handleDeleteImportedPost}
      />
    </>
  );
};

export default BulkImportTab;
