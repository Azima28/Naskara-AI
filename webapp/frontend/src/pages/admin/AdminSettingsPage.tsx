import React, { useEffect, useState } from 'react'
import { getSystemSettings, updateSystemSettings } from '@/api/client'
import type { SystemConfigData } from '@/types/api'
import NotificationModal from '@/components/common/NotificationModal'
import {
  IconBuilding,
  IconCheck,
  IconChecklist,
  IconGear,
  IconUser,
} from '@/components/common/Icons'

const JURUSAN_KEYS = ['rpl', 'tkj', 'bdp', 'akl', 'mp', 'tb']
const JURUSAN_LABELS: Record<string, string> = {
  rpl: 'Rekayasa Perangkat Lunak (RPL)',
  tkj: 'Teknik Komputer & Jaringan (TKJ)',
  bdp: 'Bisnis Daring & Pemasaran (BDP)',
  akl: 'Akuntansi & Keuangan Lembaga (AKL)',
  mp: 'Manajemen Perkantoran & Layanan Bisnis (MPLB)',
  tb: 'Tata Boga (TB)',
}

const DEFAULT_SETTINGS: SystemConfigData = {
  school_name: 'SMK Negeri 4 Bandar Lampung',
  school_name_full: 'SMK Negeri 4 Bandar Lampung',
  alamat: 'Jl. HOS Cokroaminoto No. 102, Enggal, Bandar Lampung',
  kota: 'Bandar Lampung',
  telp: '(0721) 262637',
  email: 'smkn4bl@yahoo.co.id',
  website: 'https://smkn4-bdl.sch.id',
  kop_baris_1: 'PEMERINTAH PROVINSI LAMPUNG',
  kop_baris_2: 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
  kop_baris_3: 'SMK NEGERI 4 BANDAR LAMPUNG',
  npsn: '10807215',
  nss: '401126003028',
  kepala_sekolah: 'HJ. Dewi Ningsih, S.Pd., M.Pd.',
  nip_kepala_sekolah: '19750312 200312 2 004',
  waka_humas: 'Mas Azizah, M.Pd',
  nip_waka_humas: '19781015 200902 2 001',
  pembimbing_sekolah: 'Siti Rahma, S.Pd.',
  nip_pembimbing_sekolah: '19820101 200701 2 011',
  pejabat_jurusan: {
    rpl: { nama: 'Rudi Hartono, S.Kom.', nip: '19850514 201001 1 009' },
    tkj: { nama: 'Ahmad Fauzi, S.T.', nip: '19830311 200801 1 005' },
    bdp: { nama: 'Siti Maryam, S.E.', nip: '19810722 200604 2 003' },
    akl: { nama: 'Dra. Nurhayati', nip: '19760415 200212 2 002' },
    mp: { nama: 'Hendra Wijaya, S.Pd.', nip: '19840910 200903 1 007' },
    tb: { nama: 'Dewi Sartika, S.Pd.', nip: '19871105 201101 2 008' },
  },
  ai_model_default: 'deepseek-opencode',
  ai_max_tokens_per_req: 2048,
}

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<SystemConfigData>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<{ title: string; message: string; type: 'success' | 'error' } | null>(null)

  const loadSettings = async () => {
    setLoading(true)
    try {
      const res = await getSystemSettings()
      if (res.data) {
        setConfig({
          ...DEFAULT_SETTINGS,
          ...res.data,
          pejabat_jurusan: {
            ...DEFAULT_SETTINGS.pejabat_jurusan,
            ...(res.data.pejabat_jurusan || {}),
          },
        })
      }
    } catch (err: any) {
      setNotice({ title: 'Error', message: err?.response?.data?.detail || 'Gagal memuat pengaturan terpusat.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await updateSystemSettings(config)
      setNotice({ title: 'Pengaturan Disimpan', message: res.message, type: 'success' })
    } catch (err: any) {
      setNotice({ title: 'Error', message: err?.response?.data?.detail || 'Gagal menyimpan pengaturan.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleKetuaKkChange = (jurusanKey: string, field: 'nama' | 'nip', value: string) => {
    setConfig((prev) => {
      const currentPejabat = prev.pejabat_jurusan[jurusanKey] || { nama: '', nip: '' }
      return {
        ...prev,
        pejabat_jurusan: {
          ...prev.pejabat_jurusan,
          [jurusanKey]: { ...currentPejabat, [field]: value },
        },
      }
    })
  }

  if (loading) {
    return <div style={{ color: 'var(--ink-soft)', padding: '24px' }}>Memuat pengaturan terpusat...</div>
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--ink)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconGear size={24} color="var(--green-600)" /> Pengaturan Template Sekolah &amp; AI Config
        </h1>
        <p style={{ color: 'var(--ink-soft)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
          Konfigurasi terpusat identitas resmi sekolah, Kop Surat, NIP Pejabat Utama &amp; Ketua KK per jurusan, serta parameter AI Engine.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Section 1: Identitas Resmi Sekolah & Kop Surat */}
        <div style={sectionBoxStyle}>
          <h3 style={sectionHeaderStyle}>
            <IconBuilding size={20} color="var(--green-600)" /> Identitas Resmi Sekolah &amp; Kop Surat
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Nama Singkat Sekolah</label>
              <input
                type="text"
                required
                value={config.school_name}
                onChange={(e) => setConfig({ ...config, school_name: e.target.value })}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Nama Lengkap Sekolah</label>
              <input
                type="text"
                required
                value={config.school_name_full || config.school_name}
                onChange={(e) => setConfig({ ...config, school_name_full: e.target.value })}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '12px' }}>
            <div>
              <label style={labelStyle}>Alamat Lengkap Sekolah</label>
              <input
                type="text"
                required
                value={config.alamat}
                onChange={(e) => setConfig({ ...config, alamat: e.target.value })}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Kota Sekolah</label>
              <input
                type="text"
                required
                value={config.kota || 'Bandar Lampung'}
                onChange={(e) => setConfig({ ...config, kota: e.target.value })}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '12px' }}>
            <div>
              <label style={labelStyle}>Telepon Sekolah</label>
              <input
                type="text"
                value={config.telp || ''}
                onChange={(e) => setConfig({ ...config, telp: e.target.value })}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Email Resmi Sekolah</label>
              <input
                type="email"
                value={config.email || ''}
                onChange={(e) => setConfig({ ...config, email: e.target.value })}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Website Resmi Sekolah</label>
              <input
                type="text"
                value={config.website || ''}
                onChange={(e) => setConfig({ ...config, website: e.target.value })}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Sub-header Kop Surat */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: 'var(--ink)' }}>Susunan Kop Surat Pengesahan</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Kop Baris 1 (Pemerintah/Provinsi)</label>
                <input
                  type="text"
                  required
                  value={config.kop_baris_1 || 'PEMERINTAH PROVINSI LAMPUNG'}
                  onChange={(e) => setConfig({ ...config, kop_baris_1: e.target.value })}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Kop Baris 2 (Dinas Pendidikan)</label>
                <input
                  type="text"
                  required
                  value={config.kop_baris_2 || 'DINAS PENDIDIKAN DAN KEBUDAYAAN'}
                  onChange={(e) => setConfig({ ...config, kop_baris_2: e.target.value })}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Kop Baris 3 (Nama Sekolah Uppercase)</label>
                <input
                  type="text"
                  required
                  value={config.kop_baris_3 || 'SMK NEGERI 4 BANDAR LAMPUNG'}
                  onChange={(e) => setConfig({ ...config, kop_baris_3: e.target.value })}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '12px' }}>
              <div>
                <label style={labelStyle}>NPSN Sekolah</label>
                <input
                  type="text"
                  required
                  value={config.npsn}
                  onChange={(e) => setConfig({ ...config, npsn: e.target.value })}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={labelStyle}>NSS Sekolah (Nomor Statistik)</label>
                <input
                  type="text"
                  value={config.nss || ''}
                  onChange={(e) => setConfig({ ...config, nss: e.target.value })}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Key School Officials */}
        <div style={sectionBoxStyle}>
          <h3 style={sectionHeaderStyle}>
            <IconUser size={20} color="var(--green-600)" /> Pejabat Utama Sekolah
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Nama Kepala Sekolah &amp; Gelar</label>
              <input
                type="text"
                required
                value={config.kepala_sekolah}
                onChange={(e) => setConfig({ ...config, kepala_sekolah: e.target.value })}
                className="form-input"
                style={{ width: '100%' }}
              />
              <label style={{ ...labelStyle, marginTop: '8px' }}>NIP Kepala Sekolah</label>
              <input
                type="text"
                required
                value={config.nip_kepala_sekolah}
                onChange={(e) => setConfig({ ...config, nip_kepala_sekolah: e.target.value })}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={labelStyle}>Nama Waka Humas &amp; Gelar</label>
              <input
                type="text"
                required
                value={config.waka_humas}
                onChange={(e) => setConfig({ ...config, waka_humas: e.target.value })}
                className="form-input"
                style={{ width: '100%' }}
              />
              <label style={{ ...labelStyle, marginTop: '8px' }}>NIP Waka Humas</label>
              <input
                type="text"
                required
                value={config.nip_waka_humas}
                onChange={(e) => setConfig({ ...config, nip_waka_humas: e.target.value })}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={labelStyle}>Nama Pembimbing Sekolah Global &amp; Gelar</label>
              <input
                type="text"
                value={config.pembimbing_sekolah || ''}
                onChange={(e) => setConfig({ ...config, pembimbing_sekolah: e.target.value })}
                className="form-input"
                style={{ width: '100%' }}
              />
              <label style={{ ...labelStyle, marginTop: '8px' }}>NIP Pembimbing Sekolah</label>
              <input
                type="text"
                value={config.nip_pembimbing_sekolah || ''}
                onChange={(e) => setConfig({ ...config, nip_pembimbing_sekolah: e.target.value })}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Ketua Program Keahlian (KK) Per Jurusan */}
        <div style={sectionBoxStyle}>
          <h3 style={sectionHeaderStyle}>
            <IconChecklist size={20} color="var(--green-600)" /> Ketua Program Keahlian (Ketua KK) Per Jurusan
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {JURUSAN_KEYS.map((key) => {
              const p = config.pejabat_jurusan[key] || { nama: '', nip: '' }
              return (
                <div key={key} style={{ background: 'var(--paper)', padding: '12px', borderRadius: '6px', border: '1px solid var(--line)' }}>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--ink)' }}>{JURUSAN_LABELS[key]}</strong>
                  <div style={{ marginTop: '8px' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', display: 'block', marginBottom: '2px' }}>Nama Ketua KK &amp; Gelar</label>
                    <input
                      type="text"
                      placeholder="Nama Ketua KK"
                      value={p.nama}
                      onChange={(e) => handleKetuaKkChange(key, 'nama', e.target.value)}
                      className="form-input"
                      style={{ width: '100%', fontSize: '0.8rem', marginBottom: '6px' }}
                    />
                    <label style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', display: 'block', marginBottom: '2px' }}>NIP Ketua KK</label>
                    <input
                      type="text"
                      placeholder="NIP Ketua KK"
                      value={p.nip}
                      onChange={(e) => handleKetuaKkChange(key, 'nip', e.target.value)}
                      className="form-input"
                      style={{ width: '100%', fontSize: '0.8rem' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Section 4: AI Model Config */}
        <div style={sectionBoxStyle}>
          <h3 style={sectionHeaderStyle}>
            <IconGear size={20} color="var(--green-600)" /> Parameter AI Engine &amp; Limit Token
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Default AI Model</label>
              <input
                type="text"
                required
                value={config.ai_model_default}
                onChange={(e) => setConfig({ ...config, ai_model_default: e.target.value })}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Max Output Tokens Per Request</label>
              <input
                type="number"
                required
                value={config.ai_max_tokens_per_req}
                onChange={(e) => setConfig({ ...config, ai_max_tokens_per_req: parseInt(e.target.value) || 2048 })}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button type="submit" disabled={saving} className="btn btn--primary btn--lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <IconCheck size={16} /> {saving ? 'Menyimpan...' : 'Simpan Seluruh Pengaturan Terpusat'}
          </button>
        </div>
      </form>

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

const sectionBoxStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: '8px',
  padding: '24px',
  marginBottom: '24px',
}

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: '1.05rem',
  fontWeight: 700,
  color: 'var(--ink)',
  marginTop: 0,
  marginBottom: '16px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: 'var(--ink-soft)',
  marginBottom: '4px',
}
