import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { AnalyticsStats } from '../types';
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts';
import { Users, UserCheck, Calendar, Briefcase } from 'lucide-react';

// Mock data for the chart since the function only returns total counts
const chartData = [
  { name: 'Mon', count: 12 },
  { name: 'Tue', count: 18 },
  { name: 'Wed', count: 15 },
  { name: 'Thu', count: 25 },
  { name: 'Fri', count: 32 },
  { name: 'Sat', count: 20 },
  { name: 'Sun', count: 28 },
];

export const Analytics: React.FC = () => {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('analytics');
      if (error) throw error;
      setStats(data);
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      const isUnauthorized = error.status === 401 ||
        error.message?.includes('Unauthorized') ||
        (error.context && error.context.status === 401);

      if (isUnauthorized) {
        await supabase.auth.signOut();
        window.location.href = '/auth';
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const subscription = supabase
      .channel('analytics_refresh')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates' }, () => fetchStats())
      .subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, []);

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="glass-card h-32 rounded-[24px] animate-pulse"></div>
      ))}
    </div>
  );

  if (!stats) return null;

  const metricCards = [
    { label: 'Total Applications', value: stats.totalCandidates, icon: Users, color: 'text-primary', bg: 'bg-primary/10', trend: '+12%' },
    { label: 'New Hires', value: stats.newCandidatesLast7Days, icon: UserCheck, color: 'text-secondary', bg: 'bg-secondary/10', trend: '+5%' },
    { label: 'Interviews', value: stats.statusRatios['Interviewing'] || 0, icon: Calendar, color: 'text-accent', bg: 'bg-accent/10', trend: '0%' },
    { label: 'Open Positions', value: 8, icon: Briefcase, color: 'text-green-400', bg: 'bg-green-400/10', trend: '+2' },
  ];

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((card, i) => (
          <div key={i} className="glass-card p-6 rounded-[28px] border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <card.icon className={`w-12 h-12 ${card.color}`} />
            </div>
            <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-4`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">{card.label}</p>
              <div className="flex items-end gap-3">
                <p className="text-3xl font-black text-white">{card.value}</p>
                <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded-md mb-1">{card.trend}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 glass-card p-8 rounded-[32px] border border-white/5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-white">Candidate Pipeline</h3>
              <p className="text-xs text-text-secondary font-medium mt-1">Activity from last 7 days</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-[10px] font-bold text-primary">
                <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(129,140,248,0.5)]"></span>
                Current Week
              </div>
            </div>
          </div>

          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(13, 15, 25, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', fontSize: '12px' }}
                  itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="count" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-8 rounded-[32px] border border-white/5 flex flex-col">
          <h3 className="text-xl font-bold text-white mb-6">Status Breakdown</h3>
          <div className="space-y-6 flex-1 flex flex-col justify-center">
            {Object.entries(stats.statusRatios).map(([status, count]) => (
              <div key={status} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                  <span className="text-text-secondary">{status}</span>
                  <span className="text-white">{Math.round((count / stats.totalCandidates) * 100)}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${status === 'New' ? 'bg-blue-400' :
                        status === 'Interviewing' ? 'bg-yellow-400' :
                          status === 'Hired' ? 'bg-green-400' : 'bg-red-400'
                      }`}
                    style={{ width: `${(count / stats.totalCandidates) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-8 w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all">
            Detailed Report
          </button>
        </div>
      </div>
    </div>
  );
};
