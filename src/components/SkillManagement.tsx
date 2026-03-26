import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Search, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Skill } from '../types';
import { useToast } from '../context/useToast';

export const SkillManagement: React.FC = () => {
  const { showToast } = useToast();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .order('skill_name', { ascending: true });
    
    if (error) {
      showToast('Failed to fetch skills', 'error');
    } else {
      setSkills(data || []);
    }
    setLoading(false);
  };

  const addSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim()) return;

    const { data, error } = await supabase
      .from('skills')
      .insert([{ skill_name: newSkill.trim() }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        showToast('Skill already exists', 'error');
      } else {
        showToast('Failed to add skill', 'error');
      }
    } else {
      setSkills(prev => [...prev, data].sort((a,b) => a.skill_name.localeCompare(b.skill_name)));
      setNewSkill('');
      showToast('Skill added successfully', 'success');
    }
  };

  const deleteSkill = async (id: string) => {
    const { error } = await supabase.from('skills').delete().eq('id', id);
    if (error) {
      showToast('Failed to delete skill', 'error');
    } else {
      setSkills(prev => prev.filter(s => s.id !== id));
      showToast('Skill deleted', 'success');
    }
  };

  const filteredSkills = skills.filter(s => 
    s.skill_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Skill Directory</h2>
          <p className="text-text-secondary text-sm font-medium mt-1">Manage global skills for job matching</p>
        </div>

        <form onSubmit={addSkill} className="flex gap-2">
          <input
            type="text"
            placeholder="New Skill Name..."
            className="px-5 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm min-w-[200px]"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
          />
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/80 text-white rounded-2xl text-xs font-bold transition-all active:scale-95 shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            Add Skill
          </button>
        </form>
      </div>

      <div className="glass-card p-8 rounded-[32px] border border-white/5 space-y-6">
        <div className="relative group max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search skills..."
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:bg-white/10 transition-all text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredSkills.map((skill) => (
              <motion.div
                key={skill.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-primary/30 transition-all hover:bg-white/[0.08]"
              >
                <div className="flex items-center gap-3">
                  <Tag className="w-3.5 h-3.5 text-primary opacity-50" />
                  <span className="text-xs font-bold text-white tracking-wide truncate max-w-[100px]">
                    {skill.skill_name}
                  </span>
                </div>
                <button
                  onClick={() => deleteSkill(skill.id)}
                  className="p-1.5 text-text-secondary hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {!loading && filteredSkills.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <p className="text-text-secondary font-bold text-xs uppercase tracking-widest opacity-20">No skills found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
