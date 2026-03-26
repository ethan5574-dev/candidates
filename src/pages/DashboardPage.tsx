import { CandidateList } from '../components/CandidateList'
import { CandidateForm } from '../components/CandidateForm'
import { Analytics } from '../components/Analytics'
import type { Session } from '@supabase/supabase-js'
import { Users, Settings, Bell, Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { UserMenu } from '../components/common/UserMenu'

interface DashboardPageProps {
  session: Session;
}

export function DashboardPage({ session }: DashboardPageProps) {
  const [activeTab, setActiveTab] = useState('candidates');

  const navItems = [
    { id: 'candidates', label: 'Candidate Management', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#080911] text-white flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 glass border-r border-white/5 flex flex-col pt-8 relative z-20">
        <div className="px-8 mb-12 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight">TALENTPULSE <span className="text-[10px] text-primary align-top">HR</span></span>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-semibold transition-all group ${activeTab === item.id
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-text-secondary hover:text-white hover:bg-white/5'
                }`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-primary' : 'group-hover:text-white'}`} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-white/5 mt-auto">
          <div className="bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl p-6 border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-12 translate-x-12 blur-2xl group-hover:bg-primary/20 transition-all duration-500"></div>
            <p className="text-sm font-bold text-white relative z-10">Premium Plan</p>
            <p className="text-[10px] text-text-secondary mt-1 relative z-10">Unlock advanced AI sorting & analytics</p>
            <button className="mt-4 w-full py-2.5 bg-white text-black rounded-xl text-xs font-bold hover:bg-primary hover:text-white transition-all relative z-10">Upgrade Now</button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative h-screen">
        {/* Background Decorative Blobs */}
        <div className="fixed top-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary opacity-5 blur-[150px] rounded-full -z-10 pointer-events-none"></div>
        <div className="fixed bottom-[-20%] left-[20%] w-[60%] h-[60%] bg-secondary opacity-5 blur-[150px] rounded-full -z-10 pointer-events-none"></div>

        {/* Top Header */}
        <header className="sticky top-0 z-10 glass-card px-8 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex-1 max-w-xl relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search Candidates, Analytics..."
              className="w-full pl-12 pr-4 py-2.5 bg-white/5 border border-white/5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 focus:bg-white/10 transition-all"
            />
          </div>

          <div className="flex items-center gap-6">
            <button className="relative p-2 rounded-xl border border-white/5 hover:bg-white/5 transition-all text-white/70 hover:text-white">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0d0f19]"></span>
            </button>

            <div className="pl-4 border-l border-white/10">
              <UserMenu email={session.user.email || 'HR Admin'} />
            </div>
          </div>
        </header>

        <div className="p-8 space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Welcome, HR Professional! 👋</h2>
              <p className="text-text-secondary mt-1 font-medium italic">Manage your talent pipeline with ease.</p>
            </div>
          </motion.div>

          {/* Render Active Tab */}
          <div className="space-y-10">
            {activeTab === 'candidates' ? (
              <>
                <Analytics />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-1 space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-3">
                      <span className="w-1 h-6 bg-secondary rounded-full"></span>
                      Quick Add
                    </h3>
                    <CandidateForm />
                  </div>
                  <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-3">
                      <span className="w-1 h-6 bg-accent rounded-full"></span>
                      Candidate List
                    </h3>
                    <CandidateList />
                  </div>
                </div>
              </>
            ) : (
              <div className="glass-card p-20 rounded-[32px] text-center">
                <p className="text-text-secondary font-bold text-xl uppercase tracking-widest opacity-20">{activeTab} Section coming soon</p>
              </div>
            )}
          </div>
        </div>

        <footer className="px-8 py-10 border-t border-white/5 text-center text-text-secondary text-xs uppercase font-bold tracking-widest">
          TalentPulse HR Portal &copy; 2026
        </footer>
      </main>
    </div>
  )
}

export default DashboardPage
