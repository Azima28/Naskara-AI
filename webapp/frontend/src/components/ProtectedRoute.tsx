import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import type { UserRole } from '@/types/api'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const token = useAuth((s) => s.token)
  const user = useAuth((s) => s.user)
  const initialized = useAuth((s) => s.initialized)
  const location = useLocation()

  if (!initialized) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ink-soft)' }}>Memuat sesi otentikasi...</div>
  }

  if (!token || !user) return <Navigate to="/login" replace />

  if (!user.is_active) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user.role || 'siswa'
    if (!allowedRoles.includes(userRole)) {
      const fallbackTarget = (userRole === 'admin' || userRole === 'guru') ? '/admin' : '/dashboard'
      if (location.pathname === fallbackTarget) {
        return <Navigate to="/dashboard" replace />
      }
      return <Navigate to={fallbackTarget} replace />
    }
  }

  return <>{children}</>
}
