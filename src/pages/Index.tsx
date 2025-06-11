import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon } from "lucide-react";
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ContentScheduler from "@/components/ContentScheduler";
import Analytics from "@/components/Analytics";
import CalendarView from "@/components/CalendarView";
import { useScheduledPosts } from '@/hooks/useScheduledPosts';
import { usePublishedPosts } from '@/hooks/usePublishedPosts';

interface IndexProps {
  user: User;
}

const Index = ({ user }: IndexProps) => {
  const { toast } = useToast();
  const { scheduledPosts } = useScheduledPosts();
  const { publishedPosts } = usePublishedPosts();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Error",
          description: "Failed to sign out",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Signed out",
          description: "You have been signed out successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-blue-500/20 bg-slate-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
              <img 
                src="https://babydoge20.com/assets/images/BABYlogo.png" 
                alt="Based BabyDoge Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-white">Based BabyDoge Content Calendar</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-300">
              <UserIcon size={16} />
              <span className="text-sm">{user.email}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <LogOut size={16} className="mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="scheduler" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border border-blue-500/20 mb-8">
            <TabsTrigger 
              value="scheduler" 
              className="text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Content Scheduler
            </TabsTrigger>
            <TabsTrigger 
              value="calendar" 
              className="text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Calendar View
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Analytics
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="scheduler">
            <ContentScheduler />
          </TabsContent>
          
          <TabsContent value="calendar">
            <CalendarView scheduledPosts={scheduledPosts} publishedPosts={publishedPosts} />
          </TabsContent>
          
          <TabsContent value="analytics">
            <Analytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
