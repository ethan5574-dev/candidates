import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { AnalyticsStats } from '../types';
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts';
import { Users, UserCheck, Calendar, Briefcase } from 'lucide-react';

// Removed hardcoded chartData as we now fetch it from the Edge Function

export const Analytics: React.FC = () => {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('analytics');
      if (error) throw error;
      
      // Explicitly check for error in the data payload (from Edge Function)
      if (data?.error) {
        throw new Error(data.error);
      }
      
      setStats(data);
    } catch (error: Error | unknown) {
      console.error('Error fetching analytics:', error);
      const err = error as { status?: number; message?: string };
      const isUnauthorized = err.status === 401 ||
        err.message?.includes('Unauthorized') ||
        err.message?.includes('JWT');

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

  if (!stats || !stats.topPositions || !stats.statusRatios || !stats.weeklyActivity || !stats.recentCandidates) {
    return null;
  }

  const activeRolesCount = stats.topPositions?.length || 0;

  const metricCards = [
    { label: 'Total Applications', value: stats.totalCandidates || 0, icon: Users, color: 'text-primary', bg: 'bg-primary/10', trend: '+12%' },
    { label: 'Recent (7 Days)', value: stats.recentCandidates?.length || 0, icon: UserCheck, color: 'text-secondary', bg: 'bg-secondary/10', trend: 'Live' },
    { label: 'Interviews', value: stats.statusRatios?.['Interviewing'] || 0, icon: Calendar, color: 'text-accent', bg: 'bg-accent/10', trend: '0%' },
    { label: 'Active Roles', value: activeRolesCount, icon: Briefcase, color: 'text-green-400', bg: 'bg-green-400/10', trend: 'Real' },
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
              <AreaChart data={stats.weeklyActivity}>
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
          <h3 className="text-xl font-bold text-white mb-6">Recent Candidates</h3>
          <div className="space-y-4 flex-1">
            {stats.recentCandidates.length > 0 ? (
              stats.recentCandidates.map((candidate) => (
                <div key={candidate.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                      {candidate.full_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white leading-tight">{candidate.full_name}</p>
                      <p className="text-[10px] text-text-secondary">{candidate.job_title}</p>
                    </div>
                  </div>
                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                    candidate.status === 'Hired' ? 'bg-green-400/20 text-green-400' :
                    candidate.status === 'Rejected' ? 'bg-red-400/20 text-red-400' :
                    'bg-primary/20 text-primary'
                  }`}>
                    {candidate.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-[10px] text-text-secondary text-center py-10">No recent applications</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 glass-card p-8 rounded-[32px] border border-white/5 flex flex-col">
          <h3 className="text-xl font-bold text-white mb-6">Status Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Object.entries(stats.statusRatios).map(([status, count]) => (
              <div key={status} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">{status}</p>
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-black text-white">{count}</p>
                  <p className="text-[8px] font-bold text-text-secondary mb-1">({Math.round((count / stats.totalCandidates) * 100)}%)</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-8 rounded-[32px] border border-white/5 flex flex-col">
          <h3 className="text-xl font-bold text-white mb-6">Top Roles</h3>
          <div className="space-y-4">
            {stats.topPositions.map((pos, idx) => (
              <div key={pos.position} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-text-secondary">0{idx + 1}</span>
                  <span className="text-xs font-bold text-white">{pos.position}</span>
                </div>
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{pos.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
