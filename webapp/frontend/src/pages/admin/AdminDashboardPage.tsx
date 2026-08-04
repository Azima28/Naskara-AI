import React, { useEffect, useState } from 'react'
import { getAdminStats } from '@/api/client'
import type { AdminStats } from '@/types/api'
import NotificationModal from '@/components/common/NotificationModal'
import {
  IconChart,
  IconCode,
  IconDocument,
  IconGear,
  IconImage,
  IconUsers,
} from '@/components/common/Icons'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState<{ title: string; message: string; type: 'success' | 'error' } | null>(null)

  const loadStats = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getAdminStats()
      setStats(data)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Gagal memuat statistik admin.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  if (loading) {
    return <div style={{ color: 'var(--ink-soft)' }}>Memuat ringkasan statistik admin...</div>
  }

  if (error) {
    return (
      <div style={{ padding: '16px', background: 'var(--red-100, #fee2e2)', color: 'var(--red-600, #dc2626)', borderRadius: '8px' }}>
        <strong>Error:</strong> {error}
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--ink)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconChart size={24} color="var(--green-600)" /> Ringkasan Sistem &amp; Overview Admin
        </h1>
        <p style={{ color: 'var(--ink-soft)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
          Pemantauan terpusat statistik pengguna, dokumen draft PKL, kapasitas penyimpanan media, dan status kecerdasan buatan (AI).
        </p>
      </div>

      {/* Stat Tiles Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {/* Tile 1: Total Users */}
        <div style={tileStyle}>
          <div style={tileHeaderStyle}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <IconUsers size={18} color="var(--green-600)" /> Total Pengguna
            </span>
            <span style={badgeStyle}>{stats?.users.total || 0}</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', marginTop: '12px' }}>
            Siswa: <strong>{stats?.users.by_role.siswa || 0}</strong> | Guru: <strong>{stats?.users.by_role.guru || 0}</strong> | Admin: <strong>{stats?.users.by_role.admin || 0}</strong>
          </div>
        </div>

        {/* Tile 2: Total Drafts */}
        <div style={tileStyle}>
          <div style={tileHeaderStyle}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <IconDocument size={18} color="var(--blue-600, #2563eb)" /> Total Draft PKL
            </span>
            <span style={{ ...badgeStyle, background: 'var(--blue-100, #dbeafe)', color: 'var(--blue-700, #1d4ed8)' }}>
              {stats?.drafts.total || 0}
            </span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', marginTop: '12px' }}>
            Collecting: <strong>{stats?.drafts.by_status.collecting || 0}</strong> | Ready: <strong>{stats?.drafts.by_status.ready || 0}</strong>
          </div>
        </div>

        {/* Tile 3: Storage Usage */}
        <div style={tileStyle}>
          <div style={tileHeaderStyle}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <IconImage size={18} color="var(--amber-600, #d97706)" /> Storage Media
            </span>
            <span style={{ ...badgeStyle, background: 'var(--amber-100, #fef3c7)', color: 'var(--amber-800, #92400e)' }}>
              {stats?.storage.uploads_mb || 0} MB
            </span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', marginTop: '12px' }}>
            Aset Terunggah: <strong>{stats?.storage.uploads_files || 0} file</strong>
          </div>
        </div>

        {/* Tile 4: DB Size */}
        <div style={tileStyle}>
          <div style={tileHeaderStyle}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <IconCode size={18} color="var(--green-700, #15803d)" /> Ukuran SQLite DB
            </span>
            <span style={{ ...badgeStyle, background: 'var(--green-100, #dcfce7)', color: 'var(--green-800, #166534)' }}>
              {stats?.storage.db_mb || 0} MB
            </span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', marginTop: '12px' }}>
            Database: <strong>pkl_reports.db</strong>
          </div>
        </div>
      </div>

      {/* System Health Status Panel */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '8px', padding: '24px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconGear size={20} color="var(--green-600)" /> Status Layanan Infrastruktur
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div style={healthItemStyle}>
            <div>
              <strong>Layanan Kecerdasan Buatan (AI Engine)</strong>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)' }}>Model: {stats?.system.ai_model}</div>
            </div>
            <span style={stats?.system.ai_enabled ? statusActiveStyle : statusInactiveStyle}>
              {stats?.system.ai_enabled ? 'AKTIF' : 'NON-AKTIF'}
            </span>
          </div>

          <div style={healthItemStyle}>
            <div>
              <strong>Lingkungan Aplikasi (Environment)</strong>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)' }}>Mode: {stats?.system.environment}</div>
            </div>
            <span style={statusActiveStyle}>NORMAL</span>
          </div>

          <div style={healthItemStyle}>
            <div>
              <strong>LibreOffice Headless PDF Extractor</strong>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)' }}>Akurasi halaman fisik DOCX</div>
            </div>
            <span style={statusActiveStyle}>TERINTEGRASI</span>
          </div>
        </div>
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

const tileStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: '8px',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
}

const tileHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: '0.95rem',
  fontWeight: 700,
  color: 'var(--ink)',
}

const badgeStyle: React.CSSProperties = {
  background: 'var(--paper-2, #e5e0d8)',
  padding: '4px 10px',
  borderRadius: '12px',
  fontSize: '0.85rem',
  fontWeight: 700,
}

const healthItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  background: 'var(--paper)',
  borderRadius: '6px',
  border: '1px solid var(--line)',
}

const statusActiveStyle: React.CSSProperties = {
  background: '#dcfce7',
  color: '#15803d',
  padding: '3px 8px',
  borderRadius: '4px',
  fontSize: '0.75rem',
  fontWeight: 700,
}

const statusInactiveStyle: React.CSSProperties = {
  background: '#fee2e2',
  color: '#b91c1c',
  padding: '3px 8px',
  borderRadius: '4px',
  fontSize: '0.75rem',
  fontWeight: 700,
}
