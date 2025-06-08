
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
}

interface Post {
  id: string;
  content: string;
  date: string;
  time: string;
  status: string;
  hashtags?: string;
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
    const newPosts: Post[] = importedPosts.map((importedPost, index) => ({
      id: `imported-${Date.now()}-${index}`,
      content: importedPost.content,
      date: importedPost.date,
      time: importedPost.time,
      hashtags: importedPost.hashtags,
      status: 'scheduled'
    }));

    const updatedPosts = [...scheduledPosts, ...newPosts];
    onPostsUpdate(updatedPosts);
    localStorage.setItem('scheduledPosts', JSON.stringify(updatedPosts));

    toast({
      title: "All Posts Scheduled",
      description: `${importedPosts.length} posts have been scheduled successfully`,
    });

    setImportedPosts([]);
  };

  const handleEditImportedPost = (updatedPost: SpreadsheetPost, index: number) => {
    const updatedImportedPosts = importedPosts.map((post, i) => 
      i === index ? updatedPost : post
    );
    setImportedPosts(updatedImportedPosts);
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
      />
    </>
  );
};

export default BulkImportTab;
