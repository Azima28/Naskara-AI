import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import { listDrafts, createDraft, deleteDraft } from '@/api/client'
import type { DraftSummary } from '@/types/api'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function DashboardPage() {
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const nav = useNavigate()
  const [drafts, setDrafts] = useState<DraftSummary[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      setDrafts(await listDrafts())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async () => {
    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    const d = await createDraft(`Laporan PKL - ${today}`)
    nav(`/wizard/${d.id}`)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus draft ini?')) return
    await deleteDraft(id)
    load()
  }

  return (
    <ProtectedRoute>
      <div className="shell">
        <header className="shell__header">
          <div className="shell__row">
            <h1>PKL Report Generator</h1>
            <div className="shell__user">
              <span>{user?.name || user?.email}</span>
              <button className="btn-sm btn-outline" onClick={() => { logout(); nav('/login') }}>
                Keluar
              </button>
            </div>
          </div>
        </header>

        <section className="card">
          <div className="card__row">
            <h2>Draft Laporan</h2>
            <button onClick={handleCreate}>+ Buat Baru</button>
          </div>

          {loading && <p className="muted">Memuat…</p>}

          {!loading && drafts.length === 0 && (
            <div className="empty-state" style={{ marginTop: '1rem' }}>
              <h3>Selamat Datang di PKL Report Generator! 👋</h3>
              <p className="muted" style={{ maxWidth: '400px', margin: '0.5rem auto 1rem' }}>
                Ini adalah tempat di mana kamu bisa menyusun laporan PKL dengan mudah. Klik tombol di bawah untuk memulai draft pertamamu.
              </p>
              <button onClick={handleCreate} className="btn-primary">+ Buat Draft Laporan Pertama</button>
            </div>
          )}

          <ul className="draft-list">
            {drafts.map((d) => (
              <li key={d.id} className="draft-item">
                <div className="draft-item__info">
                  <strong>{d.title}</strong>
                  <span className="muted">
                    &nbsp;· {d.status} · {d.updated_at ? new Date(d.updated_at).toLocaleDateString('id-ID') : '-'}
                  </span>
                </div>
                <div className="draft-item__actions">
                  <Link to={`/wizard/${d.id}`} className="btn-sm">Edit</Link>
                  <button className="btn-sm btn-danger" onClick={() => handleDelete(d.id)}>Hapus</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </ProtectedRoute>
  )
}
