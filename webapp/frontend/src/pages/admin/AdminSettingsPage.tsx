import React, { useEffect, useState } from 'react'
import {
  getSystemSettings,
  updateSystemSettings,
  getAiModels,
  setActiveAiModel,
  addAiModel,
  testAiConnection,
} from '@/api/client'
import type { SystemConfigData } from '@/types/api'
import NotificationModal from '@/components/common/NotificationModal'
import {
  IconBuilding,
  IconCheck,
  IconChecklist,
  IconGear,
  IconUser,
  IconSparkles,
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
  enable_ai_security_filter: true,
  ai_base_url: 'http://127.0.0.1:20128/v1',
  ai_model_default: 'deepseek-opencode',
  ai_model_endpoints: {
    'deepseek-opencode': 'http://127.0.0.1:20128/v1',
    'gemini': 'http://127.0.0.1:20128/v1',
  },
  ai_max_tokens_per_req: 2048,
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'school' | 'ai'>('school')
  const [config, setConfig] = useState<SystemConfigData>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<{ title: string; message: string; type: 'success' | 'error' } | null>(null)

  // AI model management state
  const [availableModels, setAvailableModels] = useState<string[]>(['deepseek-opencode', 'gemini'])
  const [selectedModel, setSelectedModel] = useState<string>('deepseek-opencode')
  const [newModelName, setNewModelName] = useState<string>('')
  const [addingModel, setAddingModel] = useState<boolean>(false)
  const [testingAi, setTestingAi] = useState<boolean>(false)
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string } | null>(null)

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
        if (res.data.ai_model_default) {
          setSelectedModel(res.data.ai_model_default)
        }
      }

      // Fetch AI models list
      const modelsRes = await getAiModels()
      if (modelsRes.available_models) {
        setAvailableModels(modelsRes.available_models)
      }
      if (modelsRes.active_model) {
        setSelectedModel(modelsRes.active_model)
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

  const handleSubmitSchoolSettings = async (e: React.FormEvent) => {
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

  const handleModelEndpointChange = (modelName: string, url: string) => {
    setConfig((prev) => {
      const currentEndpoints = prev.ai_model_endpoints || {}
      return {
        ...prev,
        ai_model_endpoints: {
          ...currentEndpoints,
          [modelName]: url,
        },
      }
    })
  }

  const handleSelectActiveModel = async (modelName: string) => {
    setSelectedModel(modelName)
    setConfig((prev) => ({ ...prev, ai_model_default: modelName }))
    try {
      await setActiveAiModel(modelName)
      await updateSystemSettings({ ...config, ai_model_default: modelName })
      setNotice({ title: 'Model AI Berhasil Diubah', message: `Model AI aktif sistem diubah menjadi '${modelName}'.`, type: 'success' })
    } catch (err: any) {
      setNotice({ title: 'Error', message: err?.response?.data?.detail || 'Gagal mengubah model AI aktif.', type: 'error' })
    }
  }

  const handleAddNewModel = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newModelName.trim()
    if (!trimmed) return

    setAddingModel(true)
    try {
      const res = await addAiModel(trimmed)
      if (res.available_models) {
        setAvailableModels(res.available_models)
      } else if (!availableModels.includes(trimmed)) {
        setAvailableModels([...availableModels, trimmed])
      }
      setSelectedModel(trimmed)
      setConfig((prev) => ({ ...prev, ai_model_default: trimmed }))
      await setActiveAiModel(trimmed)
      setNewModelName('')
      setNotice({ title: 'Model AI Ditambahkan', message: `Model AI '${trimmed}' berhasil ditambahkan dan dijadikan model aktif.`, type: 'success' })
    } catch (err: any) {
      setNotice({ title: 'Error', message: err?.response?.data?.detail || 'Gagal menambahkan model AI baru.', type: 'error' })
    } finally {
      setAddingModel(false)
    }
  }

  const handleTestConnection = async () => {
    setTestingAi(true)
    setAiTestResult(null)
    try {
      const res = await testAiConnection()
      setAiTestResult({ success: true, message: res.message || 'Koneksi ke AI Provider Berhasil' })
    } catch (err: any) {
      setAiTestResult({ success: false, message: err?.response?.data?.detail || 'Gagal terhubung ke AI Provider. Pastikan server AI aktif.' })
    } finally {
      setTestingAi(false)
    }
  }

  if (loading) {
    return <div style={{ color: 'var(--ink-soft)', padding: '24px' }}>Memuat pengaturan terpusat...</div>
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--ink)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconGear size={24} color="var(--green-600)" /> Pengaturan Sistem Terpusat
        </h1>
        <p style={{ color: 'var(--ink-soft)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
          Kelola konfigurasi resmi sekolah, Kop Surat pengesahan, pejabat jurusan, dan preferensi AI Engine.
        </p>
      </div>

      {/* Tab Bar Navigation */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid var(--line)' }}>
        <button
          type="button"
          onClick={() => setActiveTab('school')}
          style={{
            padding: '10px 18px',
            fontSize: '0.9rem',
            fontWeight: 700,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: activeTab === 'school' ? 'var(--green-700)' : 'var(--ink-soft)',
            borderBottom: activeTab === 'school' ? '3px solid var(--green-600)' : '3px solid transparent',
            marginBottom: '-2px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <IconBuilding size={18} /> Template &amp; Identitas Sekolah
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ai')}
          style={{
            padding: '10px 18px',
            fontSize: '0.9rem',
            fontWeight: 700,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: activeTab === 'ai' ? 'var(--green-700)' : 'var(--ink-soft)',
            borderBottom: activeTab === 'ai' ? '3px solid var(--green-600)' : '3px solid transparent',
            marginBottom: '-2px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <IconSparkles size={18} /> Pengaturan AI Engine
        </button>
      </div>

      {/* TAB 1: TEMPLATE & IDENTITAS SEKOLAH */}
      {activeTab === 'school' && (
        <form onSubmit={handleSubmitSchoolSettings}>
          {/* Section 1: Identitas Resmi Sekolah & Kop Surat */}
          <div style={sectionBoxStyle}>
            <h3 style={sectionHeaderStyle}>
              <IconBuilding size={20} color="var(--green-600)" /> Identitas Resmi Sekolah &amp; Alamat
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

          {/* Save Bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="submit" disabled={saving} className="btn btn--primary btn--lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <IconCheck size={16} /> {saving ? 'Menyimpan...' : 'Simpan Identitas Sekolah'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: PENGATURAN AI ENGINE */}
      {activeTab === 'ai' && (
        <div>
          {/* Information Banner */}
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', color: '#166534', fontWeight: 700 }}>
              Konfigurasi Model AI Engine
            </h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#15803d', lineHeight: 1.5 }}>
              Pengaturan ini digunakan untuk menentukan model kecerdasan buatan (*AI Model*) yang dipakai oleh sistem untuk menyusun draf naskah laporan PKL, merapikan profil perusahaan, dan mengurai cerita kegiatan siswa.
            </p>
          </div>

          {/* 1. Model AI Utama Sistem */}
          <div style={sectionBoxStyle}>
            <h3 style={sectionHeaderStyle}>
              <IconSparkles size={20} color="var(--green-600)" /> Model AI Aktif Sistem
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', marginTop: 0, marginBottom: '16px' }}>
              Pilih model AI utama yang akan digunakan secara default saat membuat naskah laporan.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <select
                value={selectedModel}
                onChange={(e) => handleSelectActiveModel(e.target.value)}
                className="form-input"
                style={{ minWidth: '260px', fontWeight: 700, fontSize: '0.9rem', padding: '8px 12px' }}
              >
                {availableModels.map((m) => (
                  <option key={m} value={m}>
                    {m === 'deepseek-opencode' ? 'DeepSeek OpenCode' : m === 'gemini' ? 'Gemini (Port 20128)' : m}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '0.85rem', color: 'var(--green-700)', fontWeight: 600 }}>
                Status: Model '{selectedModel}' Aktif
              </span>
            </div>
          </div>

          {/* 2. Tambah Model AI Baru */}
          <div style={sectionBoxStyle}>
            <h3 style={sectionHeaderStyle}>
              <IconGear size={20} color="var(--green-600)" /> Tambah Model AI Baru
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', marginTop: 0, marginBottom: '16px' }}>
              Tambahkan ID model AI baru yang kompatibel dengan endpoint OpenAI API (contoh: <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>gemini</code>, <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>llama3</code>, <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>gpt-4o-mini</code>).
            </p>
            <form onSubmit={handleAddNewModel} style={{ display: 'flex', gap: '10px', maxWidth: '520px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Masukkan ID model AI (contoh: gemini)"
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                className="form-input"
                style={{ flex: 1, minWidth: '220px' }}
              />
              <button
                type="submit"
                disabled={addingModel || !newModelName.trim()}
                className="btn btn--primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <IconCheck size={16} /> {addingModel ? 'Menyimpan...' : 'Tambah Model'}
              </button>
            </form>

            <div style={{ marginTop: '20px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.88rem', color: 'var(--ink)' }}>Daftar Model Terdaftar di Sistem:</h4>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {availableModels.map((m) => {
                  const isActive = m === selectedModel
                  return (
                    <div
                      key={m}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        background: isActive ? '#dcfce7' : '#f1f5f9',
                        border: isActive ? '1px solid #86efac' : '1px solid #cbd5e1',
                        color: isActive ? '#166534' : '#475569',
                      }}
                    >
                      {m === 'deepseek-opencode' ? 'DeepSeek OpenCode' : m === 'gemini' ? 'Gemini (Port 20128)' : m}
                      {isActive && <span style={{ marginLeft: '6px', fontWeight: 800 }}>(Aktif)</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 3. Filter Keamanan AI & Guardrail Switch */}
          <div style={sectionBoxStyle}>
            <h3 style={sectionHeaderStyle}>
              <IconCheck size={20} color="var(--green-600)" /> Filter Keamanan &amp; Relevansi AI (Guardrail Anti-Injection)
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', marginTop: 0, marginBottom: '16px' }}>
              Aktifkan saringan keamanan untuk memblokir secara otomatis teks manipulasi sistem (prompt injection) dan pertanyaan obrolan santai di luar draf Laporan PKL SMK.
            </p>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
              <div>
                <strong style={{ fontSize: '0.9rem', color: 'var(--ink)', display: 'block', marginBottom: '4px' }}>
                  Status Filter Keamanan &amp; Relevansi: {config.enable_ai_security_filter !== false ? '🟢 AKTIF' : '⚪ NON-AKTIF'}
                </strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--ink-soft)' }}>
                  {config.enable_ai_security_filter !== false
                    ? 'Sistem secara aktif memproteksi prompt injection dan mengarahkan teks ngawur siswa ke petunjuk perbaikan.'
                    : '🔴 PERINGATAN: Filter keamanan dinonaktifkan. AI akan memproses semua input tanpa saringan pre-sanitization.'}
                </span>
              </div>

              <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', gap: '10px', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={config.enable_ai_security_filter !== false}
                  onChange={(e) => {
                    const newValue = e.target.checked
                    setConfig((prev) => ({ ...prev, enable_ai_security_filter: newValue }))
                  }}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--green-600)' }}
                />
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: config.enable_ai_security_filter !== false ? 'var(--green-700)' : '#64748b' }}>
                  {config.enable_ai_security_filter !== false ? 'Filter Aktif' : 'Filter Non-Aktif'}
                </span>
              </label>
            </div>
          </div>

          {/* 4. Endpoint URL, Limit Token & Uji Koneksi */}
          <div style={sectionBoxStyle}>
            <h3 style={sectionHeaderStyle}>
              <IconGear size={20} color="var(--green-600)" /> Endpoint URL &amp; Parameter AI Engine
            </h3>

            <form onSubmit={handleSubmitSchoolSettings}>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>URL Base Endpoint AI Default Global (Fallback Port &amp; Protocol)</label>
                <input
                  type="text"
                  required
                  placeholder="http://127.0.0.1:20128/v1"
                  value={config.ai_base_url || 'http://127.0.0.1:20128/v1'}
                  onChange={(e) => setConfig({ ...config, ai_base_url: e.target.value })}
                  className="form-input"
                  style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.9rem' }}
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: '4px', display: 'block' }}>
                  Endpoint default utama untuk semua model AI jika tidak dikustomisasi secara khusus (default: <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: '3px' }}>http://127.0.0.1:20128/v1</code>).
                </span>
              </div>

              {/* Sub-section: Custom Endpoint per Model */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--ink)', fontWeight: 700 }}>
                  Custom Base URL Endpoint Per Model AI
                </h4>
                <p style={{ margin: '0 0 14px 0', fontSize: '0.8rem', color: 'var(--ink-soft)' }}>
                  Atur URL port &amp; protocol khusus untuk masing-masing model. Misal: <code style={{ background: '#e2e8f0', padding: '1px 4px', borderRadius: '3px' }}>deepseek-opencode</code> ➔ Port 20128, <code style={{ background: '#e2e8f0', padding: '1px 4px', borderRadius: '3px' }}>gemini</code> ➔ Port 20129.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
                  {availableModels.map((m) => {
                    const customUrl = (config.ai_model_endpoints || {})[m] || ''
                    const hasCustom = Boolean(customUrl && customUrl.trim())
                    return (
                      <div key={m} style={{ background: '#ffffff', border: '1px solid var(--line)', borderRadius: '6px', padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <strong style={{ fontSize: '0.85rem', color: 'var(--ink)' }}>{m}</strong>
                          <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, background: hasCustom ? '#dbeafe' : '#f1f5f9', color: hasCustom ? '#1e40af' : '#64748b' }}>
                            {hasCustom ? '🔵 Custom Endpoint' : '↩️ Default Fallback'}
                          </span>
                        </div>
                        <input
                          type="text"
                          placeholder={config.ai_base_url || 'http://127.0.0.1:20128/v1'}
                          value={customUrl}
                          onChange={(e) => handleModelEndpointChange(m, e.target.value)}
                          className="form-input"
                          style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.82rem' }}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
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

                <div>
                  <label style={labelStyle}>Uji Koneksi AI Engine</label>
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingAi}
                    className="btn btn--outline"
                    style={{ marginTop: '4px', width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <IconSparkles size={16} /> {testingAi ? 'Menguji Koneksi...' : 'Jalankan Diagnostic Test AI'}
                  </button>
                </div>
              </div>

              {/* Save Bar */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="submit" disabled={saving} className="btn btn--primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <IconCheck size={16} /> {saving ? 'Menyimpan...' : 'Simpan Pengaturan AI Engine'}
                </button>
              </div>
            </form>

            {aiTestResult && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  background: aiTestResult.success ? '#f0fdf4' : '#fef2f2',
                  border: aiTestResult.success ? '1px solid #bbf7d0' : '1px solid #fecaca',
                  color: aiTestResult.success ? '#166534' : '#991b1b',
                }}
              >
                {aiTestResult.success ? '✓' : '⚠️'} {aiTestResult.message}
              </div>
            )}
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
  color: 'var(--ink)',
  marginBottom: '6px',
}
