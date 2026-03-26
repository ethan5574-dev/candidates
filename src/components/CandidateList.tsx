import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { Candidate } from '../types';
import { Search, MoreHorizontal, Star, Download, Eye, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import { Dropdown } from './common/Dropdown';

export const CandidateList: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchCandidates();
    const subscription = supabase
      .channel('candidates_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setCandidates((prev) => [payload.new as Candidate, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setCandidates((prev) => prev.map((c) => (c.id === payload.new.id ? { ...c, ...payload.new } as Candidate : c)));
        } else if (payload.eventType === 'DELETE') {
          setCandidates((prev) => prev.filter((c) => c.id !== payload.old.id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('candidates')
        .update({ status: newStatus })
        .eq('id', id);
        
      if (error) throw error;
    } catch (error: any) {
      console.error('Error updating status:', error);
      const isUnauthorized = error.status === 401 || 
                             error.message?.includes('Unauthorized') || 
                             (error.context && error.context.status === 401);
      if (isUnauthorized) {
        await supabase.auth.signOut();
        window.location.href = '/auth';
      }
    }
  };

  const fetchCandidates = async () => {
    try {
      const { data, error } = await supabase.from('candidates').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setCandidates(data || []);
    } catch (error: any) {
      console.error('Error fetching candidates:', error);
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

  const filteredCandidates = useMemo(() => {
    let result = candidates.filter(c => {
      const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
      return matchesStatus;
    });

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      // Implementation of "Matching Score" algorithm for Smart Sort
      result = result.map(c => {
        let score = 0;
        const nameChars = c.full_name.toLowerCase();
        const posChars = c.applied_position.toLowerCase();

        // Exact match starts with (high priority)
        if (nameChars.startsWith(term)) score += 100;
        if (posChars.startsWith(term)) score += 80;

        // Word match
        if (nameChars.includes(term)) score += 50;
        if (posChars.includes(term)) score += 40;

        // Split word matches
        const words = term.split(/\s+/);
        words.forEach(word => {
          if (nameChars.includes(word)) score += 10;
          if (posChars.includes(word)) score += 5;
        });

        return { ...c, score };
      })
      .filter((c: any) => c.score > 0)
      .sort((a: any, b: any) => b.score - a.score);
    }

    return result;
  }, [candidates, searchTerm, statusFilter]);

  if (loading) return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="glass-card h-20 rounded-[20px] animate-pulse"></div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setStatusFilter('All')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${statusFilter === 'All' ? 'bg-primary text-white' : 'bg-white/5 text-text-secondary hover:bg-white/10'}`}
          >
            All Candidates
          </button>
          <button 
            onClick={() => setStatusFilter('Interviewing')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${statusFilter === 'Interviewing' ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/20' : 'bg-white/5 text-text-secondary hover:bg-white/10'}`}
          >
            Interviews
          </button>
          <button 
            onClick={() => setStatusFilter('Hired')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${statusFilter === 'Hired' ? 'bg-green-400/20 text-green-400 border border-green-400/20' : 'bg-white/5 text-text-secondary hover:bg-white/10'}`}
          >
            Hired
          </button>
        </div>

        <div className="relative group min-w-[280px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search candidates..." 
            className="w-full pl-12 pr-4 py-2.5 bg-white/5 border border-white/5 rounded-xl text-sm focus:outline-none focus:bg-white/10 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-card rounded-[32px] border border-white/5">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead className="bg-white/5 border-b border-white/5">
            <tr className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
              <th className="px-8 py-5 rounded-tl-[31px]">Candidate Name</th>
              <th className="px-6 py-5">Role Applied</th>
              <th className="px-6 py-5">Rating</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-8 py-5 text-right rounded-tr-[31px]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredCandidates.map((c, i) => (
              <motion.tr 
                key={c.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 overflow-hidden shadow-lg">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.full_name}`} alt="avatar" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{c.full_name}</p>
                      <p className="text-[10px] font-bold text-text-secondary mt-0.5">{new Date(c.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-text-secondary" />
                    <span className="text-xs font-semibold text-white/80">{c.applied_position}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-0.5 text-yellow-500">
                    {[...Array(5)].map((_, idx) => (
                      <Star key={idx} className={`w-3 h-3 ${idx < 4 ? 'fill-current' : 'text-white/10'}`} />
                    ))}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <Dropdown
                    value={c.status}
                    onChange={(val) => updateStatus(c.id, val)}
                    options={[
                      { id: 'New', label: 'New', colorClass: 'text-blue-400' },
                      { id: 'Interviewing', label: 'Interviewing', colorClass: 'text-yellow-400' },
                      { id: 'Hired', label: 'Hired', colorClass: 'text-green-400' },
                      { id: 'Rejected', label: 'Rejected', colorClass: 'text-red-400' },
                    ]}
                  />
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex items-center justify-end gap-2 translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    {c.resume_url && (
                      <a 
                        href={c.resume_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="p-2 hover:bg-white/10 rounded-lg text-text-secondary hover:text-white transition-all"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                    <button className="p-2 hover:bg-white/10 rounded-lg text-text-secondary hover:text-white transition-all">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-lg text-text-secondary hover:text-white transition-all">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        
        {filteredCandidates.length === 0 && (
          <div className="p-20 text-center">
            <p className="text-text-secondary font-bold uppercase tracking-widest text-sm opacity-20">No matching candidates found</p>
          </div>
        )}
      </div>
    </div>
  );
};
