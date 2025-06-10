
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Clock, Server, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SchedulingDebugPanel = () => {
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<string>('');
  const { toast } = useToast();

  const currentLocalTime = new Date().toLocaleString();
  const currentUTCTime = new Date().toISOString();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const handleManualTrigger = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('schedule-processor');
      
      if (error) {
        console.error('Error triggering schedule processor:', error);
        toast({
          title: "Error",
          description: "Failed to trigger schedule processor",
          variant: "destructive",
        });
        return;
      }

      setLastCheck(new Date().toLocaleString());
      
      const result = data as any;
      toast({
        title: "Schedule Processor Triggered",
        description: result.summary || `Processed ${result.processed || 0} posts`,
      });

      console.log('Schedule processor result:', result);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-slate-800/50 border-blue-500/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Server className="text-blue-400" size={20} />
          Scheduling Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="text-blue-400" size={16} />
            <span className="text-slate-300">Local Time:</span>
            <Badge variant="outline" className="text-white">
              {currentLocalTime}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Server className="text-green-400" size={16} />
            <span className="text-slate-300">Server Time (UTC):</span>
            <Badge variant="outline" className="text-white">
              {currentUTCTime}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Globe className="text-purple-400" size={16} />
            <span className="text-slate-300">Time Zone:</span>
            <Badge variant="outline" className="text-white">
              {timeZone}
            </Badge>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-600">
          <Button 
            onClick={handleManualTrigger}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <RefreshCw className="animate-spin mr-2" size={16} />
            ) : (
              <RefreshCw className="mr-2" size={16} />
            )}
            Trigger Schedule Check Now
          </Button>
          
          {lastCheck && (
            <p className="text-xs text-slate-400 mt-2 text-center">
              Last manual check: {lastCheck}
            </p>
          )}
        </div>

        <div className="text-xs text-slate-400 space-y-1">
          <p><strong>Note:</strong> The scheduler runs automatically every minute.</p>
          <p>Posts are scheduled in UTC time. If a post doesn't publish, check:</p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Twitter API credentials are configured</li>
            <li>Post hasn't reached max retry attempts</li>
            <li>Scheduled time has passed (in UTC)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SchedulingDebugPanel;
