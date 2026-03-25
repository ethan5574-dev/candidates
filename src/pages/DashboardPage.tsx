import { supabase } from '../lib/supabase'
import { CandidateList } from '../components/CandidateList'
import { CandidateForm } from '../components/CandidateForm'
import { Analytics } from '../components/Analytics'
import type { Session } from '@supabase/supabase-js'

interface DashboardPageProps {
  session: Session;
}

export function DashboardPage({ session }: DashboardPageProps) {
  return (
    <div className="min-h-screen bg-transparent">
      {/* Background Decorative Blobs */}
      <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary opacity-10 blur-[120px] rounded-full -z-10"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-secondary opacity-10 blur-[120px] rounded-full -z-10"></div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <header className="glass flex flex-col md:flex-row justify-between items-center mb-12 p-6 rounded-[32px] border border-white/10 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/20">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                TalentPulse <span className="text-primary">HR</span>
              </h1>
              <p className="text-xs text-text-secondary font-medium flex items-center gap-2">
                <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse"></span>
                Recruitment Dashboard
              </p>
            </div>
          </div>

          <div className="mt-6 md:mt-0 flex items-center gap-4 bg-white/5 p-2 pr-4 rounded-2xl border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center border border-white/10 overflow-hidden">
               <span className="text-white font-bold text-xs">{session.user.email?.charAt(0).toUpperCase()}</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest leading-none mb-1">Administrator</p>
              <p className="text-xs font-semibold text-white/90 truncate max-w-[150px]">{session.user.email}</p>
            </div>
            <button
              onClick={() => supabase.auth.signOut()}
              className="ml-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/10 active:scale-95"
            >
              Sign Out
            </button>
          </div>
        </header>
        
        <main className="space-y-12 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white/90 flex items-center gap-3">
                <span className="w-1 h-6 bg-primary rounded-full"></span>
                Analytics Overview
              </h2>
            </div>
            <Analytics />
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <section className="lg:col-span-1 space-y-6">
              <h2 className="text-xl font-bold text-white/90 flex items-center gap-3">
                <span className="w-1 h-6 bg-secondary rounded-full"></span>
                Add New Candidate
              </h2>
              <CandidateForm />
            </section>

            <section className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-bold text-white/90 flex items-center gap-3">
                <span className="w-1 h-6 bg-accent rounded-full"></span>
                Candidate Pipeline
              </h2>
              <CandidateList />
            </section>
          </div>
        </main>

        <footer className="mt-20 pt-10 border-t border-white/5 text-center text-text-secondary text-xs font-medium">
          &copy; 2026 TalentPulse HR Portal. Powered by Supabase & Antigravity.
        </footer>
      </div>
    </div>
  )
}

export default DashboardPage
