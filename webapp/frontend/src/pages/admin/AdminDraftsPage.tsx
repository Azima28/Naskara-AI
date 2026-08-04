import React, { useEffect, useState } from 'react'
import {
  forceDeleteDraft,
  generateDocx,
  inspectAdminDraft,
  listAdminDrafts,
} from '@/api/client'
import type { AdminDraftItem } from '@/types/api'
import NotificationModal from '@/components/common/NotificationModal'
import {
  IconCross,
  IconDocument,
  IconDownload,
  IconEye,
  IconTrash,
} from '@/components/common/Icons'

export default function AdminDraftsPage() {
  const [drafts, setDrafts] = useState<AdminDraftItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [inspectDraft, setInspectDraft] = useState<any | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminDraftItem | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const [notice, setNotice] = useState<{ title: string; message: string; type: 'success' | 'error' } | null>(null)

  const loadDrafts = async () => {
    setLoading(true)
    try {
      const res = await listAdminDrafts({ search: search.trim(), status_filter: statusFilter || undefined })
      setDrafts(res.items)
      setTotal(res.total)
    } catch (err: any) {
      setNotice({ title: 'Error', message: err?.response?.data?.detail || 'Gagal memuat daftar draft.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDrafts()
  }, [search, statusFilter])

  // Handle Escape key to close inspect modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setInspectDraft(null)
      }
    }
    if (inspectDraft) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [inspectDraft])

  const handleInspect = async (draftId: string) => {
    try {
      const data = await inspectAdminDraft(draftId)
      setInspectDraft(data)
    } catch (err: any) {
      setNotice({ title: 'Error', message: err?.response?.data?.detail || 'Gagal memuat detail draft.', type: 'error' })
    }
  }

  const handleDownload = async (draftId: string) => {
    setDownloadingId(draftId)
    try {
      const warningMsg = await generateDocx(draftId)
      if (warningMsg) {
        setNotice({ title: 'Dokumen Dihasilkan dengan Catatan', message: warningMsg, type: 'success' })
      } else {
        setNotice({ title: 'Sukses Download', message: 'File laporan .docx berhasil di-generate dan diunduh.', type: 'success' })
      }
    } catch (err: any) {
      setNotice({ title: 'Gagal Download', message: err?.message || 'Gagal generate dokumen docx.', type: 'error' })
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      await forceDeleteDraft(deleteTarget.id)
      setNotice({ title: 'Draft Dihapus', message: `Draft '${deleteTarget.title}' berhasil dihapus.`, type: 'success' })
      setDeleteTarget(null)
      loadDrafts()
    } catch (err: any) {
      setNotice({ title: 'Error', message: err?.response?.data?.detail || 'Gagal menghapus draft.', type: 'error' })
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--ink)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconDocument size={24} color="var(--green-600)" /> Moderasi &amp; Pengawasan ({total} Draft) Laporan PKL
        </h1>
        <p style={{ color: 'var(--ink-soft)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
          Pantau seluruh dokumen laporan PKL siswa lintas jurusan, periksa kelengkapan data, dan download file .docx hasil generate.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', background: 'var(--surface)', padding: '16px', borderRadius: '8px', border: '1px solid var(--line)' }}>
        <input
          type="text"
          placeholder="Cari judul laporan, nama siswa, atau email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input"
          style={{ flex: 1 }}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-input" style={{ width: '180px' }}>
          <option value="">Semua Status</option>
          <option value="collecting">Collecting (Pengisian)</option>
          <option value="reviewing">Reviewing (Review AI)</option>
          <option value="ready">Ready (Siap Cetak)</option>
        </select>
      </div>

      {/* Draft Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: 'var(--paper)', borderBottom: '1px solid var(--line)', color: 'var(--ink-soft)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 16px' }}>Judul Laporan</th>
              <th style={{ padding: '12px 16px' }}>Pemilik / Siswa</th>
              <th style={{ padding: '12px 16px' }}>Jurusan</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px' }}>Terakhir Diubah</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--ink-soft)' }}>
                  Memuat data draft laporan...
                </td>
              </tr>
            ) : drafts.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--ink-soft)' }}>
                  Tidak ada draft laporan ditemukan.
                </td>
              </tr>
            ) : (
              drafts.map((d) => (
                <tr key={d.id} style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{d.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>ID: {d.id}</div>
                  </td>

                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 500, color: 'var(--ink)' }}>{d.user_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>{d.user_email}</div>
                  </td>

                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{d.jurusan || '-'}</td>

                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: d.status === 'ready' ? '#dcfce7' : d.status === 'reviewing' ? '#fef3c7' : '#f3f4f6',
                        color: d.status === 'ready' ? '#15803d' : d.status === 'reviewing' ? '#b45309' : '#4b5563',
                      }}
                    >
                      {d.status}
                    </span>
                  </td>

                  <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--ink-soft)' }}>
                    {new Date(d.updated_at).toLocaleString('id-ID')}
                  </td>

                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                      <button
                        onClick={() => handleInspect(d.id)}
                        className="btn btn--outline btn--sm"
                        style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <IconEye size={14} /> Inspeksi
                      </button>
                      <button
                        onClick={() => handleDownload(d.id)}
                        disabled={downloadingId === d.id}
                        className="btn btn--secondary btn--sm"
                        style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <IconDownload size={14} /> {downloadingId === d.id ? 'Memuat...' : 'DOCX'}
                      </button>
                      <button
                        onClick={() => setDeleteTarget(d)}
                        className="btn btn--danger btn--sm"
                        style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        title="Hapus Draft"
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Detail Inspect Draft */}
      {inspectDraft && (
        <div style={modalOverlayStyle} onClick={() => setInspectDraft(null)}>
          <div
            style={{
              ...modalContentStyle,
              maxWidth: '720px',
              height: '80vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Sticky Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--ink)' }}>Inspeksi Detail Draft ({inspectDraft.title})</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', marginTop: '2px' }}>
                  Pemilik: <strong>{inspectDraft.user_name}</strong> ({inspectDraft.user_email}) | ID: {inspectDraft.id}
                </div>
              </div>
              <button
                onClick={() => setInspectDraft(null)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '4px',
                  color: 'var(--ink-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Tutup (Esc)"
              >
                <IconCross size={20} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: 'var(--paper)' }}>
              <pre style={{ margin: 0, fontSize: '0.8rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: 'var(--ink)' }}>
                {JSON.stringify(inspectDraft.data_json, null, 2)}
              </pre>
            </div>

            {/* Modal Sticky Footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end', background: 'var(--surface)' }}>
              <button onClick={() => setInspectDraft(null)} className="btn btn--primary">
                Tutup (Esc)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Delete Modal */}
      {deleteTarget && (
        <NotificationModal
          isOpen={true}
          type="error"
          title="Konfirmasi Hapus Draft"
          message={`Apakah Anda yakin ingin menghapus draft '${deleteTarget.title}' milik ${deleteTarget.user_email}? Aksi ini tidak dapat dibatalkan.`}
          confirmLabel="Hapus Draft"
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {notice && (
        <NotificationModal
          isOpen={true}
          type={notice.type}
          title={notice.title}
          message={notice.message}
          onClose={() => setNotice(null)}
        />
      )}
    </div>
  )
}

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
}

const modalContentStyle: React.CSSProperties = {
  background: 'var(--surface)',
  padding: '24px',
  borderRadius: '8px',
  width: '100%',
  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
}
