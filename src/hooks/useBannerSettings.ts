
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BannerSettings {
  imageUrl: string;
  linkUrl: string;
}

export const useBannerSettings = () => {
  const [bannerSettings, setBannerSettings] = useState<BannerSettings>({
    imageUrl: '',
    linkUrl: 'https://babydoge20.com'
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load banner settings from localStorage on mount
  useEffect(() => {
    const loadBannerSettings = () => {
      try {
        const saved = localStorage.getItem('bannerSettings');
        if (saved) {
          const parsed = JSON.parse(saved);
          setBannerSettings(parsed);
        }
      } catch (error) {
        console.error('Error loading banner settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBannerSettings();
  }, []);

  // Save banner settings to localStorage whenever they change
  const saveBannerSettings = (settings: BannerSettings) => {
    try {
      localStorage.setItem('bannerSettings', JSON.stringify(settings));
      setBannerSettings(settings);
    } catch (error) {
      console.error('Error saving banner settings:', error);
      toast({
        title: "Error",
        description: "Failed to save banner settings",
        variant: "destructive",
      });
    }
  };

  const updateImageUrl = (imageUrl: string) => {
    const newSettings = { ...bannerSettings, imageUrl };
    saveBannerSettings(newSettings);
  };

  const updateLinkUrl = (linkUrl: string) => {
    const newSettings = { ...bannerSettings, linkUrl };
    saveBannerSettings(newSettings);
  };

  return {
    bannerSettings,
    loading,
    updateImageUrl,
    updateLinkUrl
  };
};
