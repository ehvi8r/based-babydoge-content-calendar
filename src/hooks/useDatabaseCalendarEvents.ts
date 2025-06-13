
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
      console.log('📅 Loading database calendar events...');

      const { data, error: dbError } = await supabase
        .from('calendar_events')
        .select('*')
        .order('date', { ascending: true });

      if (dbError) {
        console.error('❌ Error loading database calendar events:', dbError);
        setError('Failed to load calendar events from database');
        return [];
      }

      const convertedEvents = (data || []).map(convertDatabaseEvent);
      console.log('✅ Loaded database calendar events:', convertedEvents.length, convertedEvents);
      setEvents(convertedEvents);
      return convertedEvents;
    } catch (error) {
      console.error('❌ Error in loadDatabaseEvents:', error);
      setError('Failed to load calendar events');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Force refresh events (for manual triggers)
  const forceRefresh = async () => {
    console.log('🔄 Force refreshing calendar events...');
    await loadDatabaseEvents();
    // Trigger window event for other components
    window.dispatchEvent(new CustomEvent('calendarEventsUpdated'));
  };

  // Add event to database
  const addDatabaseEvent = async (newEvent: Omit<CalendarEvent, 'id'>): Promise<boolean> => {
    if (!canModifyEvents) {
      console.log('❌ Add denied: User lacks permission');
      toast({
        title: "Permission Denied",
        description: "Only admins and team members can create calendar events",
        variant: "destructive",
      });
      return false;
    }

    try {
      console.log('📅 Adding new database event:', newEvent);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ Add failed: No authenticated user');
        toast({
          title: "Authentication Required",
          description: "Please sign in to create calendar events",
          variant: "destructive",
        });
        return false;
      }

      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          title: newEvent.title,
          type: newEvent.type as 'space' | 'meeting' | 'event',
          date: newEvent.date.toISOString().split('T')[0], // Convert to YYYY-MM-DD
          time: newEvent.time || null,
          description: newEvent.description || null,
          link: newEvent.link || null,
          created_by: user.id
        })
        .select();

      if (error) {
        console.error('❌ Error adding calendar event:', error);
        toast({
          title: "Error",
          description: "Failed to create calendar event",
          variant: "destructive",
        });
        return false;
      }

      console.log('✅ Event added successfully:', data);
      toast({
        title: "Event Created",
        description: `"${newEvent.title}" has been added to the team calendar`,
      });

      // Force refresh to ensure immediate UI update
      setTimeout(() => forceRefresh(), 500);
      return true;
    } catch (error) {
      console.error('❌ Error in addDatabaseEvent:', error);
      return false;
    }
  };

  // Update event in database
  const updateDatabaseEvent = async (updatedEvent: CalendarEvent): Promise<boolean> => {
    if (!canModifyEvents) {
      console.log('❌ Update denied: User lacks permission');
      toast({
        title: "Permission Denied",
        description: "Only admins and team members can edit calendar events",
        variant: "destructive",
      });
      return false;
    }

    // Extract database ID from prefixed ID
    const dbId = updatedEvent.id.replace('db-', '');
    console.log('📅 Updating database event:', dbId, updatedEvent);

    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .update({
          title: updatedEvent.title,
          type: updatedEvent.type as 'space' | 'meeting' | 'event',
          date: updatedEvent.date.toISOString().split('T')[0],
          time: updatedEvent.time || null,
          description: updatedEvent.description || null,
          link: updatedEvent.link || null
        })
        .eq('id', dbId)
        .select();

      if (error) {
        console.error('❌ Error updating calendar event:', error);
        toast({
          title: "Error",
          description: "Failed to update calendar event",
          variant: "destructive",
        });
        return false;
      }

      console.log('✅ Event updated successfully:', data);
      toast({
        title: "Event Updated",
        description: `"${updatedEvent.title}" has been updated`,
      });

      // Force refresh to ensure immediate UI update
      setTimeout(() => forceRefresh(), 500);
      return true;
    } catch (error) {
      console.error('❌ Error in updateDatabaseEvent:', error);
      return false;
    }
  };

  // Delete event from database
  const deleteDatabaseEvent = async (eventToDelete: CalendarEvent): Promise<boolean> => {
    if (!canModifyEvents) {
      console.log('❌ Delete denied: User lacks permission');
      toast({
        title: "Permission Denied",
        description: "Only admins and team members can delete calendar events",
        variant: "destructive",
      });
      return false;
    }

    // Extract database ID from prefixed ID
    const dbId = eventToDelete.id.replace('db-', '');
    console.log('🗑️ Deleting database event:', dbId, eventToDelete.title);

    try {
      // First, verify the event exists
      const { data: existingEvent, error: checkError } = await supabase
        .from('calendar_events')
        .select('id, title')
        .eq('id', dbId)
        .single();

      if (checkError || !existingEvent) {
        console.log('❌ Event not found in database:', dbId, checkError);
        toast({
          title: "Event Not Found",
          description: "The event may have already been deleted",
          variant: "destructive",
        });
        // Force refresh to sync UI with database
        setTimeout(() => forceRefresh(), 500);
        return false;
      }

      console.log('✅ Event exists in database, proceeding with deletion:', existingEvent);

      const { data, error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', dbId)
        .select();

      if (error) {
        console.error('❌ Error deleting calendar event:', error);
        toast({
          title: "Error",
          description: "Failed to delete calendar event",
          variant: "destructive",
        });
        return false;
      }

      console.log('✅ Event deleted successfully from database:', data);
      
      // Immediately remove from local state for instant UI feedback
      setEvents(prevEvents => {
        const filtered = prevEvents.filter(event => event.id !== eventToDelete.id);
        console.log('🔄 Updated local events after deletion:', filtered.length);
        return filtered;
      });

      toast({
        title: "Event Deleted",
        description: `"${eventToDelete.title}" has been deleted`,
      });

      // Force refresh after a short delay to ensure consistency
      setTimeout(() => {
        console.log('🔄 Force refreshing after deletion...');
        forceRefresh();
      }, 1000);

      return true;
    } catch (error) {
      console.error('❌ Error in deleteDatabaseEvent:', error);
      toast({
        title: "Error",
        description: "Failed to delete calendar event",
        variant: "destructive",
      });
      return false;
    }
  };

  // Set up real-time subscription and initial load
  useEffect(() => {
    loadDatabaseEvents();

    // Set up real-time subscription with enhanced logging
    console.log('📡 Setting up real-time subscription for calendar events...');
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
          console.log('📡 Calendar events real-time update received:', payload.eventType, payload);
          
          // Add small delay to ensure database consistency
          setTimeout(() => {
            console.log('🔄 Reloading events due to real-time update...');
            loadDatabaseEvents();
          }, 200);
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);
      });

    return () => {
      console.log('📡 Cleaning up real-time subscription...');
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
    reloadEvents: loadDatabaseEvents,
    forceRefresh
  };
};
