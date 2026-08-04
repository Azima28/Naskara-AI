import React, { useEffect, useState } from 'react'
import { auditAssets, cleanupOrphanedAssets } from '@/api/client'
import type { AssetAuditItem } from '@/types/api'
import NotificationModal from '@/components/common/NotificationModal'
import {
  IconAlert,
  IconCheck,
  IconImage,
  IconTrash,
} from '@/components/common/Icons'

export default function AdminAssetsPage() {
  const [assets, setAssets] = useState<AssetAuditItem[]>([])
  const [summary, setSummary] = useState({ total_files: 0, total_bytes: 0, total_mb: 0, orphaned_count: 0 })
  const [loading, setLoading] = useState(true)
  const [cleaning, setCleaning] = useState(false)
  const [notice, setNotice] = useState<{ title: string; message: string; type: 'success' | 'error' } | null>(null)

  const loadAssets = async () => {
    setLoading(true)
    try {
      const res = await auditAssets()
      setAssets(res.items)
      setSummary({
        total_files: res.total_files,
        total_bytes: res.total_bytes,
        total_mb: res.total_mb,
        orphaned_count: res.orphaned_count,
      })
    } catch (err: any) {
      setNotice({ title: 'Error', message: err?.response?.data?.detail || 'Gagal mengaudit aset media.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAssets()
  }, [])

  const handleCleanupOrphans = async () => {
    setCleaning(true)
    try {
      const res = await cleanupOrphanedAssets()
      setNotice({
        title: 'Pembersihan Selesai',
        message: res.message,
        type: 'success',
      })
      loadAssets()
    } catch (err: any) {
      setNotice({ title: 'Error', message: err?.response?.data?.detail || 'Gagal membersihkan file orphaned.', type: 'error' })
    } finally {
      setCleaning(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--ink)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconImage size={24} color="var(--green-600)" /> Audit Storage &amp; Media Unggahan
          </h1>
          <p style={{ color: 'var(--ink-soft)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
            Pemeriksaan ruang fisik disk folder uploads/, deteksi gambar orphaned (tidak terpakai lagi oleh draft mana pun), dan pembersihan otomatis.
          </p>
        </div>
        <button
          onClick={handleCleanupOrphans}
          disabled={cleaning || summary.orphaned_count === 0}
          className="btn btn--danger"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <IconTrash size={16} /> {cleaning ? 'Clearing...' : `Bersihkan ${summary.orphaned_count} File Orphaned`}
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={cardStyle}>
          <div style={cardTitleStyle}>Total File Unggahan</div>
          <div style={cardValStyle}>{summary.total_files} file</div>
        </div>
        <div style={cardStyle}>
          <div style={cardTitleStyle}>Total Kapasitas Terpakai</div>
          <div style={cardValStyle}>{summary.total_mb} MB</div>
        </div>
        <div style={{ ...cardStyle, borderLeft: '4px solid var(--amber-500, #f59e0b)' }}>
          <div style={cardTitleStyle}>File Orphaned (Tidak Terikat)</div>
          <div style={{ ...cardValStyle, color: summary.orphaned_count > 0 ? '#b45309' : '#15803d' }}>
            {summary.orphaned_count} file
          </div>
        </div>
      </div>

      {/* Asset Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: 'var(--paper)', borderBottom: '1px solid var(--line)', color: 'var(--ink-soft)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 16px' }}>Nama File</th>
              <th style={{ padding: '12px 16px' }}>Jalur relatif</th>
              <th style={{ padding: '12px 16px' }}>Ukuran File</th>
              <th style={{ padding: '12px 16px' }}>Status Referensi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'var(--ink-soft)' }}>
                  Mengaudit file media...
                </td>
              </tr>
            ) : assets.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'var(--ink-soft)' }}>
                  Tidak ada file di direktori uploads/.
                </td>
              </tr>
            ) : (
              assets.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--ink)' }}>{item.filename}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--ink-soft)' }}>
                    uploads/{item.relative_path}
                  </td>
                  <td style={{ padding: '12px 16px' }}>{item.size_kb} KB</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: item.is_orphaned ? '#fee2e2' : '#dcfce7',
                        color: item.is_orphaned ? '#b91c1c' : '#15803d',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {item.is_orphaned ? <><IconAlert size={12} /> Orphaned (Tidak Terikat)</> : <><IconCheck size={12} /> Terikat Draft</>}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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

const cardStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: '8px',
  padding: '16px',
}

const cardTitleStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 700,
  color: 'var(--ink-soft)',
  textTransform: 'uppercase',
}

const cardValStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 800,
  color: 'var(--ink)',
  marginTop: '4px',
}
