
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Plus } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { useCalendarEvents, CalendarEvent } from '@/hooks/useCalendarEvents';
import { PublishedPost } from '@/hooks/usePublishedPosts';
import { useGlobalBanners } from '@/hooks/useGlobalBanners';
import CalendarGrid from './CalendarGrid';
import EventDialogs from './EventDialogs';
import CalendarLegend from './CalendarLegend';
import AdBanner from './AdBanner';

interface CalendarViewProps {
  scheduledPosts?: Array<{
    id: string;
    content: string;
    date: string;
    time: string;
    status: string;
    hashtags?: string;
  }>;
  publishedPosts?: PublishedPost[];
}

const CalendarView = ({ scheduledPosts = [], publishedPosts = [] }: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const { allEvents, addEvent, updateEvent, deleteEvent } = useCalendarEvents(scheduledPosts, publishedPosts);
  const { banners, loading: bannersLoading } = useGlobalBanners();

  console.log('CalendarView received scheduledPosts:', scheduledPosts);
  console.log('CalendarView received publishedPosts:', publishedPosts);
  console.log('All events combined:', allEvents);

  // Listen for updates to scheduled posts
  useEffect(() => {
    const handlePostsUpdate = () => {
      console.log('Calendar received posts update event');
      // The useCalendarEvents hook will automatically update when scheduledPosts prop changes
    };

    const handleCalendarEventsUpdate = () => {
      console.log('Calendar received calendar events update event');
      // This will trigger a re-render and show updated events
    };

    window.addEventListener('scheduledPostsUpdated', handlePostsUpdate);
    window.addEventListener('calendarEventsUpdated', handleCalendarEventsUpdate);
    
    return () => {
      window.removeEventListener('scheduledPostsUpdated', handlePostsUpdate);
      window.removeEventListener('calendarEventsUpdated', handleCalendarEventsUpdate);
    };
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Event clicked:', event);
    
    if (event.link && (event.type === 'space' || event.type === 'meeting')) {
      window.open(event.link, '_blank');
      return;
    }
    
    setEditingEvent(event);
    setIsEditEventOpen(true);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsAddEventOpen(true);
  };

  const navigateMonth = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'prev') {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() - 1);
      setCurrentDate(newDate);
    } else if (direction === 'next') {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + 1);
      setCurrentDate(newDate);
    } else {
      setCurrentDate(new Date());
    }
  };

  // Get the first active banner
  const activeBanner = banners.find(banner => banner.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Calendar className="text-blue-400" size={24} />
          Content Calendar - {format(currentDate, 'MMMM yyyy')}
        </h2>
        
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setSelectedDate(new Date());
              setIsAddEventOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus size={16} className="mr-2" />
            Add Event
          </Button>
          <Button
            variant="outline"
            onClick={() => navigateMonth('prev')}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => navigateMonth('today')}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Today
          </Button>
          <Button
            variant="outline"
            onClick={() => navigateMonth('next')}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Next
          </Button>
        </div>
      </div>

      <Card className="bg-slate-800/50 border-blue-500/20">
        <CardContent className="p-6">
          <CalendarGrid
            days={days}
            currentDate={currentDate}
            allEvents={allEvents}
            onDateClick={handleDateClick}
            onEventClick={handleEventClick}
          />
        </CardContent>
      </Card>

      <EventDialogs
        isAddEventOpen={isAddEventOpen}
        setIsAddEventOpen={setIsAddEventOpen}
        isEditEventOpen={isEditEventOpen}
        setIsEditEventOpen={setIsEditEventOpen}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        editingEvent={editingEvent}
        setEditingEvent={setEditingEvent}
        onAddEvent={addEvent}
        onEditEvent={updateEvent}
        onDeleteEvent={deleteEvent}
      />

      <CalendarLegend />

      {/* Global Banner Display */}
      {!bannersLoading && activeBanner && (
        <AdBanner
          imageUrl={activeBanner.image_url}
          linkUrl={activeBanner.link_url}
          altText={activeBanner.title || "BabyDoge Advertisement"}
          title="Sponsored"
        />
      )}
    </div>
  );
};

export default CalendarView;
