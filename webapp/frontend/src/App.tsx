import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from '@/pages/LandingPage'
import AboutPage from '@/pages/AboutPage'
import FormatGuidePage from '@/pages/FormatGuidePage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import DashboardPage from '@/pages/Dashboard'
import WizardPage from '@/pages/WizardPage'
import EditorPage from '@/pages/EditorPage'
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
