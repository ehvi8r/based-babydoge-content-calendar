
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { CalendarEvent } from '@/hooks/useCalendarEvents';
import { parseISO, isValid } from 'date-fns';

interface DatabaseCalendarEvent {
  id: string;
  title: string;
  type: 'space' | 'meeting' | 'event';
  date: string; // ISO date string from database
  time: string | null;
  description: string | null;
  link: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useDatabaseCalendarEvents = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAdmin, isTeamMember } = useUserRole();

  // Check if user can modify calendar events
  const canModifyEvents = isAdmin || isTeamMember;

  // Convert database event to CalendarEvent format
  const convertDatabaseEvent = (dbEvent: DatabaseCalendarEvent): CalendarEvent => {
    const eventDate = parseISO(dbEvent.date);
    
    return {
      id: `db-${dbEvent.id}`,
      title: dbEvent.title,
      type: dbEvent.type,
      date: isValid(eventDate) ? eventDate : new Date(),
      time: dbEvent.time || undefined,
      description: dbEvent.description || undefined,
      link: dbEvent.link || undefined
    };
  };

  // Load events from database
  const loadDatabaseEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: dbError } = await supabase
        .from('calendar_events')
        .select('*')
        .order('date', { ascending: true });

      if (dbError) {
        console.error('Error loading database calendar events:', dbError);
        setError('Failed to load calendar events from database');
        return [];
      }

      const convertedEvents = (data || []).map(convertDatabaseEvent);
      console.log('📅 Loaded database calendar events:', convertedEvents.length);
      setEvents(convertedEvents);
      return convertedEvents;
    } catch (error) {
      console.error('Error in loadDatabaseEvents:', error);
      setError('Failed to load calendar events');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Add event to database
  const addDatabaseEvent = async (newEvent: Omit<CalendarEvent, 'id'>): Promise<boolean> => {
    if (!canModifyEvents) {
      toast({
        title: "Permission Denied",
        description: "Only admins and team members can create calendar events",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to create calendar events",
          variant: "destructive",
        });
        return false;
      }

      const { error } = await supabase
        .from('calendar_events')
        .insert({
          title: newEvent.title,
          type: newEvent.type as 'space' | 'meeting' | 'event',
          date: newEvent.date.toISOString().split('T')[0], // Convert to YYYY-MM-DD
          time: newEvent.time || null,
          description: newEvent.description || null,
          link: newEvent.link || null,
          created_by: user.id
        });

      if (error) {
        console.error('Error adding calendar event:', error);
        toast({
          title: "Error",
          description: "Failed to create calendar event",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Event Created",
        description: `"${newEvent.title}" has been added to the team calendar`,
      });

      // Events will be reloaded via real-time subscription
      return true;
    } catch (error) {
      console.error('Error in addDatabaseEvent:', error);
      return false;
    }
  };

  // Update event in database
  const updateDatabaseEvent = async (updatedEvent: CalendarEvent): Promise<boolean> => {
    if (!canModifyEvents) {
      toast({
        title: "Permission Denied",
        description: "Only admins and team members can edit calendar events",
        variant: "destructive",
      });
      return false;
    }

    // Extract database ID from prefixed ID
    const dbId = updatedEvent.id.replace('db-', '');

    try {
      const { error } = await supabase
        .from('calendar_events')
        .update({
          title: updatedEvent.title,
          type: updatedEvent.type as 'space' | 'meeting' | 'event',
          date: updatedEvent.date.toISOString().split('T')[0],
          time: updatedEvent.time || null,
          description: updatedEvent.description || null,
          link: updatedEvent.link || null
        })
        .eq('id', dbId);

      if (error) {
        console.error('Error updating calendar event:', error);
        toast({
          title: "Error",
          description: "Failed to update calendar event",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Event Updated",
        description: `"${updatedEvent.title}" has been updated`,
      });

      return true;
    } catch (error) {
      console.error('Error in updateDatabaseEvent:', error);
      return false;
    }
  };

  // Delete event from database
  const deleteDatabaseEvent = async (eventToDelete: CalendarEvent): Promise<boolean> => {
    if (!canModifyEvents) {
      toast({
        title: "Permission Denied",
        description: "Only admins and team members can delete calendar events",
        variant: "destructive",
      });
      return false;
    }

    // Extract database ID from prefixed ID
    const dbId = eventToDelete.id.replace('db-', '');

    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', dbId);

      if (error) {
        console.error('Error deleting calendar event:', error);
        toast({
          title: "Error",
          description: "Failed to delete calendar event",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Event Deleted",
        description: `"${eventToDelete.title}" has been deleted`,
      });

      return true;
    } catch (error) {
      console.error('Error in deleteDatabaseEvent:', error);
      return false;
    }
  };

  // Set up real-time subscription and initial load
  useEffect(() => {
    loadDatabaseEvents();

    // Set up real-time subscription
    const channel = supabase
      .channel('calendar_events_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_events'
        },
        (payload) => {
          console.log('📅 Calendar events real-time update:', payload);
          loadDatabaseEvents(); // Reload events when changes occur
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    events,
    loading,
    error,
    canModifyEvents,
    addEvent: addDatabaseEvent,
    updateEvent: updateDatabaseEvent,
    deleteEvent: deleteDatabaseEvent,
    reloadEvents: loadDatabaseEvents
  };
};
