import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { useToast } from '../context/useToast';

export const CandidateForm: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      showToast('Vui lòng chọn file CV.', 'error');
      return;
    }

    setLoading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `resumes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data, error: functionError } = await supabase.functions.invoke('add-candidate', {
        body: {
          full_name: fullName,
          applied_position: position,
          resume_path: filePath,
        },
      });

      if (functionError) throw functionError;

      setFullName('');
      setPosition('');
      setFile(null);
      showToast(`Đã thêm ứng viên ${data.full_name} thành công!`, 'success');

    } catch (error: Error | unknown) {
      console.error('Error submitting candidate:', error);
      const err = error as { status?: number; message: string };
      const isUnauthorized = err.status === 401 || 
                             err.message?.includes('Unauthorized');

      if (isUnauthorized) {
        await supabase.auth.signOut();
        window.location.href = '/auth';
      } else {
        showToast(`Lỗi: ${err.message}`, 'error');
      }
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 px-1">Upload Resume (PDF/Image)</label>
          <div className="relative group cursor-pointer">
            <input
              type="file"
              required
              accept=".pdf,image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
            />
            <div className={`w-full px-5 py-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all group-hover:bg-white/5 ${file ? 'border-primary/50 bg-primary/5' : 'border-white/10'}`}>
              <svg className={`w-8 h-8 ${file ? 'text-primary' : 'text-text-secondary'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <p className={`text-xs font-bold ${file ? 'text-white' : 'text-text-secondary'}`}>
                {file ? file.name : 'Drop files here or click to upload'}
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
