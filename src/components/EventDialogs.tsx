
import { useState } from 'react';
import { format, isAfter } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Lock, Database } from 'lucide-react';
import { CalendarEvent } from '@/hooks/useCalendarEvents';
import { isFeatureEnabled } from '@/utils/featureFlags';

interface EventDialogsProps {
  isAddEventOpen: boolean;
  setIsAddEventOpen: (open: boolean) => void;
  isEditEventOpen: boolean;
  setIsEditEventOpen: (open: boolean) => void;
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
  editingEvent: CalendarEvent | null;
  setEditingEvent: (event: CalendarEvent | null) => void;
  onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  onEditEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (event: CalendarEvent) => void;
  canModifyEvents?: boolean;
}

const EventDialogs = ({
  isAddEventOpen,
  setIsAddEventOpen,
  isEditEventOpen,
  setIsEditEventOpen,
  selectedDate,
  setSelectedDate,
  editingEvent,
  setEditingEvent,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
  canModifyEvents = true
}: EventDialogsProps) => {
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'event' as CalendarEvent['type'],
    time: '',
    description: '',
    link: ''
  });

  const useDatabaseEvents = isFeatureEnabled('USE_DATABASE_CALENDAR_EVENTS');

  const isEventEditable = (event: CalendarEvent) => {
    if (!event.time) return true;
    
    const now = new Date();
    const eventDateTime = new Date(event.date);
    const [hours, minutes] = event.time.split(':');
    eventDateTime.setHours(parseInt(hours), parseInt(minutes));
    
    return !isAfter(now, eventDateTime);
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

  const handleAddEvent = () => {
    if (!newEvent.title || !selectedDate) return;

    if (useDatabaseEvents && !canModifyEvents) {
      return; // Should not reach here due to UI restrictions
    }

    onAddEvent({
      title: newEvent.title,
      type: newEvent.type,
      date: selectedDate,
      time: newEvent.time || undefined,
      description: newEvent.description || undefined,
      link: newEvent.link || undefined
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
    onEditEvent(editingEvent);
    setIsEditEventOpen(false);
    setEditingEvent(null);
  };

  const handleDeleteEvent = () => {
    if (!editingEvent) return;
    onDeleteEvent(editingEvent);
    setIsEditEventOpen(false);
    setEditingEvent(null);
  };

  // Check if user can modify this specific event
  const canModifyThisEvent = () => {
    if (!useDatabaseEvents) return true; // localStorage mode allows all modifications
    return canModifyEvents;
  };

  return (
    <>
      {/* Add Event Dialog */}
      <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
        <DialogContent className="bg-slate-800 border-slate-600">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Plus className="text-blue-400" size={20} />
              Add Calendar Event
              {useDatabaseEvents && (
                <Badge variant="secondary" className="bg-blue-600 text-white">
                  <Database size={12} className="mr-1" />
                  Team Calendar
                </Badge>
              )}
              {selectedDate && (
                <span className="text-sm text-slate-400">
                  - {format(selectedDate, 'PPP')}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {/* Permission check for database mode */}
          {useDatabaseEvents && !canModifyEvents ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-4 bg-orange-900/20 border border-orange-500/30 rounded-lg">
                <Lock className="text-orange-400" size={20} />
                <div className="text-orange-300">
                  <div className="font-medium">Permission Required</div>
                  <div className="text-sm text-orange-400">
                    Only admins and team members can create calendar events in team mode.
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddEventOpen(false);
                    setSelectedDate(null);
                  }}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
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
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={isEditEventOpen} onOpenChange={setIsEditEventOpen}>
        <DialogContent className="bg-slate-800 border-slate-600">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Edit className="text-blue-400" size={20} />
              Edit {editingEvent?.type === 'post' ? 'Scheduled Post' : 'Event'}
              {editingEvent && (
                <>
                  <Badge variant="secondary" className={`${getEventTypeColor(editingEvent.type)} text-white ml-2`}>
                    {editingEvent.type}
                  </Badge>
                  {useDatabaseEvents && editingEvent.id.startsWith('db-') && (
                    <Badge variant="secondary" className="bg-blue-600 text-white">
                      <Database size={12} className="mr-1" />
                      Team
                    </Badge>
                  )}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {editingEvent && (
            <div className="space-y-4">
              {editingEvent.type === 'post' ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-post-content" className="text-blue-200">Content</Label>
                    <Textarea
                      id="edit-post-content"
                      value={editingEvent.description || editingEvent.content || ''}
                      onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value, content: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-post-hashtags" className="text-blue-200">Hashtags</Label>
                    <Input
                      id="edit-post-hashtags"
                      value={editingEvent.hashtags || ''}
                      onChange={(e) => setEditingEvent({ ...editingEvent, hashtags: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="text-sm text-slate-400">
                    <p><strong>Date:</strong> {format(editingEvent.date, 'PPP')}</p>
                    <p><strong>Time:</strong> {editingEvent.time}</p>
                  </div>
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
                      disabled={useDatabaseEvents && !canModifyEvents}
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
                      disabled={useDatabaseEvents && !canModifyEvents}
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
                        disabled={useDatabaseEvents && !canModifyEvents}
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
                      disabled={useDatabaseEvents && !canModifyEvents}
                    />
                  </div>

                  {/* Permission notice for database mode */}
                  {useDatabaseEvents && !canModifyEvents && (
                    <div className="flex items-center gap-2 p-3 bg-orange-900/20 border border-orange-500/30 rounded-lg">
                      <Lock className="text-orange-400" size={16} />
                      <div className="text-sm text-orange-300">
                        Only admins and team members can edit team calendar events
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-3">
                {isEventEditable(editingEvent) && canModifyThisEvent() && (
                  <>
                    <Button
                      onClick={handleEditEvent}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Save Changes
                    </Button>
                    <Button
                      onClick={handleDeleteEvent}
                      variant="outline"
                      className="border-red-500 text-red-400 hover:bg-red-500/20"
                    >
                      <Trash2 size={16} className="mr-1" />
                      Delete
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditEventOpen(false);
                    setEditingEvent(null);
                  }}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  {(!isEventEditable(editingEvent) || !canModifyThisEvent()) ? 'Close' : 'Cancel'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EventDialogs;
