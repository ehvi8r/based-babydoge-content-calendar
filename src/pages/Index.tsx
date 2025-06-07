
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, PlusCircle, Clock, BarChart3 } from 'lucide-react';
import ContentScheduler from '@/components/ContentScheduler';
import CalendarView from '@/components/CalendarView';
import Analytics from '@/components/Analytics';
import Header from '@/components/Header';

const Index = () => {
  const [activeTab, setActiveTab] = useState('scheduler');

  // Mock scheduled posts data - in a real app this would come from a state management solution
  const scheduledPosts = [
    {
      id: '1',
      content: 'Exciting news! BabyDoge is making waves in the DeFi space with our latest partnership announcement. This collaboration will bring new opportunities for our community and expand our reach in the crypto ecosystem. Stay tuned for more updates! 🚀',
      date: '2024-01-15',
      time: '09:00',
      status: 'scheduled',
      hashtags: '#BabyDoge #DeFi #Crypto #Partnership'
    },
    {
      id: '2',
      content: 'Community update: Our latest partnership announcement is generating incredible buzz across the crypto space. The team has been working tirelessly to bring you innovative solutions that will revolutionize how you interact with DeFi protocols.',
      date: '2024-01-15',
      time: '13:00',
      status: 'scheduled',
      hashtags: '#BabyDoge #Partnership #Announcement #Community'
    },
    {
      id: '3',
      content: 'Weekly market analysis and BabyDoge performance review. This week has shown remarkable growth and adoption across multiple metrics. Our trading volume has increased significantly, and the community engagement is at an all-time high.',
      date: '2024-01-15',
      time: '19:00',
      status: 'scheduled',
      hashtags: '#BabyDoge #MarketAnalysis #Weekly #Performance'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            BabyDoge Content Calendar
          </h1>
          <p className="text-blue-200 text-lg">
            Schedule and manage your X/Twitter content for babydoge20.com
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-slate-800/50 border border-blue-500/20">
            <TabsTrigger 
              value="scheduler" 
              className="flex items-center gap-2 text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <PlusCircle size={18} />
              Content Scheduler
            </TabsTrigger>
            <TabsTrigger 
              value="calendar" 
              className="flex items-center gap-2 text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Calendar size={18} />
              Calendar View
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="flex items-center gap-2 text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <BarChart3 size={18} />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scheduler" className="mt-0">
            <ContentScheduler />
          </TabsContent>
          
          <TabsContent value="calendar" className="mt-0">
            <CalendarView scheduledPosts={scheduledPosts} />
          </TabsContent>
          
          <TabsContent value="analytics" className="mt-0">
            <Analytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
