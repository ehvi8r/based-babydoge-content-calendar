import { format, isSameMonth, isSameDay, isValid } from 'date-fns';
import { CalendarEvent } from '@/hooks/useCalendarEvents';
import { Clock, Users, Calendar, Edit, ExternalLink } from 'lucide-react';

interface CalendarGridProps {
  days: Date[];
  currentDate: Date;
  allEvents: CalendarEvent[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent, e: React.MouseEvent) => void;
  onDayEventsClick?: (date: Date, events: CalendarEvent[]) => void;
}

const CalendarGrid = ({ 
  days, 
  currentDate, 
  allEvents, 
  onDateClick, 
  onEventClick,
  onDayEventsClick 
}: CalendarGridProps) => {
  const getEventsForDate = (date: Date) => {
    if (!isValid(date)) {
      console.warn('Invalid date passed to getEventsForDate:', date);
      return [];
    }

    const eventsForDate = allEvents.filter(event => {
      // Ensure both dates are valid
      if (!event.date || !isValid(event.date)) {
        console.warn('Event has invalid date:', event);
        return false;
      }
      
      // Normalize both dates to just the day (ignore time)
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      
      const compareDate = new Date(date);
      compareDate.setHours(0, 0, 0, 0);
      
      const isMatch = eventDate.getTime() === compareDate.getTime();
      
      if (isMatch) {
        console.log(`Found event for ${format(date, 'yyyy-MM-dd')}:`, event.title);
      }
      
      return isMatch;
    });
    
    if (eventsForDate.length > 0) {
      console.log(`Events for ${format(date, 'yyyy-MM-dd')}:`, eventsForDate);
    }
    
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

  const handleDayClick = (day: Date, dayEvents: CalendarEvent[]) => {
    if (dayEvents.length > 0 && onDayEventsClick) {
      // If there are events and we have a day events handler, show the events dialog
      onDayEventsClick(day, dayEvents);
    } else {
      // Otherwise, use the regular date click (for adding new events)
      onDateClick(day);
    }
  };

  const handleMoreEventsClick = (e: React.MouseEvent, day: Date, dayEvents: CalendarEvent[]) => {
    e.stopPropagation();
    if (onDayEventsClick) {
      onDayEventsClick(day, dayEvents);
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
          const hasEvents = dayEvents.length > 0;
          
          return (
            <div
              key={day.toString()}
              className={`min-h-[100px] p-2 border border-slate-600 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors ${
                isCurrentMonth ? 'bg-slate-800/30' : 'bg-slate-900/30'
              } ${isToday ? 'ring-2 ring-blue-500' : ''} ${
                hasEvents ? 'hover:ring-1 hover:ring-blue-400/50' : ''
              }`}
              onClick={() => handleDayClick(day, dayEvents)}
              title={hasEvents ? `Click to view all ${dayEvents.length} events` : 'Click to add event'}
            >
              <div className={`text-sm mb-1 flex items-center justify-between ${
                isCurrentMonth ? 'text-white' : 'text-slate-500'
              } ${isToday ? 'font-bold' : ''}`}>
                <span>{format(day, 'd')}</span>
                {hasEvents && (
                  <div className="w-2 h-2 bg-blue-400 rounded-full" title={`${dayEvents.length} events`} />
                )}
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
                  <div 
                    className="text-xs text-blue-400 cursor-pointer hover:text-blue-300 transition-colors font-medium"
                    onClick={(e) => handleMoreEventsClick(e, day, dayEvents)}
                    title="Click to view all events"
                  >
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
