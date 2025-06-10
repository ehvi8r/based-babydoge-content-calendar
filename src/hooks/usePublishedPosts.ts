
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PublishedPost {
  id: string;
  content: string;
  hashtags?: string;
  image_url?: string;
  tweet_id?: string;
  tweet_url?: string;
  published_at: string;
}

export const usePublishedPosts = () => {
  const [publishedPosts, setPublishedPosts] = useState<PublishedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadPublishedPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setPublishedPosts([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('published_posts')
        .select('*')
        .eq('user_id', user.id)
        .order('published_at', { ascending: false });

      if (error) {
        console.error('Error loading published posts:', error);
        toast({
          title: "Error",
          description: "Failed to load published posts",
          variant: "destructive",
        });
        return;
      }

      setPublishedPosts(data || []);
    } catch (error) {
      console.error('Error loading published posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPublishedPosts();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('published-posts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'published_posts'
        },
        (payload) => {
          console.log('New published post:', payload);
          loadPublishedPosts();
          toast({
            title: "Post Published!",
            description: "Your scheduled post has been published to X/Twitter",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  return {
    publishedPosts,
    loading,
    loadPublishedPosts
  };
};
