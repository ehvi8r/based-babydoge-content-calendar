
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, PlusCircle, Clock, BarChart3 } from 'lucide-react';
import ContentScheduler from '@/components/ContentScheduler';
import CalendarView from '@/components/CalendarView';
import Analytics from '@/components/Analytics';
import Header from '@/components/Header';

const Index = () => {
  const [activeTab, setActiveTab] = useState('scheduler');

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
            <CalendarView />
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
