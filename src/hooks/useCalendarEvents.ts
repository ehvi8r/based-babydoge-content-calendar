
import { useState, useEffect } from 'react';
import { parseISO, isValid, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { PublishedPost } from '@/hooks/usePublishedPosts';
import { useDatabaseCalendarEvents } from '@/hooks/useDatabaseCalendarEvents';
import { isFeatureEnabled } from '@/utils/featureFlags';

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

export const useCalendarEvents = (scheduledPosts: ScheduledPost[] = [], publishedPosts: PublishedPost[] = []) => {
  const [localStorageEvents, setLocalStorageEvents] = useState<CalendarEvent[]>([]);
  const { toast } = useToast();
  
  // Database events hook
  const {
    events: databaseEvents,
    loading: databaseLoading,
    error: databaseError,
    canModifyEvents,
    addEvent: addDatabaseEvent,
    updateEvent: updateDatabaseEvent,
    deleteEvent: deleteDatabaseEvent,
    forceRefresh: forceRefreshDatabase
  } = useDatabaseCalendarEvents();

  // Feature flag check
  const useDatabaseEvents = isFeatureEnabled('USE_DATABASE_CALENDAR_EVENTS');

  console.log('🚩 Calendar events mode:', useDatabaseEvents ? 'DATABASE' : 'LOCALSTORAGE');

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

  // Load localStorage events (existing functionality)
  useEffect(() => {
    if (useDatabaseEvents) {
      console.log('📅 Database mode active, skipping localStorage load');
      return;
    }

    const loadLocalStorageEvents = () => {
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
          
          console.log('📅 Loading calendar events from localStorage:', eventsWithValidDates);
          setLocalStorageEvents(eventsWithValidDates);
        } else {
          console.log('📅 No calendar events found in localStorage');
          setLocalStorageEvents([]);
        }
      } catch (error) {
        console.error('Error loading events from localStorage:', error);
        // Clear corrupted data
        localStorage.removeItem('calendarEvents');
        setLocalStorageEvents([]);
      }
    };

    loadLocalStorageEvents();

    // Listen for calendar events updates (localStorage mode only)
    const handleCalendarEventsUpdate = () => {
      console.log('📅 Calendar events updated via window event, reloading...');
      loadLocalStorageEvents();
    };

    window.addEventListener('calendarEventsUpdated', handleCalendarEventsUpdate);
    
    return () => {
      window.removeEventListener('calendarEventsUpdated', handleCalendarEventsUpdate);
    };
  }, [useDatabaseEvents]);

  // Save localStorage events (existing functionality)
  useEffect(() => {
    if (useDatabaseEvents) {
      return; // Don't save to localStorage in database mode
    }

    try {
      // Convert dates to ISO strings for storage
      const eventsForStorage = localStorageEvents.map(event => ({
        ...event,
        date: event.date.toISOString()
      }));
      localStorage.setItem('calendarEvents', JSON.stringify(eventsForStorage));
      console.log('📅 Saved calendar events to localStorage:', localStorageEvents);
    } catch (error) {
      console.error('Error saving events to localStorage:', error);
    }
  }, [localStorageEvents, useDatabaseEvents]);

  // Generate scheduled post events
  const scheduledPostEvents: CalendarEvent[] = scheduledPosts.map(post => {
    console.log('Processing scheduled post for calendar:', post);
    const postDate = parseISO(post.date + 'T00:00:00');
    return {
      id: `scheduled-${post.id}`,
      title: post.content.substring(0, 50) + (post.content.length > 50 ? '...' : ''),
      type: 'post' as const,
      date: postDate,
      time: post.time,
      description: post.content,
      content: post.content,
      hashtags: post.hashtags
    };
  });

  // Generate published post events
  const publishedPostEvents: CalendarEvent[] = publishedPosts.map(post => {
    console.log('Processing published post for calendar:', post);
    const postDate = parseISO(post.published_at);
    return {
      id: `published-${post.id}`,
      title: post.content.substring(0, 50) + (post.content.length > 50 ? '...' : ''),
      type: 'post' as const,
      date: postDate,
      time: format(postDate, 'HH:mm'),
      description: post.content,
      content: post.content,
      hashtags: post.hashtags
    };
  });

  // Choose which events to use based on feature flag
  const currentEvents = useDatabaseEvents ? databaseEvents : localStorageEvents;
  
  // Combine all events
  const allEvents = [...scheduledPostEvents, ...publishedPostEvents, ...currentEvents];
  console.log('📅 All calendar events combined:', allEvents);

  // Force refresh function
  const forceRefresh = async () => {
    console.log('🔄 Force refreshing calendar events...');
    if (useDatabaseEvents) {
      await forceRefreshDatabase();
    } else {
      // Trigger localStorage reload
      window.dispatchEvent(new CustomEvent('calendarEventsUpdated'));
    }
  };

  // Add event function (with fallback)
  const addEvent = async (newEvent: Omit<CalendarEvent, 'id'>) => {
    if (useDatabaseEvents) {
      const success = await addDatabaseEvent(newEvent);
      if (!success) {
        // Fallback to localStorage on database failure
        console.warn('📅 Database add failed, falling back to localStorage');
        addLocalStorageEvent(newEvent);
      }
    } else {
      addLocalStorageEvent(newEvent);
    }
  };

  // localStorage add function (existing functionality)
  const addLocalStorageEvent = (newEvent: Omit<CalendarEvent, 'id'>) => {
    const eventToAdd: CalendarEvent = {
      id: Date.now().toString(),
      ...newEvent
    };

    console.log('📅 Adding new localStorage calendar event:', eventToAdd);
    setLocalStorageEvents(prevEvents => {
      const updatedEvents = [...prevEvents, eventToAdd];
      console.log('📅 Updated localStorage calendar events array:', updatedEvents);
      return updatedEvents;
    });
    
    toast({
      title: "Event Added",
      description: `"${newEvent.title}" has been added to your calendar`,
    });
  };

  // Update event function (with fallback)
  const updateEvent = async (updatedEvent: CalendarEvent) => {
    if (updatedEvent.type === 'post') {
      // For scheduled posts, update in Supabase (handled by the scheduled posts hook)
      toast({
        title: "Note",
        description: "Scheduled post updates are handled separately",
      });
      return;
    }

    if (useDatabaseEvents && updatedEvent.id.startsWith('db-')) {
      const success = await updateDatabaseEvent(updatedEvent);
      if (!success) {
        console.warn('📅 Database update failed');
      }
    } else {
      // localStorage update (existing functionality)
      console.log('📅 Updating localStorage calendar event:', updatedEvent);
      setLocalStorageEvents(prevEvents => {
        const updated = prevEvents.map(event => 
          event.id === updatedEvent.id ? updatedEvent : event
        );
        console.log('📅 Updated localStorage events array after edit:', updated);
        return updated;
      });

      toast({
        title: "Event Updated",
        description: `"${updatedEvent.title}" has been updated`,
      });
    }
  };

  // Delete event function (with fallback)
  const deleteEvent = async (eventToDelete: CalendarEvent) => {
    if (eventToDelete.type === 'post') {
      toast({
        title: "Note",
        description: "Scheduled posts cannot be deleted from the calendar",
      });
      return;
    }

    console.log('🗑️ Attempting to delete event:', eventToDelete.id, eventToDelete.title);

    if (useDatabaseEvents && eventToDelete.id.startsWith('db-')) {
      const success = await deleteDatabaseEvent(eventToDelete);
      if (!success) {
        console.warn('📅 Database delete failed');
      }
    } else {
      // localStorage delete (existing functionality)
      console.log('📅 Deleting localStorage calendar event:', eventToDelete);
      setLocalStorageEvents(prevEvents => {
        const filtered = prevEvents.filter(event => event.id !== eventToDelete.id);
        console.log('📅 LocalStorage events array after deletion:', filtered);
        return filtered;
      });
      
      toast({
        title: "Event Deleted",
        description: `"${eventToDelete.title}" has been deleted`,
      });
    }
  };

  return {
    events: currentEvents,
    allEvents,
    loading: useDatabaseEvents ? databaseLoading : false,
    error: useDatabaseEvents ? databaseError : null,
    canModifyEvents: useDatabaseEvents ? canModifyEvents : true, // localStorage allows all modifications
    useDatabaseEvents, // Expose for UI components
    addEvent,
    updateEvent,
    deleteEvent,
    forceRefresh
  };
};
