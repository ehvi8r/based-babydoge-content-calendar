
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Edit, Trash2 } from 'lucide-react';

const ScheduledPosts = () => {
  const mockPosts = [
    {
      id: '1',
      content: 'Exciting news! BabyDoge is making waves in the DeFi space...',
      date: '2024-01-15',
      time: '09:00',
      status: 'scheduled'
    },
    {
      id: '2',
      content: 'Community update: Our latest partnership announcement...',
      date: '2024-01-15',
      time: '13:00',
      status: 'scheduled'
    },
    {
      id: '3',
      content: 'Weekly market analysis and BabyDoge performance...',
      date: '2024-01-15',
      time: '19:00',
      status: 'scheduled'
    }
  ];

  return (
    <Card className="bg-slate-800/50 border-blue-500/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Clock className="text-blue-400" size={20} />
          Scheduled Posts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockPosts.length === 0 ? (
          <div className="text-center py-6 text-slate-400">
            No scheduled posts yet
          </div>
        ) : (
          mockPosts.map((post) => (
            <div key={post.id} className="bg-slate-700/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-blue-600 text-white">
                  {post.status}
                </Badge>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-blue-400">
                    <Edit size={12} />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-400">
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
              
              <p className="text-white text-sm line-clamp-2">
                {post.content}
              </p>
              
              <div className="text-xs text-slate-400">
                {post.date} at {post.time}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default ScheduledPosts;
