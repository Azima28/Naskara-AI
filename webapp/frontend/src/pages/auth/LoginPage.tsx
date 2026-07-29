import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import AuthLayout from '@/components/layout/AuthLayout'
import { IconAlert, IconEye, IconEyeOff, IconLightning } from '@/components/common/Icons'

export default function LoginPage() {
  const login = useAuth((s) => s.login)
  const loading = useAuth((s) => s.loading)
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [err, setErr] = useState('')

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErr('')
    try {
      await login(email, password)
      nav('/dashboard')
    } catch (r: any) {
      const detail = r?.response?.data?.detail
      const msg = typeof detail === 'string'
        ? detail
        : detail?.message || r?.message || 'Email atau password salah.'
      setErr(msg)
    }
  }

  const fillDemo = () => {
    setEmail('demo@pkl.id')
    setPassword('password123')
  }

  return (
    <AuthLayout
      title="Selamat Datang Kembali"
      subtitle="Masuk ke akun Naskara untuk melanjutkan penyusunan laporan Anda."
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

        <div className="auth-divider">
          <span>atau pakai akun percobaan</span>
        </div>

        <button
          type="button"
          className="btn-outline auth-demo-btn"
          onClick={fillDemo}
        >
          <IconLightning size={16} style={{ marginRight: '0.4rem' }} /> Gunakan Akun Demo (demo@pkl.id)
        </button>

        <p className="link-text">
          Belum memiliki akun? <Link to="/register">Daftar Akun Baru (Gratis)</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
