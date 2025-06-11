
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GlobalBanner {
  id: string;
  image_url: string;
  link_url: string;
  title?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useGlobalBanners = () => {
  const [banners, setBanners] = useState<GlobalBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('global_banners')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading global banners:', error);
        return;
      }

      setBanners(data || []);
    } catch (error) {
      console.error('Error loading global banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBanner = async (imageUrl: string, linkUrl: string, title?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('global_banners')
        .insert({
          image_url: imageUrl,
          link_url: linkUrl,
          title: title,
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating banner:', error);
        toast({
          title: "Error",
          description: "Failed to create banner",
          variant: "destructive",
        });
        return null;
      }

      toast({
        title: "Success",
        description: "Banner created successfully",
      });

      return data;
    } catch (error) {
      console.error('Error creating banner:', error);
      return null;
    }
  };

  const updateBanner = async (id: string, updates: Partial<GlobalBanner>) => {
    try {
      const { error } = await supabase
        .from('global_banners')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating banner:', error);
        toast({
          title: "Error",
          description: "Failed to update banner",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Banner updated successfully",
      });

      return true;
    } catch (error) {
      console.error('Error updating banner:', error);
      return false;
    }
  };

  useEffect(() => {
    loadBanners();

    // Create a unique channel name to avoid conflicts
    const channelName = `global_banners_changes_${Date.now()}_${Math.random()}`;

    // Subscribe to banner changes
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'global_banners'
        },
        () => {
          loadBanners();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    banners,
    loading,
    createBanner,
    updateBanner,
    loadBanners
  };
};
