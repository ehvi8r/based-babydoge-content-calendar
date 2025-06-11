
import { useState, useEffect } from 'react';
import { parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export interface CalendarEvent {
  id: string;
  title: string;
  type: 'post' | 'space' | 'meeting' | 'event';
  date: Date;
  time?: string;
  description?: string;
  link?: string;
  content?: string;
  hashtags?: string;
}

interface ScheduledPost {
  id: string;
  content: string;
  date: string;
  time: string;
  status: string;
  hashtags?: string;
}

export const useCalendarEvents = (scheduledPosts: ScheduledPost[] = []) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const { toast } = useToast();

  // Load events from localStorage on component mount
  useEffect(() => {
    const loadEvents = () => {
      const savedEvents = localStorage.getItem('calendarEvents');
      if (savedEvents) {
        try {
          const parsedEvents = JSON.parse(savedEvents);
          const eventsWithDates = parsedEvents.map((event: any) => ({
            ...event,
            date: new Date(event.date)
          }));
          console.log('Loading calendar events from localStorage:', eventsWithDates);
          setEvents(eventsWithDates);
        } catch (error) {
          console.error('Error loading events from localStorage:', error);
          setEvents([]);
        }
      } else {
        console.log('No calendar events found in localStorage');
        setEvents([]);
      }
    };

    loadEvents();

    // Listen for calendar events updates
    const handleCalendarEventsUpdate = () => {
      console.log('Calendar events updated, reloading...');
      loadEvents();
    };

    window.addEventListener('calendarEventsUpdated', handleCalendarEventsUpdate);
    
    return () => {
      window.removeEventListener('calendarEventsUpdated', handleCalendarEventsUpdate);
    };
  }, []);

  // Save events to localStorage whenever events change
  useEffect(() => {
    if (events.length > 0) {
      localStorage.setItem('calendarEvents', JSON.stringify(events));
      console.log('Saved calendar events to localStorage:', events);
    }
  }, [events]);

  const scheduledPostEvents: CalendarEvent[] = scheduledPosts.map(post => {
    console.log('Processing scheduled post for calendar:', post);
    const postDate = parseISO(post.date + 'T00:00:00');
    return {
      id: `post-${post.id}`,
      title: post.content.substring(0, 50) + (post.content.length > 50 ? '...' : ''),
      type: 'post' as const,
      date: postDate,
      time: post.time,
      description: post.content,
      content: post.content,
      hashtags: post.hashtags
    };
  });

  const allEvents = [...scheduledPostEvents, ...events];
  console.log('All calendar events combined:', allEvents);

  const addEvent = (newEvent: Omit<CalendarEvent, 'id'>) => {
    const eventToAdd: CalendarEvent = {
      id: Date.now().toString(),
      ...newEvent
    };

    console.log('Adding new calendar event:', eventToAdd);
    setEvents(prevEvents => {
      const updatedEvents = [...prevEvents, eventToAdd];
      console.log('Updated calendar events array:', updatedEvents);
      return updatedEvents;
    });
    
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('calendarEventsUpdated'));
    
    toast({
      title: "Event Added",
      description: `"${newEvent.title}" has been added to your calendar`,
    });
  };

  const updateEvent = (updatedEvent: CalendarEvent) => {
    if (updatedEvent.type === 'post') {
      // For scheduled posts, update in Supabase (handled by the scheduled posts hook)
      toast({
        title: "Note",
        description: "Scheduled post updates are handled separately",
      });
    } else {
      // For regular events
      setEvents(prevEvents => {
        const updated = prevEvents.map(event => 
          event.id === updatedEvent.id ? updatedEvent : event
        );
        return updated;
      });

      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('calendarEventsUpdated'));

      toast({
        title: "Event Updated",
        description: `"${updatedEvent.title}" has been updated`,
      });
    }
  };

  const deleteEvent = (eventToDelete: CalendarEvent) => {
    if (eventToDelete.type === 'post') {
      toast({
        title: "Note",
        description: "Scheduled posts cannot be deleted from the calendar",
      });
    } else {
      // For regular events
      setEvents(prevEvents => {
        const filtered = prevEvents.filter(event => event.id !== eventToDelete.id);
        return filtered;
      });
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('calendarEventsUpdated'));
      
      toast({
        title: "Event Deleted",
        description: `"${eventToDelete.title}" has been deleted`,
      });
    }
  };

  return {
    events,
    allEvents,
    addEvent,
    updateEvent,
    deleteEvent
  };
};
