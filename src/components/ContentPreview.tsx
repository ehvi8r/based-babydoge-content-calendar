
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Image, Video } from 'lucide-react';

interface ContentPreviewProps {
  content: string;
  hashtags: string;
  media: string[];
}

const ContentPreview = ({ content, hashtags, media }: ContentPreviewProps) => {
  if (!content && !hashtags && media.length === 0) {
    return null;
  }

  const formatContent = (text: string) => {
    return text.split(' ').map((word, index) => {
      if (word.startsWith('#')) {
        return (
          <span key={index} className="text-blue-400">
            {word}{' '}
          </span>
        );
      }
      if (word.startsWith('@')) {
        return (
          <span key={index} className="text-blue-400">
            {word}{' '}
          </span>
        );
      }
      return word + ' ';
    });
  };

  const isVideoUrl = (url: string) => {
    return url.includes('video') || url.endsWith('.mp4') || url.endsWith('.webm');
  };

  return (
    <Card className="bg-slate-800/50 border-blue-500/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Eye className="text-green-400" size={20} />
          Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">BD</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-white font-medium">BabyDoge</span>
                <span className="text-slate-400 text-sm">@babydoge20</span>
                <span className="text-slate-400 text-sm">·</span>
                <span className="text-slate-400 text-sm">now</span>
              </div>
              
              <div className="text-white leading-relaxed mb-3">
                {formatContent(content)}
                {hashtags && (
                  <div className="mt-2">
                    {formatContent(hashtags)}
                  </div>
                )}
              </div>

              {media.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {media.slice(0, 4).map((url, index) => (
                    <div
                      key={index}
                      className="bg-slate-700 rounded-lg overflow-hidden h-20"
                    >
                      {isVideoUrl(url) ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="text-purple-400" size={24} />
                        </div>
                      ) : (
                        <img 
                          src={url} 
                          alt={`Media ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center">
                                  <div class="text-blue-400 text-xs">Image</div>
                                </div>
                              `;
                            }
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex items-center gap-6 text-slate-400 text-sm">
                <span>💬 Reply</span>
                <span>🔄 Repost</span>
                <span>❤️ Like</span>
                <span>📊 View</span>
                <span>🔗 Share</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContentPreview;
