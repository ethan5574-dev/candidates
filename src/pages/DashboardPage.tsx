import { CandidateList } from '../components/CandidateList'
import { CandidateForm } from '../components/CandidateForm'
import { Analytics } from '../components/Analytics'
import { SkillManagement } from '../components/SkillManagement'
import { JobManagement } from '../components/JobManagement'
import type { Session } from '@supabase/supabase-js'
import { Users, Settings, PieChart, Tag, Briefcase } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserMenu } from '../components/common/UserMenu'

interface DashboardPageProps {
  session: Session;
}

export function DashboardPage({ session }: DashboardPageProps) {
  const [activeTab, setActiveTab] = useState<'candidates' | 'jobs' | 'skills' | 'analytics' | 'settings'>('candidates');

  const navItems = [
    { id: 'candidates', label: 'Candidate Management', icon: Users },
    { id: 'jobs', label: 'Job Listings', icon: Briefcase },
    { id: 'skills', label: 'Skill Management', icon: Tag },
    { id: 'analytics', label: 'Real-time Analytics', icon: PieChart },
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
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-semibold transition-all group overflow-hidden ${activeTab === item.id
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'text-text-secondary hover:text-white hover:bg-white/5'
                }`}
              title={item.label}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${activeTab === item.id ? 'text-primary' : 'group-hover:text-white'}`} />
              <span className="truncate whitespace-nowrap">{item.label}</span>
            </button>
          ))}
        </nav>

      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative h-screen">
        {/* Background Decorative Blobs */}
        <div className="fixed top-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary opacity-5 blur-[150px] rounded-full -z-10 pointer-events-none"></div>
        <div className="fixed bottom-[-20%] left-[20%] w-[60%] h-[60%] bg-secondary opacity-5 blur-[150px] rounded-full -z-10 pointer-events-none"></div>

        {/* Top Header */}
        <header className="sticky top-0 z-10 glass-card px-8 py-4 border-b border-white/5 flex items-center justify-end">
          <div className="flex items-center gap-6">
            <div className="pl-4">
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
              <h2 className="text-3xl font-bold tracking-tight">Welcome, HR Professional! </h2>
              <p className="text-text-secondary mt-1 font-medium italic">Manage your talent pipeline with ease.</p>
            </div>
          </motion.div>

          <div className="space-y-10">
            {activeTab === 'candidates' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-4 sticky top-8">
                  <div className="glass-card p-8 rounded-[32px] border border-white/5">
                    <h3 className="text-xl font-black text-white mb-6 tracking-tight">Add New Intel</h3>
                    <CandidateForm onComplete={() => { }} />
                  </div>
                </div>
                <div className="lg:col-span-8">
                  <CandidateList />
                </div>
              </div>
            )}

            {activeTab === 'jobs' && <JobManagement />}
            {activeTab === 'skills' && <SkillManagement />}
            {activeTab === 'analytics' && <Analytics />}

            {(activeTab === 'settings') && (
              <div className="glass-card p-20 rounded-[32px] text-center space-y-6">
                <p className="text-text-secondary font-bold text-xl uppercase tracking-widest opacity-20">{activeTab} Section coming soon</p>
                {activeTab === 'settings' && (
                  <div className="pt-10 border-t border-white/5">
                    <h4 className="text-sm font-bold text-white mb-4">Developer Tools</h4>
                    <button
                      onClick={async () => {
                        const { data: job, error: jobError } = await supabase
                          .from('jobs')
                          .insert({
                            user_id: session.user.id,
                            title: 'Senior React Developer',
                            description: 'Requires expertise in React, TypeScript, and Tailwind.'
                          })
                          .select()
                          .single();

                        if (jobError) return alert('Failed to seed job');

                        const requirements = ['React', 'TypeScript', 'Tailwind', 'Node.js'];
                        await supabase
                          .from('job_requirements')
                          .insert(requirements.map(skill => ({
                            job_id: job.id,
                            skill
                          })));

                        alert('Seeded "Senior React Developer" job successfully!');
                        window.location.reload();
                      }}
                      className="px-6 py-3 bg-white/5 hover:bg-primary/20 hover:text-primary rounded-xl text-xs font-bold transition-all border border-white/10"
                    >
                      Seed "Senior React Developer" Job for Testing
                    </button>
                  </div>
                )}
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
