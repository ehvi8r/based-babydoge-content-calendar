
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Users } from 'lucide-react';

const CalendarLegend = () => {
  return (
    <Card className="bg-slate-800/50 border-blue-500/20">
      <CardHeader>
        <CardTitle className="text-white text-lg">Legend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded flex items-center justify-center">
              <Clock size={8} className="text-white" />
            </div>
            <span className="text-slate-300">Scheduled Posts</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-500 rounded flex items-center justify-center">
              <Users size={8} className="text-white" />
            </div>
            <span className="text-slate-300">Twitter Spaces</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded flex items-center justify-center">
              <Users size={8} className="text-white" />
            </div>
            <span className="text-slate-300">Meetings</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded flex items-center justify-center">
              <Calendar size={8} className="text-white" />
            </div>
            <span className="text-slate-300">Events</span>
          </div>
        </div>
        <div className="mt-2 text-xs text-slate-400">
          Click on events to edit them. Links open in new tabs. Scheduled posts can only be edited in the Content Scheduler tab.
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarLegend;
