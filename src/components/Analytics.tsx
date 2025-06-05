
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, MessageCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const Analytics = () => {
  const engagementData = [
    { time: '9 AM', engagement: 450, reach: 1200 },
    { time: '1 PM', engagement: 320, reach: 980 },
    { time: '7 PM', engagement: 680, reach: 1850 },
  ];

  const weeklyData = [
    { day: 'Mon', posts: 3, engagement: 1250 },
    { day: 'Tue', posts: 2, engagement: 890 },
    { day: 'Wed', posts: 3, engagement: 1420 },
    { day: 'Thu', posts: 2, engagement: 950 },
    { day: 'Fri', posts: 4, engagement: 1680 },
    { day: 'Sat', posts: 2, engagement: 750 },
    { day: 'Sun', posts: 1, engagement: 520 },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
        <BarChart3 className="text-blue-400" size={24} />
        Analytics Dashboard
      </h2>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Reach</p>
                <p className="text-2xl font-bold text-white">12.4K</p>
                <p className="text-sm text-green-400">+15.3% vs last week</p>
              </div>
              <Users className="text-blue-400" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Engagement Rate</p>
                <p className="text-2xl font-bold text-white">8.7%</p>
                <p className="text-sm text-green-400">+2.1% vs last week</p>
              </div>
              <TrendingUp className="text-green-400" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Posts This Week</p>
                <p className="text-2xl font-bold text-white">17</p>
                <p className="text-sm text-blue-400">2.4 avg/day</p>
              </div>
              <MessageCircle className="text-purple-400" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Best Time</p>
                <p className="text-2xl font-bold text-white">7 PM</p>
                <p className="text-sm text-green-400">68% engagement</p>
              </div>
              <BarChart3 className="text-yellow-400" size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-blue-500/20">
          <CardHeader>
            <CardTitle className="text-white">Optimal Posting Times</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Bar dataKey="engagement" fill="#3B82F6" />
                <Bar dataKey="reach" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-blue-500/20">
          <CardHeader>
            <CardTitle className="text-white">Weekly Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Line type="monotone" dataKey="engagement" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Content Performance */}
      <Card className="bg-slate-800/50 border-blue-500/20">
        <CardHeader>
          <CardTitle className="text-white">Top Performing Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                content: "🚀 BabyDoge just hit a new milestone! Our community is growing stronger every day...",
                engagement: "1.2K",
                reach: "4.5K",
                time: "2 days ago"
              },
              {
                content: "💎 Diamond hands unite! Here's why BabyDoge is more than just a meme coin...",
                engagement: "890",
                reach: "3.1K",
                time: "4 days ago"
              },
              {
                content: "🔥 Exciting partnership announcement coming this week! Stay tuned...",
                engagement: "756",
                reach: "2.8K",
                time: "6 days ago"
              }
            ].map((post, index) => (
              <div key={index} className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-white mb-2 line-clamp-2">{post.content}</p>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex gap-4 text-slate-400">
                    <span>👍 {post.engagement}</span>
                    <span>👀 {post.reach}</span>
                  </div>
                  <span className="text-slate-400">{post.time}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
