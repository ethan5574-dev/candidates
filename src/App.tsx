import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'
import { ToastProvider } from './context/ToastProvider'
import './App.css'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-gray-500 font-medium">Đang tải hệ thống...</p>
        </div>
      </div>
    )
  }

  return (
    <ToastProvider>
      <Routes>
        <Route 
          path="/auth" 
          element={!session ? <AuthPage /> : <Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="/dashboard" 
          element={session ? <DashboardPage session={session} /> : <Navigate to="/auth" replace />} 
        />
        <Route 
          path="/" 
          element={<Navigate to={session ? "/dashboard" : "/auth"} replace />} 
        />
      </Routes>
    </ToastProvider>
  )
}

export default App
