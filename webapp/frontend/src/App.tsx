import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from '@/pages/LandingPage'
import AboutPage from '@/pages/AboutPage'
import FormatGuidePage from '@/pages/FormatGuidePage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import DashboardPage from '@/pages/Dashboard'
import WizardPage from '@/pages/WizardPage'
import EditorPage from '@/pages/EditorPage'

import ProtectedRoute from '@/components/ProtectedRoute'
import AdminLayout from '@/components/layout/AdminLayout'
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'
import AdminDraftsPage from '@/pages/admin/AdminDraftsPage'
import AdminAssetsPage from '@/pages/admin/AdminAssetsPage'
import AdminSettingsPage from '@/pages/admin/AdminSettingsPage'
import AdminLogsPage from '@/pages/admin/AdminLogsPage'

import './App.css'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/format-guide" element={<FormatGuidePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/wizard/:draftId" element={<WizardPage />} />
      <Route path="/editor/:draftId" element={<EditorPage />} />

      {/* Admin Panel Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin', 'guru']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="drafts" element={<AdminDraftsPage />} />
        <Route path="assets" element={<AdminAssetsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="logs" element={<AdminLogsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
