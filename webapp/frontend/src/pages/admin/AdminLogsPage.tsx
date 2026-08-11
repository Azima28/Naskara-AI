import React, { useEffect, useRef, useState } from 'react'
import {
  clearDebugLogs,
  getDebugLogs,
  getHealthDetail,
  listAuditLogs,
  simulateDebugErrorLogs,
} from '@/api/client'
import type { AuditLogItem, DebugLogItem, HealthDetailResponse } from '@/types/api'
import NotificationModal from '@/components/common/NotificationModal'
import {
  IconAlert,
  IconCheck,
  IconChecklist,
  IconCode,
  IconGear,
  IconShield,
  IconSparkles,
  IconTrash,
} from '@/components/common/Icons'

const LOG_LEVELS = [
  { value: 'ALL', label: 'Semua Level' },
  { value: 'ERROR', label: '🔴 Hanya ERROR (Merah)' },
  { value: 'WARNING', label: '⚠️ WARNING & ERROR' },
  { value: 'INFO', label: 'ℹ️ INFO' },
  { value: 'DEBUG', label: '🐛 DEBUG' },
]

const LOG_CATEGORIES = [
  { value: 'ALL', label: 'Semua Kategori Modul' },
  { value: 'AI_PROVIDER', label: '🤖 AI Engine Provider (Port 20128)' },
  { value: 'HTTP_REQUEST', label: '🌐 HTTP API Requests' },
  { value: 'AUTH', label: '🔑 Authentication & Session' },
  { value: 'DOCX_ENGINE', label: '📄 DOCX Assembly Engine' },
  { value: 'DATABASE', label: '🗄️ Database & Models' },
  { value: 'SECURITY', label: '🛡️ Security & Headers' },
  { value: 'SYSTEM', label: '⚙️ System Core' },
]

