import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Search, MoreHorizontal, Download, Trash2, Briefcase, Sparkles, Filter, Tag } from 'lucide-react';
import type { Candidate, Job } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Dropdown } from './common/Dropdown';
import { useToast } from '../context/useToast';

interface CandidateWithJob extends Candidate {
  jobs: { title: string } | null;
}

export const CandidateList: React.FC = () => {
  const { showToast } = useToast();
  const [candidates, setCandidates] = useState<CandidateWithJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [jobFilter, setJobFilter] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [recommendations, setRecommendations] = useState<Candidate[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 8;

  useEffect(() => {
    fetchCandidates();
    fetchJobs();

    const subscription = supabase
      .channel('candidates_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates' }, () => {
        fetchCandidates(); // Refresh to get joined data easily
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('candidates').update({ status: newStatus }).eq('id', id);
    if (error) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleDeleteCandidate = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    const { error } = await supabase.from('candidates').delete().eq('id', id);
    if (error) showToast('Failed to delete', 'error');
  };

  const handleDownloadResume = async (path: string) => {
    const { data, error } = await supabase.storage.from('resumes').createSignedUrl(path, 60);
    if (error) showToast('Could not retrieve CV', 'error');
    else if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  const fetchCandidates = async (isLoadMore = false) => {
    try {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      let query = supabase
        .from('candidates')
        .select('*, jobs(title)')
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (isLoadMore && candidates.length > 0) {
        query = query.lt('created_at', candidates[candidates.length - 1].created_at);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (data) {
        setCandidates(prev => isLoadMore ? [...prev, ...data] : data);
        setHasMore(data.length === PAGE_SIZE);
      }
    } catch (e) {
      showToast('Error loading candidates', 'error');
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
      const { data: recData, error: recError } = await supabase.functions.invoke(`recommend?job_id=${jobFilter}`);
      if (recError) throw recError;
      setRecommendations(recData || []);
      showToast('AI Recommendations loaded!', 'success');
    } catch (error) {
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
      result = (result as (CandidateWithJob & { score: number })[]).map(c => {
        let score = 0;
        const name = (c.full_name || '').toLowerCase();
        const jobTitle = (c.jobs?.title || '').toLowerCase();
        if (name.includes(term)) score += 100;
        if (jobTitle.includes(term)) score += 50;
        return { ...c, score };
      })
        .filter(c => c.score > 0)
        .sort((a, b) => b.score - a.score);
    }
    return result;
  }, [candidates, searchTerm, statusFilter, jobFilter]);

  if (loading) return (
    <div className="grid grid-cols-1 gap-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="glass-card h-24 rounded-[32px] animate-pulse"></div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {['All', 'New', 'Interviewing', 'Hired'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === status
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-white/5 text-text-secondary hover:bg-white/10'
                }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative group">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary group-focus-within:text-primary transition-colors" />
            <select
              className="pl-12 pr-10 py-2.5 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:bg-white/10 appearance-none text-white min-w-[180px]"
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value)}
            >
              <option value="" className="bg-gray-900">All Jobs</option>
              {jobs.map(job => (
                <option key={job.id} value={job.id} className="bg-gray-900">{job.title}</option>
              ))}
            </select>
          </div>

          <div className="relative group min-w-[240px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search application..."
              className="w-full pl-12 pr-4 py-2.5 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:bg-white/10 transition-all text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {jobFilter && (
            <button
              onClick={getRecommendations}
              disabled={loadingRecs}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-accent to-primary rounded-2xl text-white text-[10px] font-black uppercase tracking-widest hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-95 disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${loadingRecs ? 'animate-pulse' : ''}`} />
              {loadingRecs ? 'Analyzing...' : '⚡ AI Suggest'}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {recommendations.length > 0 && jobFilter && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card p-6 border border-primary/20 bg-primary/5 rounded-[32px] relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[10px] font-black flex items-center gap-2 text-primary uppercase tracking-[0.2em]">
                <Sparkles className="w-3.5 h-3.5" /> Top AI Matching
              </h4>
              <button onClick={() => setRecommendations([])} className="text-[10px] font-bold text-text-secondary hover:text-white uppercase tracking-widest">Close</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendations.map((c) => (
                <motion.div key={c.id} whileHover={{ y: -4 }} className="bg-[#0f172a]/50 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs border border-primary/20">{c.match_score}%</div>
                  <div>
                    <p className="text-xs font-black text-white">{c.full_name}</p>
                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-1">Recommended</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-card rounded-[32px] border border-white/5">
        <div className="overflow-x-auto pb-40 -mb-40">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-white/[0.02]">
                <th className="px-8 py-5 text-[10px] font-black text-text-secondary uppercase tracking-widest">Candidate</th>
                <th className="px-6 py-5 text-[10px] font-black text-text-secondary uppercase tracking-widest">Target Job</th>
                <th className="px-6 py-5 text-[10px] font-black text-text-secondary uppercase tracking-widest text-center">Fit Score</th>
                <th className="px-6 py-5 text-[10px] font-black text-text-secondary uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-text-secondary uppercase tracking-widest text-right">Resume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCandidates.map((c, i) => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="group hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 overflow-hidden shadow-xl ring-1 ring-white/5">
                        <img src={`https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?t=st=1774530050~exp=1774533650~hmac=eee896db36590b7b9fb65f2e88c04b90e718b346a3affbf99e2011ec9bc1d8ed&w=2000`} alt="avatar" className="w-full h-full object-cover" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-black text-white group-hover:text-primary transition-colors">{c.full_name}</p>
                        <div className="flex flex-wrap gap-1">
                          {c.skills.slice(0, 3).map(s => (
                            <span key={s} className="px-1.5 py-0.5 bg-white/5 rounded-md text-[8px] font-bold text-text-secondary flex items-center gap-1">
                              <Tag className="w-2 h-2" /> {s}
                            </span>
                          ))}
                          {c.skills.length > 3 && <span className="text-[8px] font-bold text-text-secondary opacity-50">+{c.skills.length - 3} more</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-primary opacity-50" />
                      <span className="text-[11px] font-black text-white uppercase tracking-wider">{c.jobs?.title || 'General Role'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden ring-1 ring-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${c.match_score || 0}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className={`h-full rounded-full ${(c.match_score || 0) > 70 ? 'bg-primary' : (c.match_score || 0) > 40 ? 'bg-accent' : 'bg-red-500'
                            }`}
                        ></motion.div>
                      </div>
                      <span className="text-[10px] font-black text-white/40">{c.match_score || 0}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <Dropdown
                      value={c.status}
                      onChange={(val) => updateStatus(c.id, val)}
                      options={[
                        { id: 'New', label: 'New', colorClass: 'text-blue-400' },
                        { id: 'Interviewing', label: 'Interviewing', colorClass: 'text-accent' },
                        { id: 'Hired', label: 'Hired', colorClass: 'text-primary' },
                        { id: 'Rejected', label: 'Rejected', colorClass: 'text-red-400' },
                      ]}
                      className="!min-w-[120px]"
                    />
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                      {/* {c.resume_url && (
                        <button 
                          onClick={() => handleDownloadResume(c.resume_url!)}
                          className="p-2.5 bg-white/5 hover:bg-primary/20 rounded-xl text-text-secondary hover:text-primary transition-all border border-white/5 hover:border-primary/30"
                        ><Download className="w-4 h-4" /></button>
                      )} */}
                      <button
                        onClick={() => handleDeleteCandidate(c.id)}
                        className="p-2.5 bg-white/5 hover:bg-red-500/20 rounded-xl text-text-secondary hover:text-red-400 transition-all border border-white/5 hover:border-red-500/30"
                      ><Trash2 className="w-4 h-4" /></button>
                      <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-text-secondary hover:text-white transition-all border border-white/5"><MoreHorizontal className="w-4 h-4" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCandidates.length === 0 && (
          <div className="py-24 text-center">
            <div className="inline-flex p-6 bg-white/5 rounded-full mb-4"><Search className="w-8 h-8 text-text-secondary opacity-20" /></div>
            <p className="text-text-secondary font-black uppercase tracking-[0.3em] text-[10px] opacity-20">Database is empty or no matches</p>
          </div>
        )}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => fetchCandidates(true)}
            disabled={loadingMore}
            className="flex items-center gap-3 px-10 py-4 bg-white/5 hover:bg-white/[0.08] border border-white/5 rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] transition-all text-text-secondary hover:text-white active:scale-95 disabled:opacity-50"
          >
            {loadingMore ? 'Syncing...' : 'Load More Intel'}
          </button>
        </div>
      )}
    </div>
  );
};
