
import { twitterApi } from './twitterApi';

interface ScheduledPost {
  id: string;
  content: string;
  date: string;
  time: string;
  status: string;
  hashtags?: string;
  imageUrl?: string;
}

interface PublishedPost extends ScheduledPost {
  publishedAt: string;
  tweetId?: string;
  tweetUrl?: string;
  error?: string;
}

class PostSchedulerService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Post scheduler service started');
    
    // Check every minute for posts to publish
    this.intervalId = setInterval(() => {
      this.checkAndPublishPosts();
    }, 60000); // 60 seconds

    // Also check immediately on start
    this.checkAndPublishPosts();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Post scheduler service stopped');
  }

  private async checkAndPublishPosts() {
    const scheduledPosts = this.getScheduledPosts();
    const now = new Date();

    for (const post of scheduledPosts) {
      const scheduledDateTime = new Date(`${post.date}T${post.time}`);
      
      // Check if the post should be published (time has passed and status is still 'scheduled')
      if (scheduledDateTime <= now && post.status === 'scheduled') {
        await this.publishPost(post);
      }
    }
  }

  private async publishPost(post: ScheduledPost) {
    console.log('Publishing post:', post.id);
    
    // Update status to 'publishing'
    this.updatePostStatus(post.id, 'publishing');

    try {
      const content = post.hashtags ? `${post.content} ${post.hashtags}` : post.content;
      const result = await twitterApi.createTweet(content, post.imageUrl);

      if (result.success && result.data) {
        // Move to published posts
        this.moveToPublished(post, {
          publishedAt: new Date().toISOString(),
          tweetId: result.data.id,
          tweetUrl: result.data.url,
          status: 'published'
        });

        // Dispatch event to update UI
        window.dispatchEvent(new CustomEvent('scheduledPostsUpdated'));
        window.dispatchEvent(new CustomEvent('postPublished', { 
          detail: { post, result: result.data }
        }));

        console.log('Post published successfully:', post.id);
      } else {
        // Update status to failed
        this.updatePostStatus(post.id, 'failed', result.error);
        console.error('Failed to publish post:', post.id, result.error);
      }
    } catch (error) {
      console.error('Error publishing post:', error);
      this.updatePostStatus(post.id, 'failed', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private getScheduledPosts(): ScheduledPost[] {
    const savedPosts = localStorage.getItem('scheduledPosts');
    if (savedPosts) {
      try {
        return JSON.parse(savedPosts);
      } catch (error) {
        console.error('Error loading scheduled posts:', error);
        return [];
      }
    }
    return [];
  }

  private updatePostStatus(postId: string, status: string, error?: string) {
    const posts = this.getScheduledPosts();
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        return { ...post, status, error };
      }
      return post;
    });

    localStorage.setItem('scheduledPosts', JSON.stringify(updatedPosts));
    window.dispatchEvent(new CustomEvent('scheduledPostsUpdated'));
  }

  private moveToPublished(originalPost: ScheduledPost, publishedData: { publishedAt: string; tweetId?: string; tweetUrl?: string; status: string }) {
    // Remove from scheduled posts
    const scheduledPosts = this.getScheduledPosts();
    const updatedScheduledPosts = scheduledPosts.filter(post => post.id !== originalPost.id);
    localStorage.setItem('scheduledPosts', JSON.stringify(updatedScheduledPosts));

    // Add to published posts
    const publishedPost: PublishedPost = {
      ...originalPost,
      publishedAt: publishedData.publishedAt,
      tweetId: publishedData.tweetId,
      tweetUrl: publishedData.tweetUrl,
      status: publishedData.status
    };

    const savedPublishedPosts = localStorage.getItem('publishedPosts');
    let publishedPosts: PublishedPost[] = [];
    
    if (savedPublishedPosts) {
      try {
        publishedPosts = JSON.parse(savedPublishedPosts);
      } catch (error) {
        console.error('Error loading published posts:', error);
      }
    }

    publishedPosts.unshift(publishedPost); // Add to beginning
    localStorage.setItem('publishedPosts', JSON.stringify(publishedPosts));
  }

  public async retryFailedPost(postId: string) {
    const posts = this.getScheduledPosts();
    const post = posts.find(p => p.id === postId);
    
    if (post && post.status === 'failed') {
      await this.publishPost(post);
    }
  }
}

export const postScheduler = new PostSchedulerService();
