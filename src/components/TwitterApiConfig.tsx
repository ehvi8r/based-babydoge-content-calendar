
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TwitterApiCredentials {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
  bearerToken: string;
}

const TwitterApiConfig = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [credentials, setCredentials] = useState<TwitterApiCredentials>({
    apiKey: '',
    apiSecret: '',
    accessToken: '',
    accessTokenSecret: '',
    bearerToken: ''
  });
  const [isConfigured, setIsConfigured] = useState(false);
  const { toast } = useToast();

  // Load saved credentials on component mount
  useEffect(() => {
    const savedCredentials = localStorage.getItem('twitter-api-credentials');
    if (savedCredentials) {
      const parsed = JSON.parse(savedCredentials);
      setCredentials(parsed);
      setIsConfigured(true);
    }
  }, []);

  const handleSave = () => {
    // Validate that all required fields are filled
    const requiredFields = ['apiKey', 'apiSecret', 'accessToken', 'accessTokenSecret'];
    const missingFields = requiredFields.filter(field => !credentials[field as keyof TwitterApiCredentials]);
    
    if (missingFields.length > 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required API credentials",
        variant: "destructive",
      });
      return;
    }

    // Save to localStorage
    localStorage.setItem('twitter-api-credentials', JSON.stringify(credentials));
    setIsConfigured(true);
    setIsOpen(false);
    
    toast({
      title: "API Credentials Saved",
      description: "Your X/Twitter API credentials have been saved successfully",
    });
  };

  const handleClear = () => {
    localStorage.removeItem('twitter-api-credentials');
    setCredentials({
      apiKey: '',
      apiSecret: '',
      accessToken: '',
      accessTokenSecret: '',
      bearerToken: ''
    });
    setIsConfigured(false);
    
    toast({
      title: "API Credentials Cleared",
      description: "Your X/Twitter API credentials have been removed",
    });
  };

  const handleInputChange = (field: keyof TwitterApiCredentials, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`flex items-center gap-2 ${
            isConfigured 
              ? 'border-green-500/50 bg-green-500/10 text-green-400 hover:bg-green-500/20' 
              : 'border-slate-600 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Key size={16} />
          {isConfigured ? 'API Connected' : 'Setup API'}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="bg-slate-800 border-blue-500/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Settings size={20} className="text-blue-400" />
            X/Twitter API Configuration
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-blue-200 bg-blue-900/20 p-3 rounded">
            Get your API credentials from the{' '}
            <a 
              href="https://developer.twitter.com/en/portal/dashboard" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 underline hover:text-blue-300"
            >
              X Developer Portal
            </a>
          </div>

          <div>
            <Label htmlFor="api-key" className="text-blue-200">API Key *</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Your API Key"
              value={credentials.apiKey}
              onChange={(e) => handleInputChange('apiKey', e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>

          <div>
            <Label htmlFor="api-secret" className="text-blue-200">API Secret *</Label>
            <Input
              id="api-secret"
              type="password"
              placeholder="Your API Secret"
              value={credentials.apiSecret}
              onChange={(e) => handleInputChange('apiSecret', e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>

          <div>
            <Label htmlFor="access-token" className="text-blue-200">Access Token *</Label>
            <Input
              id="access-token"
              type="password"
              placeholder="Your Access Token"
              value={credentials.accessToken}
              onChange={(e) => handleInputChange('accessToken', e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>

          <div>
            <Label htmlFor="access-token-secret" className="text-blue-200">Access Token Secret *</Label>
            <Input
              id="access-token-secret"
              type="password"
              placeholder="Your Access Token Secret"
              value={credentials.accessTokenSecret}
              onChange={(e) => handleInputChange('accessTokenSecret', e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>

          <div>
            <Label htmlFor="bearer-token" className="text-blue-200">Bearer Token (Optional)</Label>
            <Input
              id="bearer-token"
              type="password"
              placeholder="Your Bearer Token"
              value={credentials.bearerToken}
              onChange={(e) => handleInputChange('bearerToken', e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleSave}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Credentials
            </Button>
            {isConfigured && (
              <Button 
                variant="outline" 
                onClick={handleClear}
                className="border-red-500/50 text-red-400 hover:bg-red-500/20"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TwitterApiConfig;
