import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { useToast } from '../context/useToast';
import { Dropdown } from './common/Dropdown';

import type { Job, Skill } from '../types';

export const CandidateForm: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [globalSkills, setGlobalSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');

  useEffect(() => {
    fetchJobs();
    fetchSkills();
  }, []);

  const fetchJobs = async () => {
    const { data } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
    if (data) setJobs(data);
  };

  const fetchSkills = async () => {
    const { data } = await supabase.from('skills').select('*').order('skill_name', { ascending: true });
    if (data) setGlobalSkills(data);
  };

  const toggleSkill = (skillName: string) => {
    if (selectedSkills.includes(skillName)) {
      setSelectedSkills(prev => prev.filter(s => s !== skillName));
    } else {
      setSelectedSkills(prev => [...prev, skillName]);
    }
  };

  const uploadFile = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `resumes/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(filePath, file);

    if (uploadError) throw uploadError;
    return filePath;
  };

  const processParallelUploads = async (filesToUpload: File[], limit: number) => {
    const results: any[] = [];
    const executing = new Set<Promise<any>>();

    for (const file of filesToUpload) {
      const p = (async () => {
        try {
          const path = await uploadFile(file);
          const { data, error } = await supabase.functions.invoke('add-candidate', {
            body: {
              full_name: filesToUpload.length > 1 ? `${fullName} (${file.name})` : fullName,
              job_id: selectedJobId,
              resume_url: path,
              skills: selectedSkills,
            },
          });
          if (error) throw error;
          return data;
        } catch (err) {
          console.error(`Failed to upload ${file.name}:`, err);
          throw err;
        }
      })();
      
      results.push(p);
      executing.add(p);
      p.finally(() => executing.delete(p));
      
      if (executing.size >= limit) {
        await Promise.race(executing);
      }
    }
    return Promise.all(results);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 file CV.', 'error');
      return;
    }

    setLoading(true);
    try {
      // Parallel upload with concurrency limit (e.g. 3)
      await processParallelUploads(files, 3);
      
      setFullName('');
      setFiles([]);
      setSelectedSkills([]);
      setSelectedJobId('');
      showToast(`Đã thêm ${files.length} ứng viên thành công!`, 'success');
      if (onComplete) onComplete();

    } catch (error: Error | unknown) {
      console.error('Error submitting candidate(s):', error);
      const err = error as { status?: number; message: string };
      showToast(`Lỗi: ${err.message || 'Thất bại khi tải lên'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-card p-8 rounded-[32px] border border-white/5 space-y-6"
    >
      <div className="space-y-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 px-1">Full Name</label>
          <input
            type="text"
            required
            className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. David Chen"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 px-1">Target Job / Position</label>
          <Dropdown
            value={selectedJobId}
            onChange={setSelectedJobId}
            options={[
              { id: '', label: 'Select an open role' },
              ...jobs.map(job => ({ id: job.id, label: job.title }))
            ]}
            className="w-full"
          />
        </motion.div>

        {/* Skills selection */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
          <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 px-1">Candidate Skills</label>
          <div className="flex flex-wrap gap-2 bg-white/5 p-4 rounded-2xl border border-white/5 max-h-[120px] overflow-y-auto custom-scrollbar">
            {globalSkills.map(s => {
              const isSelected = selectedSkills.includes(s.skill_name);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSkill(s.skill_name)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${
                    isSelected 
                      ? 'bg-primary border-primary text-white' 
                      : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/30'
                  }`}
                >
                  {s.skill_name}
                </button>
              );
            })}
            {globalSkills.length === 0 && (
              <p className="text-[10px] text-text-secondary opacity-30 italic">No skills available. Please add them in Skills tab.</p>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 px-1">Upload Resume(s) (Max Parallel: 3)</label>
          <div className="relative group cursor-pointer">
            <input
              type="file"
              required
              multiple
              accept=".pdf,image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={(e) => setFiles(e.target.files ? Array.from(e.target.files) : [])}
            />
            <div className={`w-full px-5 py-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all group-hover:bg-white/5 ${files.length > 0 ? 'border-primary/50 bg-primary/5' : 'border-white/10'}`}>
              <svg className={`w-8 h-8 ${files.length > 0 ? 'text-primary' : 'text-text-secondary'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <p className={`text-xs font-bold ${files.length > 0 ? 'text-white' : 'text-text-secondary'}`}>
                {files.length > 0 ? `${files.length} files selected` : 'Drop files here or click to upload'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={handleSubmit}
        disabled={loading}
        className="btn-primary w-full py-4 rounded-2xl text-white font-bold text-sm shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : 'Submit Profile'}
      </motion.button>
    </motion.div>
  );
};
