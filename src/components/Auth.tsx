import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { useToast } from '../context/useToast';

export const Auth: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);


  useEffect(() => {

    const testConnection = async () => {
      const { data, error } = await supabase.auth.getSession()
      console.log('session:', data)
      console.log('error:', error)
    }
    testConnection()
  }, [])
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        showToast('Đăng ký thành công! Vui lòng kiểm tra email.', 'success');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: Error | unknown) {
      const err = error as { message: string };
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-transparent overflow-hidden">
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary opacity-20 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary opacity-20 blur-[120px] rounded-full animate-pulse"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass max-w-md w-full space-y-8 p-10 rounded-[32px] relative z-10 border border-white/10"
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 mb-6 rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/20">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight text-white mb-2">
            {isSignUp ? 'Join TalentPulse.' : 'Welcome back.'}
          </h2>
          <p className="text-text-secondary text-sm font-medium">
            {isSignUp ? 'Start managing your candidates with ease.' : 'Access your HR recruitment dashboard.'}
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleAuth}>
          <div className="space-y-4">
            <div className="relative group">
              <input
                type="email"
                required
                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative group">
              <input
                type="password"
                required
                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>


          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm font-semibold text-text-secondary hover:text-white transition-colors underline-offset-4 hover:underline"
          >
            {isSignUp ? 'Already have an account? Sign In' : 'New to HR Portal? Create one'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
