import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/store/auth'

export default function RegisterPage() {
  const register = useAuth((s) => s.register)
  const loading = useAuth((s) => s.loading)
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    <div className="page-auth">
      <form className="card" onSubmit={onSubmit}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1>PKL Report Generator</h1>
          <p className="muted" style={{ margin: 0, fontSize: '0.95rem' }}>Buat Laporan PKL dalam Hitungan Menit</p>
        </div>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontWeight: '700' }}>Daftar Akun Baru</h2>
        {err && <p className="error">{err}</p>}
        <label>
          Nama <span className="field__req">*</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kamu" required />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Memproses…' : 'Daftar'}
        </button>
        <p className="link-text">
          Sudah punya akun? <Link to="/login">Masuk</Link>
        </p>
      </form>
    </div>
  )
}
