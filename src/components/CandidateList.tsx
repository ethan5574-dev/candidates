import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Search, MoreHorizontal, Download, Trash2, Briefcase, Sparkles, Filter } from 'lucide-react';
import type { Candidate, Job } from '../types';
import { motion } from 'framer-motion';
import { Dropdown } from './common/Dropdown';
import { useToast } from '../context/useToast';

export const CandidateList: React.FC = () => {
  const { showToast } = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [jobFilter, setJobFilter] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [recommendations, setRecommendations] = useState<Candidate[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 5;

  useEffect(() => {
    fetchCandidates();
    fetchJobs();
    const subscription = supabase
      .channel('candidates_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates' }, (payload) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          setCandidates((prev) => [payload.new as Candidate, ...prev]);
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          setCandidates((prev) => prev.map((c) => (c.id === payload.new.id ? { ...c, ...payload.new } as Candidate : c)));
        } else if (payload.eventType === 'DELETE' && payload.old) {
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
    } catch (error: Error | unknown) {
      console.error('Error updating status:', error);
      const err = error as { status?: number; message?: string };
      const isUnauthorized = err.status === 401 || 
                             err.message?.includes('Unauthorized');
      if (isUnauthorized) {
        await supabase.auth.signOut();
        window.location.href = '/auth';
      }
    }
  };

  const handleDeleteCandidate = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this candidate?')) return;
    
    try {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (error: Error | unknown) {
      console.error('Error deleting candidate:', error);
    }
  };

  const handleDownloadResume = async (path: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('resumes')
        .createSignedUrl(path, 60);
      
      if (error) throw error;
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error: Error | unknown) {
      console.error('Error getting signed URL:', error);
      showToast('Could not retrieve CV. Please try again.', 'error');
    }
  };

  const fetchCandidates = async (isLoadMore = false) => {
    try {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      let query = supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (isLoadMore && candidates.length > 0) {
        const lastCandidate = candidates[candidates.length - 1];
        query = query.lt('created_at', lastCandidate.created_at);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (data) {
        if (isLoadMore) {
          setCandidates(prev => [...prev, ...data]);
        } else {
          setCandidates(data);
        }
        setHasMore(data.length === PAGE_SIZE);
      }
    } catch (error: Error | unknown) {
      console.error('Error fetching candidates:', error);
      const err = error as { status?: number; message?: string };
      const isUnauthorized = err.status === 401 || 
                             err.message?.includes('Unauthorized');
                             
      if (isUnauthorized) {
        await supabase.auth.signOut();
        window.location.href = '/auth';
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchJobs = async () => {
    const { data } = await supabase.from('jobs').select('*');
    if (data) setJobs(data);
  };

  const getRecommendations = async () => {
    if (!jobFilter) return;
    setLoadingRecs(true);
    try {
      // Note: supabase.functions.invoke doesn't support query params directly in the first arg easily
      // Better to use a standard fetch if needed, or invoke doesn't mind extra params
      const { data: recData, error: recError } = await supabase.functions.invoke(`recommend?job_id=${jobFilter}`);
      if (recError) throw recError;
      setRecommendations(recData || []);
      showToast('AI Recommendations loaded!', 'success');
    } catch (error) {
      console.error('Error getting recommendations:', error);
      showToast('Failed to get recommendations', 'error');
    } finally {
      setLoadingRecs(false);
    }
  };

  const filteredCandidates = useMemo(() => {
    let result = candidates.filter(c => {
      const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
      const matchesJob = !jobFilter || c.job_id === jobFilter;
      return matchesStatus && matchesJob;
    });

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      // Implementation of "Matching Score" algorithm for Smart Sort
      result = (result as (Candidate & { score: number })[]).map(c => {
        let score = 0;
        const nameChars = (c.full_name || '').toLowerCase();
        const posChars = (c.applied_position || '').toLowerCase();

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
      .filter(c => c.score > 0)
      .sort((a, b) => b.score - a.score);
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

        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative min-w-[200px]">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <select 
              className="w-full pl-12 pr-10 py-2.5 bg-white/5 border border-white/5 rounded-xl text-sm focus:outline-none focus:bg-white/10 appearance-none text-white"
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value)}
            >
              <option value="">All Positions</option>
              {jobs.map(job => (
                <option key={job.id} value={job.id} className="bg-gray-900">{job.title}</option>
              ))}
            </select>
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

          {jobFilter && (
            <button
              onClick={getRecommendations}
              disabled={loadingRecs}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-accent to-primary rounded-xl text-white text-xs font-bold hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${loadingRecs ? 'animate-pulse' : ''}`} />
              {loadingRecs ? 'Analyzing...' : '⚡ AI Recommend Top 3'}
            </button>
          )}
        </div>
      </div>

      {recommendations.length > 0 && jobFilter && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 border border-primary/20 bg-primary/5 rounded-[32px] space-y-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold flex items-center gap-2 text-primary">
              <Sparkles className="w-4 h-4" />
              Top 3 AI Recommendations
            </h4>
            <button 
              onClick={() => setRecommendations([])}
              className="text-[10px] font-bold text-text-secondary hover:text-white uppercase tracking-widest"
            >
              Dismiss
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.map((c) => (
              <div key={c.id} className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {c.match_score}%
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{c.full_name}</p>
                  <p className="text-[10px] text-text-secondary">{c.applied_position}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="glass-card rounded-[32px] border border-white/5">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead className="bg-white/5 border-b border-white/5">
            <tr className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
              <th className="px-8 py-5 rounded-tl-[31px]">Candidate Name</th>
              <th className="px-6 py-5">Role Applied</th>
              <th className="px-6 py-5">Match Score</th>
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
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          (c.match_score || 0) > 70 ? 'bg-green-400' : (c.match_score || 0) > 40 ? 'bg-yellow-400' : 'bg-red-400'
                        }`}
                        style={{ width: `${c.match_score || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] font-bold text-white/50">{c.match_score || 0}%</span>
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
                    {c.resume_path && (
                      <button 
                        onClick={() => handleDownloadResume(c.resume_path!)}
                        className="p-2 hover:bg-white/10 rounded-lg text-text-secondary hover:text-white transition-all"
                        title="View CV"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteCandidate(c.id)}
                      className="p-2 hover:bg-red-500/10 rounded-lg text-text-secondary hover:text-red-400 transition-all"
                      title="Delete Candidate"
                    >
                      <Trash2 className="w-4 h-4" />
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

      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={() => fetchCandidates(true)}
            disabled={loadingMore}
            className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all text-text-secondary hover:text-white disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : 'Load More Candidates'}
          </button>
        </div>
      )}
    </div>
  );
};
