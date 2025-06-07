
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Plus, Users, Clock, Edit, ExternalLink } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isAfter, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface CalendarEvent {
  id: string;
  title: string;
  type: 'post' | 'space' | 'meeting' | 'event';
  date: Date;
  time?: string;
  description?: string;
  link?: string;
  content?: string; // For scheduled posts
  hashtags?: string; // For scheduled posts
}

interface CalendarViewProps {
  scheduledPosts?: Array<{
    id: string;
    content: string;
    date: string;
    time: string;
    status: string;
    hashtags?: string;
  }>;
}

const CalendarView = ({ scheduledPosts = [] }: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'event' as CalendarEvent['type'],
    time: '',
    description: '',
    link: ''
  });
  const { toast } = useToast();

  console.log('CalendarView received scheduledPosts:', scheduledPosts);
  console.log('Current events state:', events);

  // Convert scheduled posts to calendar events
  const scheduledPostEvents: CalendarEvent[] = scheduledPosts.map(post => {
    console.log('Processing scheduled post:', post);
    return {
      id: `post-${post.id}`,
      title: post.content.substring(0, 50) + (post.content.length > 50 ? '...' : ''),
      type: 'post' as const,
      date: new Date(post.date),
      time: post.time,
      description: post.content,
      content: post.content,
      hashtags: post.hashtags
    };
  });

  // Combine scheduled posts with custom events
  const allEvents = [...scheduledPostEvents, ...events];
  console.log('All events combined:', allEvents);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDate = (date: Date) => {
    const eventsForDate = allEvents.filter(event => {
      const eventDate = new Date(event.date);
      return isSameDay(eventDate, date);
    });
    console.log(`Events for ${format(date, 'yyyy-MM-dd')}:`, eventsForDate);
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

  const isEventEditable = (event: CalendarEvent) => {
    if (!event.time) return true; // If no time specified, allow editing
    
    const now = new Date();
    const eventDateTime = new Date(event.date);
    const [hours, minutes] = event.time.split(':');
    eventDateTime.setHours(parseInt(hours), parseInt(minutes));
    
    return !isAfter(now, eventDateTime);
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Event clicked:', event);
    
    if (event.link && (event.type === 'space' || event.type === 'meeting')) {
      window.open(event.link, '_blank');
      return;
    }
    
    if (isEventEditable(event)) {
      setEditingEvent(event);
      setIsEditEventOpen(true);
    } else {
      toast({
        title: "Cannot Edit",
        description: "This event's scheduled time has already passed",
        variant: "destructive",
      });
    }
  };

  const handleAddEvent = () => {
    if (!newEvent.title || !selectedDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in the required fields",
        variant: "destructive",
      });
      return;
    }

    const eventToAdd: CalendarEvent = {
      id: Date.now().toString(),
      title: newEvent.title,
      type: newEvent.type,
      date: selectedDate,
      time: newEvent.time || undefined,
      description: newEvent.description || undefined,
      link: newEvent.link || undefined
    };

    console.log('Adding new event:', eventToAdd);
    setEvents(prevEvents => {
      const updatedEvents = [...prevEvents, eventToAdd];
      console.log('Updated events array:', updatedEvents);
      return updatedEvents;
    });
    
    toast({
      title: "Event Added",
      description: `"${newEvent.title}" has been added to your calendar`,
    });

    setNewEvent({
      title: '',
      type: 'event',
      time: '',
      description: '',
      link: ''
    });
    setIsAddEventOpen(false);
    setSelectedDate(null);
  };

  const handleEditEvent = () => {
    if (!editingEvent) return;

    if (editingEvent.type === 'post') {
      // Handle scheduled post editing
      toast({
        title: "Scheduled Post",
        description: "Scheduled post editing should be handled in the scheduled posts section",
      });
      setIsEditEventOpen(false);
      setEditingEvent(null);
      return;
    }

    // Update custom events
    setEvents(events.map(event => 
      event.id === editingEvent.id ? editingEvent : event
    ));

    toast({
      title: "Event Updated",
      description: `"${editingEvent.title}" has been updated`,
    });

    setIsEditEventOpen(false);
    setEditingEvent(null);
  };

  const navigateMonth = (direction: 'prev' | 'next' | 'today') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (direction === 'next') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      return new Date();
    }
    return newDate;
  };

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
            onClick={() => setCurrentDate(navigateMonth('prev'))}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentDate(navigateMonth('today'))}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Today
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentDate(navigateMonth('next'))}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Next
          </Button>
        </div>
      </div>

      <Card className="bg-slate-800/50 border-blue-500/20">
        <CardContent className="p-6">
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
              
              return (
                <div
                  key={day.toString()}
                  className={`min-h-[100px] p-2 border border-slate-600 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors ${
                    isCurrentMonth ? 'bg-slate-800/30' : 'bg-slate-900/30'
                  } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => {
                    setSelectedDate(day);
                    setIsAddEventOpen(true);
                  }}
                >
                  <div className={`text-sm mb-1 ${isCurrentMonth ? 'text-white' : 'text-slate-500'} ${isToday ? 'font-bold' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className={`text-xs p-1 rounded text-white ${getEventTypeColor(event.type)} flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity`}
                        title={event.description || event.title}
                        onClick={(e) => handleEventClick(event, e)}
                      >
                        {getEventTypeIcon(event.type)}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{event.title}</div>
                          {event.time && (
                            <div className="text-xs opacity-80">{event.time}</div>
                          )}
                        </div>
                        {isEventEditable(event) && (
                          <Edit size={10} className="opacity-60" />
                        )}
                        {event.link && (event.type === 'space' || event.type === 'meeting') && (
                          <ExternalLink size={10} className="opacity-60" />
                        )}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-slate-400">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add Event Dialog */}
      <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
        <DialogContent className="bg-slate-800 border-slate-600">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Plus className="text-blue-400" size={20} />
              Add Calendar Event
              {selectedDate && (
                <span className="text-sm text-slate-400">
                  - {format(selectedDate, 'PPP')}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="event-title" className="text-blue-200">Title</Label>
              <Input
                id="event-title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Event title..."
              />
            </div>

            <div>
              <Label htmlFor="event-type" className="text-blue-200">Type</Label>
              <select
                id="event-type"
                value={newEvent.type}
                onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as CalendarEvent['type'] })}
                className="w-full p-2 bg-slate-700 border border-slate-600 text-white rounded-md"
              >
                <option value="event">General Event</option>
                <option value="space">Twitter Space</option>
                <option value="meeting">Meeting</option>
              </select>
            </div>

            <div>
              <Label htmlFor="event-time" className="text-blue-200">Time (optional)</Label>
              <Input
                id="event-time"
                type="time"
                value={newEvent.time}
                onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            {(newEvent.type === 'space' || newEvent.type === 'meeting') && (
              <div>
                <Label htmlFor="event-link" className="text-blue-200">
                  {newEvent.type === 'space' ? 'Space Link' : 'Meeting Link'}
                </Label>
                <Input
                  id="event-link"
                  value={newEvent.link}
                  onChange={(e) => setNewEvent({ ...newEvent, link: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder={newEvent.type === 'space' ? 'https://twitter.com/i/spaces/...' : 'https://zoom.us/j/...'}
                />
              </div>
            )}

            <div>
              <Label htmlFor="event-description" className="text-blue-200">Description (optional)</Label>
              <Textarea
                id="event-description"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Event description..."
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleAddEvent}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add Event
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddEventOpen(false);
                  setSelectedDate(null);
                }}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={isEditEventOpen} onOpenChange={setIsEditEventOpen}>
        <DialogContent className="bg-slate-800 border-slate-600">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Edit className="text-blue-400" size={20} />
              Edit Event
              {editingEvent && (
                <Badge variant="secondary" className={`${getEventTypeColor(editingEvent.type)} text-white ml-2`}>
                  {editingEvent.type}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {editingEvent && (
            <div className="space-y-4">
              {editingEvent.type === 'post' ? (
                <div className="text-slate-300">
                  <p className="mb-2"><strong>Content:</strong> {editingEvent.content}</p>
                  <p className="mb-2"><strong>Hashtags:</strong> {editingEvent.hashtags}</p>
                  <p className="mb-2"><strong>Date:</strong> {format(editingEvent.date, 'PPP')}</p>
                  <p className="mb-4"><strong>Time:</strong> {editingEvent.time}</p>
                  <p className="text-sm text-slate-400">
                    To edit this scheduled post, please use the "Scheduled Posts" section in the Content Scheduler tab.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="edit-event-title" className="text-blue-200">Title</Label>
                    <Input
                      id="edit-event-title"
                      value={editingEvent.title}
                      onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-event-time" className="text-blue-200">Time</Label>
                    <Input
                      id="edit-event-time"
                      type="time"
                      value={editingEvent.time || ''}
                      onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  {(editingEvent.type === 'space' || editingEvent.type === 'meeting') && (
                    <div>
                      <Label htmlFor="edit-event-link" className="text-blue-200">
                        {editingEvent.type === 'space' ? 'Space Link' : 'Meeting Link'}
                      </Label>
                      <Input
                        id="edit-event-link"
                        value={editingEvent.link || ''}
                        onChange={(e) => setEditingEvent({ ...editingEvent, link: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="edit-event-description" className="text-blue-200">Description</Label>
                    <Textarea
                      id="edit-event-description"
                      value={editingEvent.description || ''}
                      onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3">
                {editingEvent.type !== 'post' && (
                  <Button
                    onClick={handleEditEvent}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Save Changes
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditEventOpen(false);
                    setEditingEvent(null);
                  }}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  {editingEvent.type === 'post' ? 'Close' : 'Cancel'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Legend */}
      <Card className="bg-slate-800/50 border-blue-500/20">
        <CardHeader>
          <CardTitle className="text-white text-lg">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded flex items-center justify-center">
                <Clock size={8} className="text-white" />
              </div>
              <span className="text-slate-300">Scheduled Posts</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded flex items-center justify-center">
                <Users size={8} className="text-white" />
              </div>
              <span className="text-slate-300">Twitter Spaces</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded flex items-center justify-center">
                <Users size={8} className="text-white" />
              </div>
              <span className="text-slate-300">Meetings</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded flex items-center justify-center">
                <Calendar size={8} className="text-white" />
              </div>
              <span className="text-slate-300">Events</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Click on events to edit them (if time hasn't passed). Links open in new tabs.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarView;
