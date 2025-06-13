
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CalendarEvent } from '@/hooks/useCalendarEvents';
import { parseISO, isValid } from 'date-fns';

interface CalendarMigrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onMigrationComplete: () => void;
}

const CalendarMigrationDialog = ({ isOpen, onClose, onMigrationComplete }: CalendarMigrationDialogProps) => {
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{
    success: boolean;
    migrated: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const { toast } = useToast();

  const safeParseDateFromStorage = (dateValue: any): Date | null => {
    if (!dateValue) return null;
    
    if (dateValue instanceof Date && isValid(dateValue)) {
      return dateValue;
    }
    
    if (typeof dateValue === 'string') {
      const parsed = parseISO(dateValue);
      if (isValid(parsed)) {
        return parsed;
      }
      
      const fallback = new Date(dateValue);
      if (isValid(fallback)) {
        return fallback;
      }
    }
    
    return null;
  };

  const migrateLocalStorageEvents = async () => {
    setMigrating(true);
    setMigrationResult(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to migrate your calendar events",
          variant: "destructive",
        });
        return;
      }

      // Load events from localStorage
      const savedEvents = localStorage.getItem('calendarEvents');
      if (!savedEvents) {
        setMigrationResult({
          success: true,
          migrated: 0,
          skipped: 0,
          errors: ['No localStorage events found to migrate']
        });
        setMigrating(false);
        return;
      }

      const localEvents: CalendarEvent[] = JSON.parse(savedEvents);
      console.log('📅 Found localStorage events to migrate:', localEvents);

      let migrated = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const event of localEvents) {
        try {
          // Skip post events (these are handled by scheduled posts)
          if (event.type === 'post') {
            skipped++;
            continue;
          }

          // Parse and validate date
          const eventDate = safeParseDateFromStorage(event.date);
          if (!eventDate) {
            errors.push(`Invalid date for event: ${event.title}`);
            continue;
          }

          // Insert into database
          const { error } = await supabase
            .from('calendar_events')
            .insert({
              title: event.title,
              type: event.type as 'space' | 'meeting' | 'event',
              date: eventDate.toISOString().split('T')[0],
              time: event.time || null,
              description: event.description || null,
              link: event.link || null,
              created_by: user.id
            });

          if (error) {
            console.error('Error migrating event:', error);
            errors.push(`Failed to migrate "${event.title}": ${error.message}`);
          } else {
            migrated++;
            console.log('✅ Migrated event:', event.title);
          }
        } catch (error) {
          console.error('Error processing event:', error);
          errors.push(`Error processing "${event.title}": ${error}`);
        }
      }

      setMigrationResult({
        success: true,
        migrated,
        skipped,
        errors
      });

      if (migrated > 0) {
        toast({
          title: "Migration Complete",
          description: `Successfully migrated ${migrated} calendar events to the team calendar`,
        });
        
        // Clear localStorage events after successful migration
        localStorage.removeItem('calendarEvents');
        console.log('📅 Cleared localStorage events after migration');
        
        // Trigger calendar reload
        onMigrationComplete();
      }

    } catch (error) {
      console.error('Migration error:', error);
      setMigrationResult({
        success: false,
        migrated: 0,
        skipped: 0,
        errors: [`Migration failed: ${error}`]
      });
    } finally {
      setMigrating(false);
    }
  };

  const handleClose = () => {
    setMigrationResult(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-slate-600 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Database className="text-blue-400" size={20} />
            Migrate Calendar Events
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-slate-300">
            <p>This will migrate your personal calendar events from localStorage to the team calendar database.</p>
            <div className="mt-2 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-blue-300 text-sm">
                <Database size={16} />
                <span>Team Calendar Mode Active</span>
              </div>
            </div>
          </div>

          {migrationResult ? (
            <div className="space-y-3">
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                migrationResult.success 
                  ? 'bg-green-900/20 border border-green-500/30' 
                  : 'bg-red-900/20 border border-red-500/30'
              }`}>
                {migrationResult.success ? (
                  <CheckCircle className="text-green-400" size={16} />
                ) : (
                  <AlertCircle className="text-red-400" size={16} />
                )}
                <div className="text-sm">
                  <div className={migrationResult.success ? 'text-green-300' : 'text-red-300'}>
                    Migration {migrationResult.success ? 'Complete' : 'Failed'}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Migrated: {migrationResult.migrated} • Skipped: {migrationResult.skipped}
                  </div>
                </div>
              </div>

              {migrationResult.errors.length > 0 && (
                <div className="text-xs text-slate-400 max-h-32 overflow-y-auto">
                  <div className="font-medium mb-1">Details:</div>
                  {migrationResult.errors.map((error, index) => (
                    <div key={index}>• {error}</div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-slate-400">
              <p>• Scheduled posts are automatically synced</p>
              <p>• Only personal calendar events will be migrated</p>
              <p>• Your localStorage will be cleared after migration</p>
            </div>
          )}

          <div className="flex gap-3">
            {!migrationResult ? (
              <Button
                onClick={migrateLocalStorageEvents}
                disabled={migrating}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {migrating ? (
                  <>
                    <Upload className="animate-spin mr-2" size={16} />
                    Migrating...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2" size={16} />
                    Start Migration
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleClose}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Done
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={handleClose}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
              disabled={migrating}
            >
              {migrationResult ? 'Close' : 'Cancel'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CalendarMigrationDialog;
