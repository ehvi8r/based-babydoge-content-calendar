
import { useState, useEffect } from 'react';

interface ScheduledPost {
  id: string;
  content: string;
  date: string;
  time: string;
  status: string;
  hashtags?: string;
}

export const useScheduledPosts = () => {
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);

  const loadScheduledPosts = () => {
    try {
      const saved = localStorage.getItem('scheduledPosts');
      if (saved) {
        const posts = JSON.parse(saved);
        console.log('Loaded scheduled posts for calendar:', posts);
        setScheduledPosts(posts);
      } else {
        setScheduledPosts([]);
      }
    } catch (error) {
      console.error('Error loading scheduled posts:', error);
      setScheduledPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScheduledPosts();

    // Listen for updates to scheduled posts
    const handleScheduledPostsUpdate = () => {
      console.log('Scheduled posts updated, reloading for calendar...');
      loadScheduledPosts();
    };

    window.addEventListener('scheduledPostsUpdated', handleScheduledPostsUpdate);
    
    return () => {
      window.removeEventListener('scheduledPostsUpdated', handleScheduledPostsUpdate);
    };
  }, []);

  return {
    scheduledPosts,
    loading,
    loadScheduledPosts
  };
};
