import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { Candidate } from '../types';

export const CandidateList: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'name'>('newest');

  useEffect(() => {
    fetchCandidates();

    const subscription = supabase
      .channel('candidates_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'candidates' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setCandidates((prev) => [payload.new as Candidate, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setCandidates((prev) => 
              prev.map((c) => (c.id === payload.new.id ? { ...c, ...payload.new } as Candidate : c))
            );
          } else if (payload.eventType === 'DELETE') {
            setCandidates((prev) => prev.filter((c) => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchCandidates = async () => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCandidates(data || []);
    } catch (error: any) {
      console.error('Error fetching candidates:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('candidates')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      alert(`Error updating status: ${error.message}`);
    }
  };

  const filteredCandidates = useMemo(() => {
    let result = [...candidates];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.full_name.toLowerCase().includes(term) ||
          c.applied_position.toLowerCase().includes(term)
      );
    }
    if (statusFilter !== 'All') {
      result = result.filter((c) => c.status === statusFilter);
    }
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.full_name.localeCompare(b.full_name));
    }
    return result;
  }, [candidates, searchTerm, statusFilter, sortBy]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass-card h-24 rounded-3xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="glass-card p-4 rounded-[32px] border border-white/5 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex-1 min-w-[300px] relative group">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search name or position..."
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <select
            className="px-4 py-3 bg-white/5 border border-white/5 rounded-2xl text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="New">New</option>
            <option value="Interviewing">Interviewing</option>
            <option value="Hired">Hired</option>
            <option value="Rejected">Rejected</option>
          </select>
          <select
            className="px-4 py-3 bg-white/5 border border-white/5 rounded-2xl text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'name')}
          >
            <option value="newest">Newest</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredCandidates.length === 0 ? (
          <div className="glass-card p-12 rounded-[32px] text-center border border-white/5">
            <p className="text-text-secondary font-medium">No candidates match your criteria.</p>
          </div>
        ) : (
          filteredCandidates.map((c) => (
            <div key={c.id} className="glass-card group p-6 rounded-[32px] border border-white/5 hover:border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5 flex-1">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/10 text-white font-black text-xl shadow-lg">
                  {c.full_name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{c.full_name}</h4>
                  <p className="text-sm font-semibold text-text-secondary">{c.applied_position}</p>
                  <p className="text-[10px] font-bold text-white/30 uppercase mt-1">Applied on {new Date(c.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 w-full md:w-auto">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
                  <span className={`w-2 h-2 rounded-full animate-pulse ${
                    c.status === 'New' ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]' : 
                    c.status === 'Interviewing' ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 
                    c.status === 'Hired' ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 
                    'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]'}`}></span>
                  <span className="text-xs font-bold text-white/90">{c.status}</span>
                </div>

                <div className="flex items-center gap-4">
                  {c.resume_url && (
                    <a href={c.resume_url} target="_blank" rel="noopener noreferrer" className="p-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-2xl border border-primary/10 transition-all active:scale-95" title="View Resume">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </a>
                  )}
                  
                  <select
                    className="bg-white/5 border border-white/5 text-white/70 text-xs font-bold px-4 py-2.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer hover:bg-white/10 transition-all"
                    value={c.status}
                    onChange={(e) => updateStatus(c.id, e.target.value)}
                  >
                    <option value="New">Set: New</option>
                    <option value="Interviewing">Interviewing</option>
                    <option value="Hired">Hired</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
