import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import AuthLayout from '@/components/layout/AuthLayout'
import { IconAlert, IconEye, IconEyeOff } from '@/components/common/Icons'

export default function LoginPage() {
  const login = useAuth((s) => s.login)
  const loading = useAuth((s) => s.loading)
  const user = useAuth((s) => s.user)
  const token = useAuth((s) => s.token)
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (token && user) {
      const role = user.role || 'siswa'
      if (role === 'admin' || role === 'guru') {
        nav('/admin', { replace: true })
      } else {
        nav('/dashboard', { replace: true })
      }
    }
  }, [token, user?.role])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErr('')
    try {
      await login(email, password)
      // Navigation is automatically handled by the useEffect above once token & user state are set
    } catch (r: any) {
      const detail = r?.response?.data?.detail
      let msg = typeof detail === 'string'
        ? detail
        : detail?.message || r?.message || 'Email atau kata sandi salah.'
      if (msg.includes('401') || msg.includes('status code')) {
        msg = 'Email atau kata sandi salah. Silakan periksa kembali.'
      }
      setErr(msg)
    }
  }

  return (
    <AuthLayout
      title="Selamat Datang Kembali"
      subtitle="Masuk ke Pembuat Laporan PKL (Naskara AI) untuk melanjutkan penyusunan laporan Anda."
    >
      <form onSubmit={onSubmit} className="auth-form">
        {err && (
          <div className="auth-alert auth-alert--danger">
            <IconAlert size={18} className="auth-alert__icon" />
            <span>{err}</span>
          </div>
        )}

        <div className="auth-field">
          <label htmlFor="email">Alamat Email</label>
          <input
            id="email"
            type="email"
            placeholder="nama@siswa.smk.sch.id"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="auth-field">
          <label htmlFor="password">Kata Sandi</label>
          <div className="auth-input-wrapper">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Masukkan password anda"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="auth-eye-toggle"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              aria-label="Toggle password visibility"
            >
              {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
            </button>
          </div>
        </div>

        <button type="submit" className="btn-primary auth-submit" disabled={loading}>
          {loading ? 'Sedang Memproses...' : 'Masuk ke Dashboard →'}
        </button>

        <p className="link-text">
          Belum memiliki akun? <Link to="/register">Daftar Akun Baru (Gratis)</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
