
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, Edit, ExternalLink, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { CalendarEvent } from '@/hooks/useCalendarEvents';

interface DayEventsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onAddEventClick: () => void;
  canModifyEvents: boolean;
}

const DayEventsDialog = ({ 
  isOpen, 
  onClose, 
  selectedDate, 
  events, 
  onEventClick, 
  onAddEventClick,
  canModifyEvents 
}: DayEventsDialogProps) => {
  const getEventTypeColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'post': return 'bg-blue-500';
      case 'space': return 'bg-purple-500';
      case 'meeting': return 'bg-orange-500';
      case 'event': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getEventTypeIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'post': return <Clock size={16} />;
      case 'space': return <Users size={16} />;
      case 'meeting': return <Users size={16} />;
      case 'event': return <Calendar size={16} />;
      default: return <Calendar size={16} />;
    }
  };

  if (!selectedDate) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Calendar size={20} className="text-blue-400" />
            Events for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {events.length === 0 ? (
            <div className="text-slate-400 text-center py-8">
              No events scheduled for this day
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className={`p-3 rounded-lg ${getEventTypeColor(event.type)} text-white cursor-pointer hover:opacity-80 transition-opacity`}
                onClick={() => onEventClick(event)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    {getEventTypeIcon(event.type)}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{event.title}</h3>
                      {event.time && (
                        <div className="text-sm opacity-80 flex items-center gap-1 mt-1">
                          <Clock size={12} />
                          {event.time}
                        </div>
                      )}
                      {event.description && (
                        <p className="text-sm opacity-80 mt-1 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Edit size={14} className="opacity-60" />
                    {event.link && (event.type === 'space' || event.type === 'meeting') && (
                      <ExternalLink size={14} className="opacity-60" />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="flex gap-2 pt-4 border-t border-slate-700">
          <Button
            onClick={onAddEventClick}
            className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
            disabled={!canModifyEvents}
          >
            <Plus size={16} className="mr-2" />
            Add Event for This Day
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DayEventsDialog;
