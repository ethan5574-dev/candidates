import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, User, Settings, LifeBuoy, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';

interface UserMenuProps {
  email: string;
}

export const UserMenu: React.FC<UserMenuProps> = ({ email }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex w-full items-center justify-center gap-x-1.5 rounded-xl bg-white/5 px-3 py-2 text-sm font-semibold text-white border border-white/5 hover:bg-white/10 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary p-[1px]">
            <div className="w-full h-full rounded-lg bg-[#0d0f19] flex items-center justify-center overflow-hidden">
               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`} alt="avatar" />
            </div>
          </div>
          <div className="text-left hidden md:block">
            <p className="text-xs font-bold text-white leading-none">{email.split('@')[0]}</p>
            <p className="text-[9px] text-text-secondary font-bold uppercase mt-1">HR Admin</p>
          </div>
        </div>
        <ChevronDown className={`ml-2 h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.1 }}
            className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-2xl bg-[#0f172a] border border-white/10 shadow-2xl focus:outline-none overflow-hidden p-1.5"
          >
            <div className="px-3 py-2 border-b border-white/5 mb-1">
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Signed in as</p>
              <p className="text-xs font-bold text-white truncate mt-0.5">{email}</p>
            </div>
            
            <div className="space-y-1">
              <button className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-gray-300 rounded-xl hover:bg-white/5 hover:text-white transition-all">
                <User className="w-4 h-4 text-primary" />
                Profile Settings
              </button>
              <button className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-gray-300 rounded-xl hover:bg-white/5 hover:text-white transition-all">
                <Settings className="w-4 h-4 text-purple-400" />
                Account Settings
              </button>
              <button className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-gray-300 rounded-xl hover:bg-white/5 hover:text-white transition-all">
                <LifeBuoy className="w-4 h-4 text-blue-400" />
                Support
              </button>
            </div>

            <div className="mt-1 pt-1 border-t border-white/5">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-red-400 rounded-xl hover:bg-red-500/10 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
