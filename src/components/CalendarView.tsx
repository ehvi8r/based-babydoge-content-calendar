
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, Database, Upload, RefreshCw } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { useCalendarEvents, CalendarEvent } from '@/hooks/useCalendarEvents';
import { PublishedPost } from '@/hooks/usePublishedPosts';
import { useGlobalBanners } from '@/hooks/useGlobalBanners';
import CalendarGrid from './CalendarGrid';
import EventDialogs from './EventDialogs';
import CalendarLegend from './CalendarLegend';
import CalendarMigrationDialog from './CalendarMigrationDialog';
import AdBanner from './AdBanner';
import { Badge } from '@/components/ui/badge';
import { isFeatureEnabled } from '@/utils/featureFlags';

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
  const [isMigrationDialogOpen, setIsMigrationDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { 
    allEvents, 
    loading,
    error,
    canModifyEvents,
    useDatabaseEvents,
    addEvent, 
    updateEvent, 
    deleteEvent,
    forceRefresh
  } = useCalendarEvents(scheduledPosts, publishedPosts);
  
  const { banners, loading: bannersLoading } = useGlobalBanners();

  console.log('CalendarView received scheduledPosts:', scheduledPosts);
  console.log('CalendarView received publishedPosts:', publishedPosts);
  console.log('All events combined:', allEvents);

  // Check if there are localStorage events to migrate
  const [hasLocalStorageEvents, setHasLocalStorageEvents] = useState(false);

  useEffect(() => {
    if (useDatabaseEvents) {
      const savedEvents = localStorage.getItem('calendarEvents');
      if (savedEvents) {
        try {
          const events = JSON.parse(savedEvents);
          // Only show migration if there are actual non-post events
          const migrateableEvents = events.filter((event: any) => event.type !== 'post');
          setHasLocalStorageEvents(migrateableEvents.length > 0);
        } catch (error) {
          console.error('Error checking localStorage events:', error);
        }
      }
    }
  }, [useDatabaseEvents]);

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

  const handleMigrationComplete = () => {
    setHasLocalStorageEvents(false);
    // Trigger a window event to reload calendar events
    window.dispatchEvent(new CustomEvent('calendarEventsUpdated'));
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    console.log('🔄 Manual refresh triggered by user');
    try {
      await forceRefresh();
    } catch (error) {
      console.error('❌ Error during manual refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Enhanced delete handler with immediate feedback
  const handleDeleteEvent = async (eventToDelete: CalendarEvent) => {
    console.log('🗑️ CalendarView: Delete event requested:', eventToDelete.id, eventToDelete.title);
    await deleteEvent(eventToDelete);
    
    // Force refresh after a short delay to ensure UI consistency
    setTimeout(async () => {
      console.log('🔄 CalendarView: Force refreshing after delete...');
      await forceRefresh();
    }, 1000);
  };

  // Get the first active banner
  const activeBanner = banners.find(banner => banner.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="text-blue-400" size={24} />
            Content Calendar - {format(currentDate, 'MMMM yyyy')}
          </h2>
          
          {useDatabaseEvents && (
            <Badge variant="secondary" className="bg-blue-600 text-white">
              <Database size={14} className="mr-1" />
              Team Mode
            </Badge>
          )}
          
          {loading && (
            <Badge variant="secondary" className="bg-yellow-600 text-white">
              Loading...
            </Badge>
          )}
          
          {error && (
            <Badge variant="destructive" className="bg-red-600 text-white">
              Error: {error}
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleManualRefresh}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
            disabled={isRefreshing}
          >
            <RefreshCw size={16} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            onClick={() => {
              setSelectedDate(new Date());
              setIsAddEventOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={useDatabaseEvents && !canModifyEvents}
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

      {/* Team mode status and migration prompt */}
      {useDatabaseEvents && (
        <div className="space-y-3">
          {/* Permission notice */}
          {!canModifyEvents ? (
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <div className="text-blue-300 text-sm">
                <strong>Team Calendar:</strong> You can view all team events but only admins and team members can create or edit events.
              </div>
            </div>
          ) : (
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <div className="text-green-300 text-sm">
                <strong>Team Calendar Active:</strong> You have permission to create, edit, and delete calendar events.
              </div>
            </div>
          )}

          {/* Migration prompt */}
          {hasLocalStorageEvents && canModifyEvents && (
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="text-amber-300 text-sm">
                  <strong>Migration Available:</strong> You have personal calendar events that can be migrated to the team calendar.
                </div>
                <Button
                  onClick={() => setIsMigrationDialogOpen(true)}
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <Upload size={14} className="mr-1" />
                  Migrate Events
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

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
        onDeleteEvent={handleDeleteEvent}
        canModifyEvents={canModifyEvents}
      />

      <CalendarMigrationDialog
        isOpen={isMigrationDialogOpen}
        onClose={() => setIsMigrationDialogOpen(false)}
        onMigrationComplete={handleMigrationComplete}
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
