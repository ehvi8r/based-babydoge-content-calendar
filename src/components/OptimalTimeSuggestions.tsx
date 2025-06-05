
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp } from 'lucide-react';

interface OptimalTime {
  time: string;
  engagement: string;
  reason: string;
}

interface OptimalTimeSuggestionsProps {
  times: OptimalTime[];
}

const OptimalTimeSuggestions = ({ times }: OptimalTimeSuggestionsProps) => {
  const getEngagementColor = (engagement: string) => {
    switch (engagement) {
      case 'High': return 'bg-green-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="bg-slate-800/50 border-blue-500/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <TrendingUp className="text-green-400" size={20} />
          Optimal Posting Times
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {times.map((timeSlot, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Clock className="text-blue-400" size={16} />
              <div>
                <div className="text-white font-medium">{timeSlot.time}</div>
                <div className="text-xs text-slate-400">{timeSlot.reason}</div>
              </div>
            </div>
            <Badge className={`${getEngagementColor(timeSlot.engagement)} text-white`}>
              {timeSlot.engagement}
            </Badge>
          </div>
        ))}
        <div className="text-xs text-slate-400 text-center pt-2">
          Based on crypto community activity patterns
        </div>
      </CardContent>
    </Card>
  );
};

export default OptimalTimeSuggestions;
