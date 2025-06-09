
import { format, isSameMonth, isSameDay } from 'date-fns';
import { CalendarEvent } from '@/hooks/useCalendarEvents';
import { Clock, Users, Calendar, Edit, ExternalLink } from 'lucide-react';

interface CalendarGridProps {
  days: Date[];
  currentDate: Date;
  allEvents: CalendarEvent[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent, e: React.MouseEvent) => void;
}

const CalendarGrid = ({ days, currentDate, allEvents, onDateClick, onEventClick }: CalendarGridProps) => {
  const getEventsForDate = (date: Date) => {
    const eventsForDate = allEvents.filter(event => {
      const eventDate = new Date(event.date);
      const isMatch = isSameDay(eventDate, date);
      return isMatch;
    });
    console.log(`Events for ${format(date, 'yyyy-MM-dd')}:`, eventsForDate);
    return eventsForDate;
  };

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
      case 'post': return <Clock size={12} />;
      case 'space': return <Users size={12} />;
      case 'meeting': return <Users size={12} />;
      case 'event': return <Calendar size={12} />;
      default: return <Calendar size={12} />;
    }
  };

  return (
    <>
      <div className="grid grid-cols-7 gap-1 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="p-2 text-center font-medium text-slate-300">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dayEvents = getEventsForDate(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div
              key={day.toString()}
              className={`min-h-[100px] p-2 border border-slate-600 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors ${
                isCurrentMonth ? 'bg-slate-800/30' : 'bg-slate-900/30'
              } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => onDateClick(day)}
            >
              <div className={`text-sm mb-1 ${isCurrentMonth ? 'text-white' : 'text-slate-500'} ${isToday ? 'font-bold' : ''}`}>
                {format(day, 'd')}
              </div>
              
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className={`text-xs p-1 rounded text-white ${getEventTypeColor(event.type)} flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity`}
                    title={event.description || event.title}
                    onClick={(e) => onEventClick(event, e)}
                  >
                    {getEventTypeIcon(event.type)}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{event.title}</div>
                      {event.time && (
                        <div className="text-xs opacity-80">{event.time}</div>
                      )}
                    </div>
                    <Edit size={10} className="opacity-60" />
                    {event.link && (event.type === 'space' || event.type === 'meeting') && (
                      <ExternalLink size={10} className="opacity-60" />
                    )}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-slate-400">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default CalendarGrid;
