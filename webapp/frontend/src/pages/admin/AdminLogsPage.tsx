import React, { useEffect, useState } from 'react'
import { getHealthDetail, listAuditLogs } from '@/api/client'
import type { AuditLogItem, HealthDetailResponse } from '@/types/api'
import NotificationModal from '@/components/common/NotificationModal'
import {
  IconAlert,
  IconCheck,
  IconChecklist,
  IconCode,
  IconShield,
} from '@/components/common/Icons'

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([])
  const [total, setTotal] = useState(0)
  const [health, setHealth] = useState<HealthDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<{ title: string; message: string; type: 'success' | 'error' } | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [logsRes, healthRes] = await Promise.all([listAuditLogs(), getHealthDetail()])
      setLogs(logsRes.items)
      setTotal(logsRes.total)
      setHealth(healthRes)
    } catch (err: any) {
      setNotice({ title: 'Error', message: err?.response?.data?.detail || 'Gagal memuat log audit.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--ink)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconShield size={24} color="var(--green-600)" /> Audit Logs &amp; Diagnostik Sistem
        </h1>
        <p style={{ color: 'var(--ink-soft)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
          Jejak aktivitas keamanan administrator (Audit Trail) dan pemeriksaan diagnostik kesehatan infrastruktur server.
        </p>
      </div>

      {/* Health Diagnostics Box */}
      {health && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '8px', padding: '24px', marginBottom: '32px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.05rem', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconCode size={20} color="var(--green-600)" /> Environment &amp; Diagnostics Server
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div style={diagCardStyle}>
              <div style={diagTitleStyle}>Sistem Operasi &amp; Python</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--ink)' }}>{health.os_platform}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>{health.python_version.split(' ')[0]}</div>
            </div>

            <div style={diagCardStyle}>
              <div style={diagTitleStyle}>LibreOffice Converter</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: health.libreoffice_available ? '#15803d' : '#b45309', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {health.libreoffice_available ? <><IconCheck size={14} /> Terdeteksi</> : <><IconAlert size={14} /> Fallback Estimate</>}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>{health.libreoffice_path}</div>
            </div>

            <div style={diagCardStyle}>
              <div style={diagTitleStyle}>Kapasitas Ruang Disk</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--ink)' }}>
                Tersedia: <strong>{health.disk.free_gb} GB</strong> / {health.disk.total_gb} GB
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>Terpakai: {health.disk.used_gb} GB</div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--line)', fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconChecklist size={18} color="var(--green-600)" /> Security Audit Trail ({total} catatan log)
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: 'var(--paper)', borderBottom: '1px solid var(--line)', color: 'var(--ink-soft)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 16px' }}>Waktu</th>
              <th style={{ padding: '12px 16px' }}>Pelaku (Actor)</th>
              <th style={{ padding: '12px 16px' }}>Aksi (Action)</th>
              <th style={{ padding: '12px 16px' }}>Target</th>
              <th style={{ padding: '12px 16px' }}>IP Address</th>
              <th style={{ padding: '12px 16px' }}>Detail</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--ink-soft)' }}>
                  Memuat audit logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--ink-soft)' }}>
                  Belum ada catatan log aktivitas.
                </td>
              </tr>
            ) : (
              logs.map((l) => (
                <tr key={l.id} style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--ink-soft)' }}>
                    {new Date(l.created_at).toLocaleString('id-ID')}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--ink)' }}>{l.actor_email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={actionBadgeStyle}>{l.action}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>{l.target || '-'}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--ink-soft)' }}>{l.ip_address || '127.0.0.1'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--ink-soft)' }}>
                    {JSON.stringify(l.details)}
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

const diagCardStyle: React.CSSProperties = {
  background: 'var(--paper)',
  padding: '16px',
  borderRadius: '6px',
  border: '1px solid var(--line)',
}

const diagTitleStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 700,
  color: 'var(--ink-soft)',
  marginBottom: '4px',
  textTransform: 'uppercase',
}

const actionBadgeStyle: React.CSSProperties = {
  background: 'var(--paper-2, #e5e0d8)',
  color: 'var(--ink)',
  padding: '3px 8px',
  borderRadius: '4px',
  fontSize: '0.75rem',
  fontWeight: 700,
  fontFamily: 'monospace',
}
