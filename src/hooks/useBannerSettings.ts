
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
          console.log('Loading banner settings from localStorage:', parsed);
          setBannerSettings(parsed);
        } else {
          console.log('No banner settings found in localStorage');
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
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem('bannerSettings', JSON.stringify(bannerSettings));
        console.log('Saved banner settings to localStorage:', bannerSettings);
      } catch (error) {
        console.error('Error saving banner settings:', error);
      }
    }
  }, [bannerSettings, loading]);

  const updateImageUrl = (imageUrl: string) => {
    console.log('Updating image URL:', imageUrl);
    setBannerSettings(prev => {
      const newSettings = { ...prev, imageUrl };
      return newSettings;
    });
    
    toast({
      title: "Banner Updated",
      description: "Banner image has been updated",
    });
  };

  const updateLinkUrl = (linkUrl: string) => {
    console.log('Updating link URL:', linkUrl);
    setBannerSettings(prev => {
      const newSettings = { ...prev, linkUrl };
      return newSettings;
    });
    
    toast({
      title: "Link Updated",
      description: "Banner link has been updated",
    });
  };

  return {
    bannerSettings,
    loading,
    updateImageUrl,
    updateLinkUrl
  };
};
