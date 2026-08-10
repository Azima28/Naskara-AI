import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import { listDrafts, createDraft, deleteDraft, generateDocx } from '@/api/client'
import type { DraftSummary } from '@/types/api'
import ProtectedRoute from '@/components/ProtectedRoute'
import NotificationModal from '@/components/common/NotificationModal'
import {
  IconPlus,
  IconPencil,
  IconDocument,
  IconDownload,
  IconTrash,
  IconChecklist,
  IconCheck,
} from '@/components/common/Icons'

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardInner />
    </ProtectedRoute>
  )
}

function DashboardInner() {
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const nav = useNavigate()

  const [drafts, setDrafts] = useState<DraftSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const [modal, setModal] = useState<{
    isOpen: boolean
    title?: string
    message: string
    type?: 'error' | 'warning' | 'info' | 'success'
    confirmLabel?: string
    onConfirm?: () => void
  }>({
    isOpen: false,
    message: '',
  })

  const load = async () => {
    try {
      setDrafts(await listDrafts())
    } catch {
      /* ignore error when session expires or fails */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async (jurusanLabel?: string) => {
    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    const prefix = jurusanLabel ? `Laporan PKL ${jurusanLabel}` : 'Laporan PKL'
    const d = await createDraft(`${prefix} - ${today}`)
    nav(`/wizard/${d.id}`)
  }

  const handleDelete = (id: string) => {
    setModal({
      isOpen: true,
      title: 'Hapus Draft Laporan',
      message: 'Hapus draft laporan ini secara permanen? Data yang telah dihapus tidak dapat dikembalikan.',
      type: 'error',
      confirmLabel: 'Ya, Hapus Permanen',
      onConfirm: async () => {
        await deleteDraft(id)
        load()
      },
    })
  }

  const handleDownload = async (id: string) => {
    setDownloadingId(id)
    try {
      await generateDocx(id)
    } catch (err: any) {
      setModal({
        isOpen: true,
        title: 'Gagal Mengunduh Dokumen',
        message: err?.message || 'Gagal mengunduh dokumen .docx',
        type: 'error',
      })
    } finally {
      setDownloadingId(null)
    }
  }

  // Filter drafts based on search query and status filter
  const filteredDrafts = drafts.filter((d) => {
    const matchSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchSearch) return false
    if (statusFilter === 'all') return true
    if (statusFilter === 'ready') return d.status === 'ready'
    if (statusFilter === 'draft') return d.status !== 'ready'
    return true
  })

  return (
    <div className="dash-layout">
      {/* Top Header Navigation */}
      <header className="dash-header">
        <div className="dash-header__container">
          <Link to="/" className="dash-header__brand">
            <div className="dash-header__logo">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <div className="dash-header__brand-info">
              <strong>Naskara AI</strong>
              <span>Standar Panduan SMKN 4 Bandar Lampung</span>
            </div>
          </Link>

          <div className="dash-header__user">
            {user?.role === 'admin' && (
              <Link to="/admin" className="btn-sm btn-outline" style={{ borderColor: 'var(--red-600, #dc2626)', color: 'var(--red-600, #dc2626)', marginRight: '8px' }}>
                🛡️ Panel Admin
              </Link>
            )}
            <div className="user-profile-badge">
              <div className="user-avatar">{user?.name ? user.name.charAt(0).toUpperCase() : 'S'}</div>
              <div className="user-info">
                <span className="user-name">{user?.name || user?.email}</span>
                <span className="user-role">{user?.role === 'admin' ? 'Administrator' : 'Siswa Vokasi'}</span>
              </div>
            </div>
            <button
              className="btn-sm btn-outline"
              onClick={() => { logout(); nav('/login') }}
              title="Keluar dari akun"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard Main Content Shell */}
      <main className="dash-main">
        <div className="dash-main__container">
          {/* User Welcome & Overview Banner */}
          <div className="dash-welcome">
            <div className="dash-welcome__text">
              <h1>Selamat Datang, {user?.name || 'Siswa PKL'}!</h1>
              <p>Kelola draf laporan PKL Anda dengan presisi standar akademik resmi. Dokumen siap diunduh dalam format <code>.docx</code> asli.</p>
            </div>
            <div className="dash-welcome__action">
              <button onClick={() => handleCreate()} className="btn-primary hero-btn-lg">
                <IconPlus size={18} style={{ marginRight: '0.4rem' }} /> Buat Draft Laporan Baru
              </button>
            </div>
          </div>

          {/* Draft Management Section */}
          <div className="dash-drafts-panel">
            <div className="dash-drafts-panel__head">
              <h2>Daftar Draft Laporan Saya</h2>

              {/* Filter and Search Bar */}
              <div className="dash-drafts-panel__filters">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Cari judul draf..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="filter-tabs">
                  <button
                    className={`filter-tab ${statusFilter === 'all' ? 'is-active' : ''}`}
                    onClick={() => setStatusFilter('all')}
                  >
                    Semua ({drafts.length})
                  </button>
                  <button
                    className={`filter-tab ${statusFilter === 'draft' ? 'is-active' : ''}`}
                    onClick={() => setStatusFilter('draft')}
                  >
                    Sedang Diisi
                  </button>
                  <button
                    className={`filter-tab ${statusFilter === 'ready' ? 'is-active' : ''}`}
                    onClick={() => setStatusFilter('ready')}
                  >
                    Siap Generate
                  </button>
                </div>
              </div>
            </div>

            {loading && <p className="muted" style={{ padding: '2rem', textAlign: 'center' }}>Memuat daftar draft laporan...</p>}

            {!loading && filteredDrafts.length === 0 && (
              <div className="empty-state-dash">
                <div className="empty-icon"><IconDocument size={36} color="var(--green-700)" /></div>
                <h3>Belum Ada Draft Laporan</h3>
                <p className="muted">
                  {searchQuery
                    ? 'Tidak ada draft yang cocok dengan pencarian Anda.'
                    : 'Klik tombol di bawah ini untuk memulai draf laporan PKL pertama Anda.'}
                </p>
                <button onClick={() => handleCreate()} className="btn-primary" style={{ marginTop: '1rem' }}>
                  <IconPlus size={16} style={{ marginRight: '0.4rem' }} /> Buat Draft Laporan Baru
                </button>
              </div>
            )}

            {/* Draft List Items */}
            <div className="draft-grid">
              {filteredDrafts.map((d) => (
                <div key={d.id} className="draft-card-item">
                  <div className="draft-card-item__header">
                    <div className="draft-card-item__title-group">
                      <h4>{d.title}</h4>
                      <span className="draft-card-item__date">
                        Diperbarui: {d.updated_at ? new Date(d.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </span>
                    </div>
                    <span className={`status-badge ${d.status === 'ready' ? 'status-badge--ready' : 'status-badge--draft'}`}>
                      {d.status === 'ready' ? 'Siap Diunduh (.docx)' : 'Draf Diisi'}
                    </span>
                  </div>

                  <div className="draft-card-item__actions">
                    <Link to={`/wizard/${d.id}`} className="btn-sm btn-primary">
                      <IconPencil size={14} style={{ marginRight: '0.3rem' }} /> Lanjutkan Isi Form Data
                    </Link>
                    <Link to={`/editor/${d.id}`} className="btn-sm btn-outline">
                      <IconDocument size={14} style={{ marginRight: '0.3rem' }} /> Edit &amp; Rapikan Teks AI
                    </Link>
                    <button
                      onClick={() => handleDownload(d.id)}
                      disabled={downloadingId === d.id}
                      className="btn-sm btn-outline"
                      style={{ color: 'var(--green-700)', borderColor: 'var(--green-600)' }}
                    >
                      <IconDownload size={14} style={{ marginRight: '0.3rem' }} /> {downloadingId === d.id ? 'Mengunduh...' : 'Unduh .docx'}
                    </button>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="btn-sm btn-danger"
                      title="Hapus Draft"
                    >
                      <IconTrash size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Checklist Standar Kelengkapan Laporan */}
          <div className="academic-checklist-card">
            <h3><IconChecklist size={20} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> Checklist Kelengkapan Laporan (Standar 20-Poin SMKN 4)</h3>
            <p className="muted" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
              Pastikan draf Anda melengkapi field berikut agar dokumen .docx terisi 100% sempurna:
            </p>
            <div className="checklist-grid">
              <div className="checklist-item"><IconCheck size={14} color="var(--green-700)" style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} /> <strong>Identitas Siswa</strong> (Nama, NIS, NISN, Kelas, Jurusan)</div>
              <div className="checklist-item"><IconCheck size={14} color="var(--green-700)" style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} /> <strong>Identitas Perusahaan</strong> (Nama PT, Alamat, Pembimbing Industri)</div>
              <div className="checklist-item"><IconCheck size={14} color="var(--green-700)" style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} /> <strong>Identitas Sekolah</strong> (Nama Kepala Sekolah, NIP, Guru Pembimbing)</div>
              <div className="checklist-item"><IconCheck size={14} color="var(--green-700)" style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} /> <strong>Profil Perusahaan</strong> (Sejarah, Visi Misi, Bidang Usaha)</div>
              <div className="checklist-item"><IconCheck size={14} color="var(--green-700)" style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} /> <strong>Jurnal Kegiatan Harian</strong> (Minimal 3-5 kegiatan teknis)</div>
              <div className="checklist-item"><IconCheck size={14} color="var(--green-700)" style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} /> <strong>Peralatan &amp; Kendala</strong> (Perangkat kerja &amp; solusi kendala)</div>
              <div className="checklist-item"><IconCheck size={14} color="var(--green-700)" style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} /> <strong>Kesimpulan &amp; Saran</strong> (Draf AI akurat &amp; rapi)</div>
              <div className="checklist-item"><IconCheck size={14} color="var(--green-700)" style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} /> <strong>Lampiran Dokumentasi</strong> (Foto kegiatan PKL)</div>
            </div>
          </div>

        </div>
      </main>

      <NotificationModal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        confirmLabel={modal.confirmLabel}
        onConfirm={modal.onConfirm}
        onClose={() => setModal((prev) => ({ ...prev, isOpen: false, onConfirm: undefined, confirmLabel: undefined }))}
      />
    </div>
  )
}
