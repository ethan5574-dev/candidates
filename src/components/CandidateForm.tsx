import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { useToast } from '../context/useToast';

import type { Job } from '../types';

export const CandidateForm: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [skills, setSkills] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');

  React.useEffect(() => {
    const fetchJobs = async () => {
      const { data } = await supabase.from('jobs').select('*');
      if (data) setJobs(data);
    };
    fetchJobs();
  }, []);

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
              applied_position: position,
              resume_path: path,
              skills: skills.split(',').map(s => s.trim()).filter(Boolean),
              job_id: selectedJobId || null
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
      setPosition('');
      setFiles([]);
      setSkills('');
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 px-1">Applied Position</label>
          <input
            type="text"
            required
            className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="e.g. Senior Frontend Engineer"
          />
        </motion.div>
        {/* Job Selection */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 px-1">Linked Job (Optional)</label>
          <select
            className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm appearance-none"
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
          >
            <option value="" className="bg-gray-900">General Recruitment</option>
            {jobs.map(job => (
              <option key={job.id} value={job.id} className="bg-gray-900">{job.title}</option>
            ))}
          </select>
        </motion.div>

        {/* Skills input */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
          <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 px-1">Candidate Skills (Comma separated)</label>
          <input
            type="text"
            className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="e.g. React, Node.js, TypeScript"
          />
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
