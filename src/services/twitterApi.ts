
import { supabase } from '@/integrations/supabase/client';

interface TwitterApiResponse {
  success: boolean;
  data?: {
    id: string;
    text: string;
    url: string;
  };
  error?: string;
}

export class TwitterApiService {
  // All Twitter API calls now go through the secure edge function
  // Credentials are stored securely in Supabase secrets
  
  public async createTweet(content: string, mediaUrl?: string): Promise<TwitterApiResponse> {
    try {
      // Call the secure edge function which has access to Twitter credentials
      const { data, error } = await supabase.functions.invoke('post-tweet', {
        body: { 
          content,
          mediaUrl 
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        return {
          success: false,
          error: error.message || 'Failed to post tweet'
        };
      }

      if (data.error) {
        return {
          success: false,
          error: data.error
        };
      }

      return {
        success: true,
        data: {
          id: data.tweet_id,
          text: content,
          url: data.tweet_url || `https://x.com/user/status/${data.tweet_id}`
        }
      };
    } catch (error) {
      console.error('Twitter API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  public async uploadMedia(mediaUrl: string): Promise<{ media_id?: string; error?: string }> {
    try {
      // Media upload would also go through edge function if needed
      return { error: 'Media upload not yet implemented in edge function' };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Media upload failed' };
    }
  }
}

export const twitterApi = new TwitterApiService();
