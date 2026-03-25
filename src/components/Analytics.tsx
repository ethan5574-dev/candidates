import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { AnalyticsStats } from '../types';

export const Analytics: React.FC = () => {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('analytics');
      if (error) throw error;
      setStats(data);
    } catch (error: any) {
      console.error('Error fetching analytics:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    const subscription = supabase
      .channel('analytics_refresh')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'candidates' },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="glass-card h-32 rounded-3xl animate-pulse"></div>
      ))}
    </div>
  );
  
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="glass-card p-6 rounded-[32px] flex flex-col justify-between group overflow-hidden relative">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary opacity-5 blur-2xl group-hover:opacity-20 transition-opacity"></div>
        <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Total Candidates</p>
        <div className="flex items-end justify-between mt-2">
          <p className="text-4xl font-extrabold text-white">{stats.totalCandidates}</p>
          <div className="p-2 bg-primary/10 rounded-xl">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 rounded-[32px] flex flex-col justify-between group overflow-hidden relative">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-secondary opacity-5 blur-2xl group-hover:opacity-20 transition-opacity"></div>
        <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">New Hires (7d)</p>
        <div className="flex items-end justify-between mt-2">
          <p className="text-4xl font-extrabold text-white">{stats.newCandidatesLast7Days}</p>
          <div className="p-2 bg-secondary/10 rounded-xl">
            <svg className="w-5 h-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 rounded-[32px] col-span-1 md:col-span-2 overflow-hidden relative">
        <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4">Pipeline Distribution</p>
        <div className="flex gap-3 flex-wrap">
          {Object.entries(stats.statusRatios).map(([status, count]) => (
            <div key={status} className="px-4 py-2 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-2 group hover:border-white/10 transition-all">
              <span className={`w-2 h-2 rounded-full ${
                status === 'New' ? 'bg-blue-400' : 
                status === 'Interviewing' ? 'bg-yellow-400' : 
                status === 'Hired' ? 'bg-green-400' : 'bg-red-400'
              }`}></span>
              <span className="text-white font-bold">{count}</span>
              <span className="text-text-secondary text-xs">{status}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-8 rounded-[32px] col-span-1 md:col-span-4 overflow-hidden relative">
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Top Demand Positions</p>
          <span className="text-[10px] text-primary font-bold px-2 py-1 bg-primary/10 rounded-full">LIVE DATA</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.topPositions.map((pos, i) => (
            <div key={pos.position} className="p-5 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all group">
              <div className="flex items-center gap-3 mb-1">
                 <span className="text-[10px] font-black text-text-secondary">0{i + 1}</span>
                 <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{pos.position}</p>
              </div>
              <p className="text-xs text-text-secondary font-medium pl-6">{pos.count} Candidates</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
