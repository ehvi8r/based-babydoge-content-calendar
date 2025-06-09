
interface TwitterCredentials {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
  bearerToken: string;
}

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
  private credentials: TwitterCredentials | null = null;

  constructor() {
    this.loadCredentials();
  }

  private loadCredentials() {
    const savedCredentials = localStorage.getItem('twitter-api-credentials');
    if (savedCredentials) {
      try {
        this.credentials = JSON.parse(savedCredentials);
      } catch (error) {
        console.error('Error loading Twitter credentials:', error);
      }
    }
  }

  public hasValidCredentials(): boolean {
    if (!this.credentials) return false;
    return !!(
      this.credentials.apiKey &&
      this.credentials.apiSecret &&
      this.credentials.accessToken &&
      this.credentials.accessTokenSecret
    );
  }

  // Note: This is a simplified implementation for demonstration
  // In a real app, this would need a backend proxy to handle Twitter API calls
  // due to CORS restrictions and security concerns with API secrets
  public async createTweet(content: string, mediaUrl?: string): Promise<TwitterApiResponse> {
    if (!this.hasValidCredentials()) {
      return {
        success: false,
        error: 'Twitter API credentials not configured'
      };
    }

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // For demonstration purposes, we'll simulate success/failure
      // In reality, you'd need a backend service to make the actual Twitter API calls
      const isSuccess = Math.random() > 0.2; // 80% success rate for demo

      if (isSuccess) {
        const tweetId = `demo-${Date.now()}`;
        return {
          success: true,
          data: {
            id: tweetId,
            text: content,
            url: `https://twitter.com/user/status/${tweetId}`
          }
        };
      } else {
        return {
          success: false,
          error: 'Failed to post tweet. Please check your credentials and try again.'
        };
      }
    } catch (error) {
      console.error('Twitter API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  public async uploadMedia(mediaUrl: string): Promise<{ media_id?: string; error?: string }> {
    // Simulate media upload for demo
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { media_id: `media-${Date.now()}` };
  }
}

export const twitterApi = new TwitterApiService();
