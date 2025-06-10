
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ManualTrigger = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleManualTrigger = async () => {
    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('schedule-processor', {
        body: { manual: true }
      });

      if (error) {
        console.error('Error triggering processor:', error);
        toast({
          title: "Error",
          description: "Failed to trigger post processor",
          variant: "destructive",
        });
      } else {
        console.log('Processor response:', data);
        toast({
          title: "Processing Complete",
          description: `Processed ${data?.processed || 0} posts`,
        });
      }
    } catch (error) {
      console.error('Error calling function:', error);
      toast({
        title: "Error",
        description: "Failed to call processor function",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="bg-slate-800/50 border-blue-500/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <PlayCircle className="text-green-400" size={20} />
          Manual Processing
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleManualTrigger}
          disabled={isProcessing}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin mr-2" size={16} />
              Processing...
            </>
          ) : (
            <>
              <PlayCircle className="mr-2" size={16} />
              Process Scheduled Posts Now
            </>
          )}
        </Button>
        <p className="text-slate-400 text-xs mt-2">
          Manually trigger processing of scheduled posts for testing
        </p>
      </CardContent>
    </Card>
  );
};

export default ManualTrigger;
