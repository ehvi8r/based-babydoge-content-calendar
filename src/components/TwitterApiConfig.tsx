// Twitter API credentials are now managed securely via Supabase edge functions
// This component is deprecated - credentials are stored in Supabase secrets
// All Twitter API interactions go through the post-tweet edge function

import { Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const TwitterApiConfig = () => {
  return (
    <Alert className="bg-blue-900/20 border-blue-500/20">
      <Info className="h-4 w-4 text-blue-400" />
      <AlertDescription className="text-blue-200 text-sm">
        <strong>Security Update:</strong> Twitter API credentials are now securely managed via Supabase Edge Functions.
        The credentials are stored in Supabase secrets and accessed only by the backend.
      </AlertDescription>
    </Alert>
  );
};

export default TwitterApiConfig;
