import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Briefcase, ChevronRight, X, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Job, Skill, JobSkill } from '../types';
import { useToast } from '../context/useToast';

export const JobManagement: React.FC = () => {
  const { showToast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [globalSkills, setGlobalSkills] = useState<Skill[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<JobSkill[]>([]);

  useEffect(() => {
    fetchJobs();
    fetchGlobalSkills();
  }, []);

  const fetchJobs = async () => {
    const { data } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
    if (data) setJobs(data);
  };

  const fetchGlobalSkills = async () => {
    const { data } = await supabase.from('skills').select('*').order('skill_name', { ascending: true });
    if (data) setGlobalSkills(data);
  };

  const toggleSkill = (skillName: string) => {
    if (selectedSkills.find(s => s.skill_name === skillName)) {
      setSelectedSkills(prev => prev.filter(s => s.skill_name !== skillName));
    } else {
      setSelectedSkills(prev => [...prev, { skill_name: skillName, weight: 5 }]);
    }
  };

  const updateWeight = (skillName: string, weight: number) => {
    setSelectedSkills(prev => prev.map(s => s.skill_name === skillName ? { ...s, weight } : s));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data, error } = await supabase
      .from('jobs')
      .insert([{
        user_id: session.user.id,
        title,
        description,
        skills: selectedSkills
      }])
      .select()
      .single();

    if (error) {
      showToast('Failed to create job', 'error');
    } else {
      setJobs(prev => [data, ...prev]);
      setIsCreating(false);
      setTitle('');
      setDescription('');
      setSelectedSkills([]);
      showToast('Job created successfully', 'success');
    }
  };

  const deleteJob = async (id: string) => {
    const { error } = await supabase.from('jobs').delete().eq('id', id);
    if (error) {
      showToast('Failed to delete job', 'error');
    } else {
      setJobs(prev => prev.filter(j => j.id !== id));
      showToast('Job deleted', 'success');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Recruitment Jobs</h2>
          <p className="text-text-secondary text-sm font-medium mt-1">Define roles and skill requirements</p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/80 text-white rounded-2xl text-xs font-bold transition-all active:scale-95 shadow-lg shadow-primary/20"
        >
          {isCreating ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isCreating ? 'Cancel' : 'Create New Job'}
        </button>
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="glass-card p-8 rounded-[32px] border border-primary/20 bg-primary/5 space-y-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2 px-1">Job Title</label>
                    <input
                      required
                      type="text"
                      className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Senior Frontend Engineer"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2 px-1">Description</label>
                    <textarea
                      rows={4}
                      className="w-full px-5 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm resize-none"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Role responsibilities..."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest px-1">Configure Requirements & Weights</label>
                  <div className="flex flex-wrap gap-2 mb-4 bg-white/5 p-4 rounded-2xl border border-white/5 max-h-[120px] overflow-y-auto custom-scrollbar">
                    {globalSkills.map(s => {
                      const isSelected = selectedSkills.find(ss => ss.skill_name === s.skill_name);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleSkill(s.skill_name)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${
                            isSelected 
                              ? 'bg-primary border-primary text-white shadow-md shadow-primary/20' 
                              : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/30'
                          }`}
                        >
                          {s.skill_name}
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                    {selectedSkills.map(s => (
                      <div key={s.skill_name} className="flex flex-col gap-2 p-3 bg-white/5 rounded-2xl border border-white/5 group">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-white uppercase tracking-wider">{s.skill_name}</span>
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Weight: {s.weight}</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={s.weight}
                          onChange={(e) => updateWeight(s.skill_name, parseInt(e.target.value))}
                          className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>
                    ))}
                    {selectedSkills.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full py-8 text-center text-text-secondary opacity-30">
                        <Star className="w-8 h-8 mb-2" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Select skills to assign weights</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-white/5">
                <button
                  type="submit"
                  className="px-10 py-4 bg-primary hover:bg-primary/80 text-white rounded-2xl text-xs font-bold transition-all active:scale-95 shadow-lg shadow-primary/20"
                >
                  Publish Role
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map((job) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 rounded-[32px] border border-white/5 hover:border-primary/20 transition-all group relative overflow-hidden"
          >
            <div className="relative z-10 space-y-4">
              <div className="flex items-start justify-between">
                <div className="p-3 bg-primary/10 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all">
                  <Briefcase className="w-5 h-5 text-primary group-hover:text-white" />
                </div>
                <button 
                  onClick={() => deleteJob(job.id)}
                  className="p-2 text-text-secondary hover:text-red-400 transition-colors bg-white/5 rounded-xl opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div>
                <h3 className="text-lg font-black text-white group-hover:text-primary transition-colors tracking-tight">{job.title}</h3>
                <p className="text-xs text-text-secondary line-clamp-2 mt-2 font-medium">{job.description}</p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {job.skills.map(s => (
                  <div key={s.skill_name} className="px-2 py-1 bg-white/5 rounded-lg text-[10px] font-bold text-text-secondary border border-white/5">
                    {s.skill_name} <span className="text-primary ml-1">{s.weight}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest opacity-50">
                  {new Date(job.created_at).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-all">
                  View Candidates
                  <ChevronRight className="w-3 h-3 translate-y-[0.5px]" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
