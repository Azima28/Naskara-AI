import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import AuthLayout from '@/components/layout/AuthLayout'
import { IconAlert, IconEye, IconEyeOff } from '@/components/common/Icons'

export default function RegisterPage() {
  const register = useAuth((s) => s.register)
  const loading = useAuth((s) => s.loading)
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [err, setErr] = useState('')

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErr('')
    try {
      await register(email, name, password)
      nav('/dashboard')
    } catch (r: any) {
      const detail = r?.response?.data?.detail
      const msg = typeof detail === 'string'
        ? detail
        : detail?.message || r?.message || 'Gagal mendaftar akun baru.'
      setErr(msg)
    }
  }

  return (
    <AuthLayout
      title="Daftar Akun Baru"
      subtitle="Buat akun gratis untuk menyusun dan mengunduh laporan PKL standar resmi."
    >
      <form onSubmit={onSubmit} className="auth-form">
        {err && (
          <div className="auth-alert auth-alert--danger">
            <IconAlert size={18} className="auth-alert__icon" />
            <span>{err}</span>
          </div>
        )}

        <div className="auth-field">
          <label htmlFor="name">Nama Lengkap Siswa</label>
          <input
            id="name"
            type="text"
            placeholder="Contoh: Muhammad Rizky Pratama"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>

        <div className="auth-field">
          <label htmlFor="email">Alamat Email Active</label>
          <input
            id="email"
            type="email"
            placeholder="nama@siswa.smk.sch.id atau gmail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="auth-field">
          <label htmlFor="password">Kata Sandi (Minimal 6 Karakter)</label>
          <div className="auth-input-wrapper">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Buat kata sandi aman"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
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
          {loading ? 'Mendaftarkan Akun...' : 'Daftar Sekarang (Gratis) →'}
        </button>

        <p className="link-text">
          Sudah memiliki akun? <Link to="/login">Masuk di Sini</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