export default function AdminLogsPage() {
  const [activeTab, setActiveTab] = useState<'debug' | 'audit' | 'health'>('debug')

  // Realtime Debug Console State
  const [debugLogs, setDebugLogs] = useState<DebugLogItem[]>([])
  const [levelFilter, setLevelFilter] = useState<string>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isStreaming, setIsStreaming] = useState<boolean>(true)
  const [autoScroll, setAutoScroll] = useState<boolean>(true)
  const [selectedLogDetail, setSelectedLogDetail] = useState<DebugLogItem | null>(null)
  const [isSimulating, setIsSimulating] = useState<boolean>(false)

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([])
  const [auditTotal, setAuditTotal] = useState(0)

  // Health Diagnostics State
  const [health, setHealth] = useState<HealthDetailResponse | null>(null)

  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<{ title: string; message: string; type: 'success' | 'error' } | null>(null)

  const consoleEndRef = useRef<HTMLDivElement | null>(null)
  const pollIntervalRef = useRef<any>(null)

  // Auto scroll console to bottom when new logs land
  useEffect(() => {
    if (autoScroll && activeTab === 'debug' && consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [debugLogs, autoScroll, activeTab])

  // Fetch initial data
  const loadData = async () => {
    setLoading(true)
    try {
      const [debugRes, auditRes, healthRes] = await Promise.all([
        getDebugLogs({ limit: 300 }),
        listAuditLogs(),
        getHealthDetail(),
      ])
      setDebugLogs(debugRes.items || [])
      setAuditLogs(auditRes.items || [])
      setAuditTotal(auditRes.total || 0)
      setHealth(healthRes)
    } catch (err: any) {
      setNotice({ title: 'Error', message: err?.response?.data?.detail || 'Gagal memuat data log.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Poll loop for realtime debug console update (1.5s interval)
  useEffect(() => {
    if (isStreaming && activeTab === 'debug') {
      pollIntervalRef.current = setInterval(async () => {
        try {
          const highestId = debugLogs.length > 0 ? Math.max(...debugLogs.map((l) => l.id)) : 0
          const res = await getDebugLogs({
            level: levelFilter !== 'ALL' ? levelFilter : undefined,
            category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
            search: searchQuery.trim() || undefined,
            limit: 100,
            since_id: highestId,
          })

          if (res.items && res.items.length > 0) {
            setDebugLogs((prev) => {
              const existingIds = new Set(prev.map((p) => p.id))
              const newUnique = res.items.filter((item) => !existingIds.has(item.id))
              if (newUnique.length === 0) return prev
              return [...prev, ...newUnique].sort((a, b) => a.id - b.id)
            })
          }
        } catch {
          /* ignore polling error silently */
        }
      }, 1500)
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [isStreaming, activeTab, debugLogs, levelFilter, categoryFilter, searchQuery])

  // Clear logs handler
  const handleClearLogs = async () => {
    try {
      await clearDebugLogs()
      setDebugLogs([])
      setNotice({ title: 'Console Dibersihkan', message: 'Buffer log debug berhasil dibersihkan.', type: 'success' })
    } catch (err: any) {
      setNotice({ title: 'Error', message: err?.response?.data?.detail || 'Gagal membersihkan log.', type: 'error' })
    }
  }

  // Simulate test error handler
  const handleSimulateError = async () => {
    setIsSimulating(true)
    try {
      await simulateDebugErrorLogs()
      const refreshed = await getDebugLogs({ limit: 300 })
      setDebugLogs(refreshed.items.sort((a, b) => a.id - b.id))
      setNotice({ title: 'Simulasi Error Sukses', message: 'Contoh log ERROR & WARNING berhasil dibuat. Periksa sorotan warna merah di console!', type: 'success' })
    } catch (err: any) {
      setNotice({ title: 'Error', message: err?.response?.data?.detail || 'Gagal mensimulasikan error.', type: 'error' })
    } finally {
      setIsSimulating(false)
    }
  }

  // Filter local debug logs
  const filteredDebugLogs = debugLogs.filter((item) => {
    if (levelFilter === 'ERROR' && item.level !== 'ERROR') return false
    if (levelFilter === 'WARNING' && item.level !== 'WARNING' && item.level !== 'ERROR') return false
    if (levelFilter === 'INFO' && item.level !== 'INFO') return false
    if (levelFilter === 'DEBUG' && item.level !== 'DEBUG') return false

    if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const mMatch = item.message.toLowerCase().includes(q)
      const sMatch = item.source.toLowerCase().includes(q)
      const dMatch = JSON.stringify(item.detail || {}).toLowerCase().includes(q)
      if (!mMatch && !sMatch && !dMatch) return false
    }

    return true
  })

  // Counters for status bar
  const totalErrorCount = debugLogs.filter((l) => l.level === 'ERROR').length
  const totalWarnCount = debugLogs.filter((l) => l.level === 'WARNING').length
  const totalAiCount = debugLogs.filter((l) => l.category === 'AI_PROVIDER').length

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--ink)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconShield size={24} color="var(--green-600)" /> Realtime Debug Console &amp; System Logs
        </h1>
        <p style={{ color: 'var(--ink-soft)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
          Pemantauan langsung log eksekusi sistem, AI Engine Provider (Port 20128), HTTP API Requests, error highlighting, dan Audit Trail.
        </p>
      </div>

      {/* Tab Navigation Bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid var(--line)' }}>
        <button
          type="button"
          onClick={() => setActiveTab('debug')}
          style={{
            padding: '10px 18px',
            fontSize: '0.9rem',
            fontWeight: 700,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: activeTab === 'debug' ? 'var(--green-700)' : 'var(--ink-soft)',
            borderBottom: activeTab === 'debug' ? '3px solid var(--green-600)' : '3px solid transparent',
            marginBottom: '-2px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <IconCode size={18} /> Console Debug Full Realtime
          {totalErrorCount > 0 && (
            <span style={{ background: '#ef4444', color: '#ffffff', padding: '2px 7px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 800 }}>
              {totalErrorCount} ERROR
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          style={{
            padding: '10px 18px',
            fontSize: '0.9rem',
            fontWeight: 700,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: activeTab === 'audit' ? 'var(--green-700)' : 'var(--ink-soft)',
            borderBottom: activeTab === 'audit' ? '3px solid var(--green-600)' : '3px solid transparent',
            marginBottom: '-2px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <IconChecklist size={18} /> Security Audit Trail ({auditTotal})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('health')}
          style={{
            padding: '10px 18px',
            fontSize: '0.9rem',
            fontWeight: 700,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: activeTab === 'health' ? 'var(--green-700)' : 'var(--ink-soft)',
            borderBottom: activeTab === 'health' ? '3px solid var(--green-600)' : '3px solid transparent',
            marginBottom: '-2px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <IconGear size={18} /> Diagnostik Server &amp; Health
        </button>
      </div>

      {/* TAB 1: CONSOLE DEBUG FULL REALTIME */}
      {activeTab === 'debug' && (
        <div>
          {/* Controls Bar & Dropdowns */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
              {/* Dropdown 1: Level Filter */}
              <div>
                <label style={labelStyle}>Filter Log Level</label>
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', fontWeight: 700, fontSize: '0.85rem' }}
                >
                  {LOG_LEVELS.map((lvl) => (
                    <option key={lvl.value} value={lvl.value}>
                      {lvl.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dropdown 2: Kategori Modul Filter */}
              <div>
                <label style={labelStyle}>Filter Modul System</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', fontWeight: 700, fontSize: '0.85rem' }}
                >
                  {LOG_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search input */}
              <div>
                <label style={labelStyle}>Cari Text / Key Log</label>
                <input
                  type="text"
                  placeholder="Ketik kata kunci log..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {/* Action Buttons & Streaming Controls Row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', paddingTop: '12px', borderTop: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {/* Streaming Toggle */}
                <button
                  type="button"
                  onClick={() => setIsStreaming(!isStreaming)}
                  className="btn btn--sm"
                  style={{
                    background: isStreaming ? '#dcfce7' : '#f1f5f9',
                    border: isStreaming ? '1px solid #86efac' : '1px solid #cbd5e1',
                    color: isStreaming ? '#15803d' : '#475569',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isStreaming ? '#22c55e' : '#94a3b8', display: 'inline-block' }} />
                  {isStreaming ? 'Live Stream Aktif' : 'Streaming Di-Pause'}
                </button>

                {/* Auto Scroll Toggle */}
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  Auto-scroll ke bawah
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {/* Simulate Error Button */}
                <button
                  type="button"
                  onClick={handleSimulateError}
                  disabled={isSimulating}
                  className="btn btn--outline btn--sm"
                  style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <IconSparkles size={14} color="#f59e0b" />
                  {isSimulating ? 'Membuat Simulasi...' : 'Simulasikan Error Test'}
                </button>

                {/* Clear Console Button */}
                <button
                  type="button"
                  onClick={handleClearLogs}
                  className="btn btn--danger btn--sm"
                  style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <IconTrash size={14} /> Bersihkan Console
                </button>
              </div>
            </div>
          </div>

          {/* Quick Counter Summary Bar */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap', fontSize: '0.8rem' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '6px', color: '#334155' }}>
              Menampilkan: <strong>{filteredDebugLogs.length}</strong> / {debugLogs.length} Log
            </div>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: '6px', color: '#991b1b', fontWeight: 700 }}>
              🔴 Error: {totalErrorCount}
            </div>
            <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '6px 12px', borderRadius: '6px', color: '#92400e', fontWeight: 600 }}>
              ⚠️ Warning: {totalWarnCount}
            </div>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '6px 12px', borderRadius: '6px', color: '#1e40af', fontWeight: 600 }}>
              🤖 AI Provider: {totalAiCount}
            </div>
          </div>

          {/* Debug Console Feed Box */}
          <div
            style={{
              background: '#0f172a',
              borderRadius: '8px',
              border: '1px solid #334155',
              padding: '16px',
              maxHeight: '650px',
              overflowY: 'auto',
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              color: '#f8fafc',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
            }}
          >
            {filteredDebugLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b', fontSize: '0.85rem' }}>
                {loading ? 'Memuat log console debug...' : 'Belum ada log debug yang cocok dengan filter.'}
              </div>
            ) : (
              filteredDebugLogs.map((item) => {
                const isErr = item.level === 'ERROR'
                const isWarn = item.level === 'WARNING'
                const isInfo = item.level === 'INFO'

                // Color schemes for highlights
                const borderLeft = isErr ? '4px solid #ef4444' : isWarn ? '4px solid #f59e0b' : isInfo ? '4px solid #10b981' : '4px solid #8b5cf6'
                const bgTint = isErr ? 'rgba(239, 68, 68, 0.12)' : isWarn ? 'rgba(245, 158, 11, 0.08)' : 'rgba(30, 41, 59, 0.6)'
                const textColor = isErr ? '#fca5a5' : isWarn ? '#fcd34d' : '#f8fafc'
                const badgeBg = isErr ? '#7f1d1d' : isWarn ? '#78350f' : isInfo ? '#064e3b' : '#3b0764'

                let badgeText = '#e9d5ff'
                if (isErr) badgeText = '#fecaca'
                else if (isWarn) badgeText = '#fef3c7'
                else if (isInfo) badgeText = '#a7f3d0'

                return (
                  <div
                    key={item.id}
                    style={{
                      background: bgTint,
                      borderLeft: borderLeft,
                      borderRadius: '4px',
                      padding: '10px 14px',
                      marginBottom: '8px',
                      fontSize: '0.82rem',
                      lineHeight: 1.5,
                      boxSizing: 'border-box',
                    }}
                  >
                    {/* Top Meta Line */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {/* ID & Time */}
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                          #{item.id} • {new Date(item.timestamp).toLocaleTimeString('id-ID', { hour12: false })}
                        </span>

                        {/* Level Badge */}
                        <span style={{ background: badgeBg, color: badgeText, padding: '1px 7px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800 }}>
                          [{item.level}]
                        </span>

                        {/* Category Badge */}
                        <span style={{ background: '#1e293b', border: '1px solid #475569', color: '#cbd5e1', padding: '1px 6px', borderRadius: '4px', fontSize: '0.72rem' }}>
                          {item.category}
                        </span>
                      </div>

                      {/* Source badge */}
                      <span style={{ color: '#64748b', fontSize: '0.72rem' }}>
                        src: {item.source}
                      </span>
                    </div>

                    {/* Main Log Message (Highlighted) */}
                    <div style={{ color: textColor, fontWeight: isErr ? 700 : 500, wordBreak: 'break-word' }}>
                      {item.message}
                    </div>

                    {/* Quick JSON / Detail Toggle */}
                    {item.detail && Object.keys(item.detail).length > 0 && (
                      <div style={{ marginTop: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedLogDetail(item)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: isErr ? '#f87171' : '#38bdf8',
                            fontSize: '0.75rem',
                            padding: 0,
                            cursor: 'pointer',
                            textDecoration: 'underline',
                          }}
                        >
                          Lihat Full Detail JSON & Stack Trace →
                        </button>
                      </div>
                    )}
                  </div>
                )
              })
            )}
            <div ref={consoleEndRef} />
          </div>
        </div>
      )}

      {/* TAB 2: SECURITY AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--line)', fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconChecklist size={18} color="var(--green-600)" /> Security Audit Trail ({auditTotal} catatan log)
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
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--ink-soft)' }}>
                    Belum ada catatan log aktivitas audit.
                  </td>
                </tr>
              ) : (
                auditLogs.map((l) => (
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
      )}

      {/* TAB 3: HEALTH DIAGNOSTICS */}
      {activeTab === 'health' && health && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '8px', padding: '24px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.05rem', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconCode size={20} color="var(--green-600)" /> Environment &amp; Diagnostics Server
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div style={diagCardStyle}>
              <div style={diagTitleStyle}>Sistem Operasi &amp; Python</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--ink)' }}>{health.os_platform}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>Python {health.python_version.split(' ')[0]}</div>
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

      {/* Modal Detail JSON / Stack Trace */}
      {selectedLogDetail && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            padding: '16px',
          }}
          onClick={() => setSelectedLogDetail(null)}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '12px',
              maxWidth: '720px',
              width: '100%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.95rem' }}>
                Log #{selectedLogDetail.id} — [{selectedLogDetail.level}] [{selectedLogDetail.category}]
              </div>
              <button
                type="button"
                onClick={() => setSelectedLogDetail(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Content Drawer */}
            <div style={{ padding: '20px', overflowY: 'auto', color: '#f8fafc', fontSize: '0.85rem' }}>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ color: '#94a3b8' }}>Pesan: </span>
                <strong style={{ color: selectedLogDetail.level === 'ERROR' ? '#fca5a5' : '#f8fafc' }}>
                  {selectedLogDetail.message}
                </strong>
              </div>

              <div style={{ marginBottom: '16px', fontSize: '0.78rem', color: '#94a3b8' }}>
                Sumber: <code>{selectedLogDetail.source}</code> | Waktu: {new Date(selectedLogDetail.timestamp).toLocaleString('id-ID')}
              </div>

              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
                Detail Data JSON / Stack Trace:
              </div>

              <pre
                style={{
                  background: '#020617',
                  border: '1px solid #1e293b',
                  borderRadius: '6px',
                  padding: '14px',
                  color: '#e2e8f0',
                  fontSize: '0.78rem',
                  lineHeight: 1.5,
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {JSON.stringify(selectedLogDetail.detail, null, 2)}
              </pre>
            </div>

            {/* Footer Modal */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSelectedLogDetail(null)}
                className="btn btn--outline btn--sm"
                style={{ color: '#f8fafc', borderColor: '#475569' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
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

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'var(--ink)',
  marginBottom: '4px',
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
