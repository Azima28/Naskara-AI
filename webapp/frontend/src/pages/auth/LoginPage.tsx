import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/store/auth'

export default function LoginPage() {
  const login = useAuth((s) => s.login)
  const loading = useAuth((s) => s.loading)
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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

  return (
    <div className="page-auth">
      <form className="card" onSubmit={onSubmit}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1>PKL Report Generator</h1>
          <p className="muted" style={{ margin: 0, fontSize: '0.95rem' }}>Buat Laporan PKL dalam Hitungan Menit</p>
        </div>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontWeight: '700' }}>Masuk ke Akun Anda</h2>
        {err && <p className="error">{err}</p>}
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </label>
        <button type="submit" disabled={loading} style={{ width: '100%', marginBottom: '0.5rem' }}>
          {loading ? 'Memproses…' : 'Masuk'}
        </button>
        <button
          type="button"
          className="btn-outline"
          style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem' }}
          onClick={() => {
            setEmail('demo@pkl.id')
            setPassword('password123')
          }}
        >
          💡 Isikan Akun Demo (demo@pkl.id)
        </button>
        <p className="link-text">
          Belum punya akun? <Link to="/register">Daftar</Link>
        </p>
      </form>
    </div>
  )
}
