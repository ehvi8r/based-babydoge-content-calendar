
-- Create enum for calendar event types (excluding 'post' since those come from scheduled_posts)
CREATE TYPE calendar_event_type AS ENUM ('space', 'meeting', 'event');

-- Create calendar_events table
CREATE TABLE public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type calendar_event_type NOT NULL DEFAULT 'event',
  date DATE NOT NULL,
  time TIME,
  description TEXT,
  link TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if user can modify calendar events
CREATE OR REPLACE FUNCTION public.can_modify_calendar_events(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'team_member')
  )
$$;

-- RLS Policies for calendar_events

-- Policy for SELECT: All authenticated users can view events
CREATE POLICY "All authenticated users can view calendar events"
  ON public.calendar_events
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for INSERT: Only admins and team members can create events
CREATE POLICY "Admins and team members can create calendar events"
  ON public.calendar_events
  FOR INSERT
  TO authenticated
  WITH CHECK (public.can_modify_calendar_events(auth.uid()));

-- Policy for UPDATE: Only admins and team members can update events
CREATE POLICY "Admins and team members can update calendar events"
  ON public.calendar_events
  FOR UPDATE
  TO authenticated
  USING (public.can_modify_calendar_events(auth.uid()))
  WITH CHECK (public.can_modify_calendar_events(auth.uid()));

-- Policy for DELETE: Only admins and team members can delete events
CREATE POLICY "Admins and team members can delete calendar events"
  ON public.calendar_events
  FOR DELETE
  TO authenticated
  USING (public.can_modify_calendar_events(auth.uid()));

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for calendar_events table
ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events;
