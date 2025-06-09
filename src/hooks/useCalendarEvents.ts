
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

  // Load events from localStorage on component mount and listen for updates
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
          setEvents(eventsWithDates);
          console.log('Loaded calendar events from localStorage:', eventsWithDates);
        } catch (error) {
          console.error('Error loading events from localStorage:', error);
        }
      }
    };

    loadEvents();

    // Listen for calendar events updates
    const handleCalendarEventsUpdate = () => {
      loadEvents();
    };

    window.addEventListener('calendarEventsUpdated', handleCalendarEventsUpdate);
    
    return () => {
      window.removeEventListener('calendarEventsUpdated', handleCalendarEventsUpdate);
    };
  }, []);

  // Save events to localStorage whenever events change
  useEffect(() => {
    localStorage.setItem('calendarEvents', JSON.stringify(events));
    console.log('Saved calendar events to localStorage:', events);
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
      // For scheduled posts, update in localStorage and dispatch event
      const savedPosts = localStorage.getItem('scheduledPosts');
      if (savedPosts) {
        try {
          const posts = JSON.parse(savedPosts);
          const postId = updatedEvent.id.replace('post-', '');
          const updatedPosts = posts.map((post: any) => {
            if (post.id === postId) {
              return {
                ...post,
                content: updatedEvent.description || updatedEvent.content || post.content,
                hashtags: updatedEvent.hashtags || post.hashtags
              };
            }
            return post;
          });
          
          localStorage.setItem('scheduledPosts', JSON.stringify(updatedPosts));
          window.dispatchEvent(new CustomEvent('scheduledPostsUpdated'));
          
          toast({
            title: "Scheduled Post Updated",
            description: "The scheduled post has been updated successfully",
          });
        } catch (error) {
          console.error('Error updating scheduled post:', error);
          toast({
            title: "Error",
            description: "Failed to update the scheduled post",
            variant: "destructive",
          });
        }
      }
    } else {
      // For regular events
      setEvents(events.map(event => 
        event.id === updatedEvent.id ? updatedEvent : event
      ));

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
      // For scheduled posts, remove from localStorage and dispatch event
      const savedPosts = localStorage.getItem('scheduledPosts');
      if (savedPosts) {
        try {
          const posts = JSON.parse(savedPosts);
          const postId = eventToDelete.id.replace('post-', '');
          const updatedPosts = posts.filter((post: any) => post.id !== postId);
          
          if (updatedPosts.length === 0) {
            localStorage.removeItem('scheduledPosts');
          } else {
            localStorage.setItem('scheduledPosts', JSON.stringify(updatedPosts));
          }
          
          window.dispatchEvent(new CustomEvent('scheduledPostsUpdated'));
          
          toast({
            title: "Scheduled Post Deleted",
            description: "The scheduled post has been deleted successfully",
          });
        } catch (error) {
          console.error('Error deleting scheduled post:', error);
          toast({
            title: "Error",
            description: "Failed to delete the scheduled post",
            variant: "destructive",
          });
        }
      }
    } else {
      // For regular events
      setEvents(events.filter(event => event.id !== eventToDelete.id));
      
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
