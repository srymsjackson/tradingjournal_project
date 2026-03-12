import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import JournalPage from './pages/JournalPage'
import ReviewPage from './pages/ReviewPage'
import SettingsPage from './pages/SettingsPage'
import './App.css'

const AUTH_STORAGE_KEY = 'pulse-journal-authenticated'

const hasStoredSession = () => localStorage.getItem(AUTH_STORAGE_KEY) === '1'

const storeSession = (isAuthenticated: boolean) => {
  localStorage.setItem(AUTH_STORAGE_KEY, isAuthenticated ? '1' : '0')
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => hasStoredSession())

  const handleLogin = () => {
    storeSession(true)
    setIsAuthenticated(true)
  }

  const handleSignup = () => {
    storeSession(true)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    storeSession(false)
    setIsAuthenticated(false)
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/app/dashboard" replace /> : <HomePage />} />
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/app/dashboard" replace /> : <LoginPage onLogin={handleLogin} />}
        />
        <Route
          path="/signup"
          element={isAuthenticated ? <Navigate to="/app/dashboard" replace /> : <SignupPage onSignup={handleSignup} />}
        />

        <Route
          path="/app"
          element={isAuthenticated ? <AppLayout onLogout={handleLogout} /> : <Navigate to="/login" replace />}
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="journal" element={<JournalPage />} />
          <Route path="review" element={<ReviewPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to={isAuthenticated ? '/app/dashboard' : '/'} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
