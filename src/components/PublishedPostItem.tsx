
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, ExternalLink, AlertTriangle } from 'lucide-react';
import { PublishedPost } from '@/hooks/usePublishedPosts';

interface PublishedPostItemProps {
  post: PublishedPost;
}

const PublishedPostItem = ({ post }: PublishedPostItemProps) => {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  // Check if tweet ID might be invalid (old posts from 2024 or earlier are likely invalid)
  const isLikelyInvalidTweet = post.tweet_id && new Date(post.published_at) < new Date('2025-01-01');

  return (
    <div className="bg-slate-700/50 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <CheckCircle className="text-green-400" size={16} />
          <Badge variant="secondary" className="bg-green-600 text-white">
            published
          </Badge>
          {!post.tweet_id && (
            <Badge variant="secondary" className="bg-yellow-600 text-white">
              no tweet id
            </Badge>
          )}
          {isLikelyInvalidTweet && (
            <Badge variant="secondary" className="bg-red-600 text-white flex items-center gap-1">
              <AlertTriangle size={12} />
              invalid tweet
            </Badge>
          )}
        </div>
        
        <div className="flex gap-1">
          {post.tweet_url && !isLikelyInvalidTweet && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0 text-green-400 hover:bg-green-400/20"
              onClick={() => window.open(post.tweet_url, '_blank')}
            >
              <ExternalLink size={12} />
            </Button>
          )}
        </div>
      </div>
      
      <p className="text-white text-sm line-clamp-2">
        {post.content}
      </p>

      {post.image_url && (
        <div className="mt-2">
          <img 
            src={post.image_url} 
            alt="Post image" 
            className="w-16 h-16 object-cover rounded"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}
      
      {post.hashtags && (
        <p className="text-blue-300 text-xs">
          {post.hashtags}
        </p>
      )}
      
      <div className="text-xs text-slate-400">
        Published: {formatDate(post.published_at)}
        {post.tweet_id && (
          <div className={isLikelyInvalidTweet ? 'text-red-400' : ''}>
            Tweet ID: {post.tweet_id}
            {isLikelyInvalidTweet && <span className="ml-1">(possibly invalid)</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublishedPostItem;
