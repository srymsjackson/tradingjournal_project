import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import { ProtectedRoute, PublicOnlyRoute } from './components/AuthRouteGuards'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import JournalPage from './pages/JournalPage'
import ReviewPage from './pages/ReviewPage'
import SettingsPage from './pages/SettingsPage'
import { getCurrentSession, onAuthStateChange, signOutUser, signInWithEmailPassword, signUpWithEmailPassword } from './auth/session'
import './App.css'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    void getCurrentSession()
      .then((currentSession) => {
        if (!isMounted) return
        setSession(currentSession)
      })
      .finally(() => {
        if (!isMounted) return
        setIsAuthLoading(false)
      })

    const unsubscribe = onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setIsAuthLoading(false)
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  const isAuthenticated = Boolean(session?.user)

  const handleLogin = async (email: string, password: string) => {
    await signInWithEmailPassword(email, password)
  }

  const handleSignup = async (email: string, password: string) => {
    const data = await signUpWithEmailPassword(email, password)
    return Boolean(data.session)
  }

  const handleLogout = async () => {
    await signOutUser()
  }

  if (isAuthLoading) {
    return (
      <main className="public-shell">
        <section className="public-card auth-card">
          <h2>loading session</h2>
          <p>checking authentication state...</p>
        </section>
      </main>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <PublicOnlyRoute isAuthenticated={isAuthenticated}>
              <HomePage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute isAuthenticated={isAuthenticated}>
              <LoginPage onLogin={handleLogin} />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnlyRoute isAuthenticated={isAuthenticated}>
              <SignupPage onSignup={handleSignup} />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/app"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <AppLayout onLogout={handleLogout} />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route
            path="dashboard"
            element={<DashboardPage userId={session?.user.id ?? ''} userEmail={session?.user.email ?? ''} onSignOut={handleLogout} />}
          />
          <Route
            path="journal"
            element={<JournalPage userId={session?.user.id ?? ''} userEmail={session?.user.email ?? ''} onSignOut={handleLogout} />}
          />
          <Route
            path="review"
            element={<ReviewPage userId={session?.user.id ?? ''} userEmail={session?.user.email ?? ''} onSignOut={handleLogout} />}
          />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to={isAuthenticated ? '/app/dashboard' : '/'} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
