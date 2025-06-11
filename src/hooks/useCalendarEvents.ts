
import { useState, useEffect } from 'react';
import { parseISO, isValid, format } from 'date-fns';
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

  // Helper function to safely parse dates
  const safeParseDateFromStorage = (dateValue: any): Date | null => {
    if (!dateValue) return null;
    
    // If it's already a Date object
    if (dateValue instanceof Date && isValid(dateValue)) {
      return dateValue;
    }
    
    // If it's a string, try to parse it
    if (typeof dateValue === 'string') {
      const parsed = parseISO(dateValue);
      if (isValid(parsed)) {
        return parsed;
      }
      
      // Try direct Date constructor as fallback
      const fallback = new Date(dateValue);
      if (isValid(fallback)) {
        return fallback;
      }
    }
    
    console.warn('Could not parse date:', dateValue);
    return null;
  };

  // Load events from localStorage on component mount
  useEffect(() => {
    const loadEvents = () => {
      try {
        const savedEvents = localStorage.getItem('calendarEvents');
        if (savedEvents) {
          const parsedEvents = JSON.parse(savedEvents);
          const eventsWithValidDates = parsedEvents
            .map((event: any) => {
              const parsedDate = safeParseDateFromStorage(event.date);
              if (!parsedDate) {
                console.warn('Skipping event with invalid date:', event);
                return null;
              }
              return {
                ...event,
                date: parsedDate
              };
            })
            .filter(Boolean); // Remove null entries
          
          console.log('Loading calendar events from localStorage:', eventsWithValidDates);
          setEvents(eventsWithValidDates);
        } else {
          console.log('No calendar events found in localStorage');
          setEvents([]);
        }
      } catch (error) {
        console.error('Error loading events from localStorage:', error);
        // Clear corrupted data
        localStorage.removeItem('calendarEvents');
        setEvents([]);
      }
    };

    loadEvents();

    // Listen for calendar events updates
    const handleCalendarEventsUpdate = () => {
      console.log('Calendar events updated via window event, reloading...');
      loadEvents();
    };

    window.addEventListener('calendarEventsUpdated', handleCalendarEventsUpdate);
    
    return () => {
      window.removeEventListener('calendarEventsUpdated', handleCalendarEventsUpdate);
    };
  }, []);

  // Save events to localStorage whenever events change
  useEffect(() => {
    try {
      // Convert dates to ISO strings for storage
      const eventsForStorage = events.map(event => ({
        ...event,
        date: event.date.toISOString()
      }));
      localStorage.setItem('calendarEvents', JSON.stringify(eventsForStorage));
      console.log('Saved calendar events to localStorage:', events);
    } catch (error) {
      console.error('Error saving events to localStorage:', error);
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
      console.log('Updating calendar event:', updatedEvent);
      setEvents(prevEvents => {
        const updated = prevEvents.map(event => 
          event.id === updatedEvent.id ? updatedEvent : event
        );
        console.log('Updated events array after edit:', updated);
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
      console.log('Deleting calendar event:', eventToDelete);
      setEvents(prevEvents => {
        const filtered = prevEvents.filter(event => event.id !== eventToDelete.id);
        console.log('Events array after deletion:', filtered);
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
