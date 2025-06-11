
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ScheduledPost {
  id: string;
  content: string;
  date: string;
  time: string;
  status: string;
  hashtags?: string;
  content_hash?: string;
}

export const useScheduledPosts = () => {
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);

  const loadScheduledPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No user found, setting empty posts array');
        setScheduledPosts([]);
        setLoading(false);
        return;
      }

      const { data: posts, error } = await supabase
        .from('scheduled_posts')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'scheduled')
        .order('scheduled_for', { ascending: true });

      if (error) {
        console.error('Error loading scheduled posts:', error);
        setScheduledPosts([]);
      } else {
        // Transform Supabase data to match calendar format
        const transformedPosts = posts.map(post => {
          const scheduledDate = new Date(post.scheduled_for);
          return {
            id: post.id,
            content: post.content,
            date: scheduledDate.toISOString().split('T')[0], // YYYY-MM-DD format
            time: scheduledDate.toTimeString().slice(0, 5), // HH:MM format
            status: post.status,
            hashtags: post.hashtags || '',
            content_hash: post.content_hash
          };
        });

        console.log('Loaded scheduled posts for calendar:', transformedPosts);
        setScheduledPosts(transformedPosts);
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

    // Create a unique channel name to avoid conflicts
    const channelName = `scheduled_posts_changes_${Date.now()}_${Math.random()}`;
    
    // Set up real-time subscription for scheduled posts
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scheduled_posts'
        },
        (payload) => {
          console.log('Scheduled posts updated, reloading for calendar...', payload);
          loadScheduledPosts();
        }
      )
      .subscribe();

    // Also listen for window events as fallback
    const handleScheduledPostsUpdate = () => {
      console.log('Scheduled posts updated via window event, reloading for calendar...');
      loadScheduledPosts();
    };

    window.addEventListener('scheduledPostsUpdated', handleScheduledPostsUpdate);
    
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('scheduledPostsUpdated', handleScheduledPostsUpdate);
    };
  }, []);

  return {
    scheduledPosts,
    loading,
    loadScheduledPosts
  };
};
