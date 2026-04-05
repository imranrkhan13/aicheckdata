import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { SubmissionsProvider } from './hooks/useSubmissions'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './components/DashboardLayout'

import LandingPage from './pages/LandingPage'
import AuthCallback from './pages/AuthCallback'
import DashboardPage from './pages/DashboardPage'
import SubmitPage from './pages/SubmitPage'
import HistoryPage from './pages/HistoryPage'
import LeaderboardPage from './pages/LeaderboardPage'
import ProjectsPage from './pages/ProjectsPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            element={
              <ProtectedRoute>
                <SubmissionsProvider>
                  <DashboardLayout />
                </SubmissionsProvider>
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard"   element={<DashboardPage />} />
            <Route path="/submit"      element={<SubmitPage />} />
            <Route path="/history"     element={<HistoryPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/projects"    element={<ProjectsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
