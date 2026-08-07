import type { PklContext } from '@/types/pkl'

interface DocumentOutlineProps {
  ctx: PklContext
  activeSectionKey?: string
  onSelectSection?: (key: string) => void
}

interface OutlineItem {
  id: string
  title: string
  pageNumber?: string
  status: 'ready' | 'drafted' | 'missing' | 'auto'
}

interface OutlineGroup {
  groupTitle: string
  items: OutlineItem[]
}

export default function DocumentOutline({ ctx, activeSectionKey, onSelectSection }: DocumentOutlineProps) {
  const babModules = ctx.config?.bab_modules || []
  const genSections = ctx.generated_sections || {}

  const isFilled = (val?: string | string[]) => {
    if (!val) return false
    if (Array.isArray(val)) return val.length > 0
    return val.trim().length > 0
  }

  const getSectionStatus = (key: string): 'ready' | 'drafted' | 'missing' => {
    if (isFilled(genSections[key])) return 'ready'
    return 'missing'
  }

  const groups: OutlineGroup[] = [
    {
      groupTitle: 'Halaman Depan (Front Matter)',
      items: [
        { id: 'cover', title: 'Cover Luar & Cover Dalam', status: 'auto' },
        { id: 'pengesahan', title: 'Halaman Pengesahan', status: 'auto' },
        { id: 'identitas', title: 'Identitas Siswa & Perusahaan', status: ctx.siswa.nama && ctx.perusahaan.nama ? 'ready' : 'missing' },
        { id: 'kata_pengantar', title: 'Kata Pengantar', status: ctx.kata_pengantar?.ucapan_syukur ? 'ready' : 'missing' },
        { id: 'daftar_isi', title: 'Daftar Isi & Daftar Tabel', status: 'auto' },
      ],
    },
  ]

  // BAB I
  if (babModules.includes('PENDAHULUAN')) {
    groups.push({
      groupTitle: 'BAB I: PENDAHULUAN',
      items: [
        { id: 'latar_belakang', title: '1.1 Latar Belakang', status: getSectionStatus('latar_belakang') },
        { id: 'tujuan_pkl', title: '1.2 Tujuan PKL', status: getSectionStatus('tujuan_pkl') },
        { id: 'profil_sejarah', title: '1.3 Sejarah Singkat Perusahaan', status: getSectionStatus('profil_sejarah') },
        { id: 'narasi_struktur', title: '1.5 Narasi Struktur Organisasi', status: getSectionStatus('narasi_struktur') },
      ],
    })
  }

  // BAB II
  if (babModules.includes('PROFIL_PERUSAHAAN')) {
    groups.push({
      groupTitle: 'BAB II: PROFIL PERUSAHAAN',
      items: [
        { id: 'profil_perusahaan', title: 'Profil & Jam Kerja Industri', status: ctx.profil_perusahaan?.visi ? 'ready' : 'missing' },
      ],
    })
  }

  // BAB III
  if (babModules.includes('LANDASAN_TEORI') || babModules.includes('TINJAUAN_PUSTAKA')) {
    groups.push({
      groupTitle: 'BAB III: LANDASAN TEORI',
      items: [
        { id: 'landasan_teori', title: 'Landasan Teori Industri', status: getSectionStatus('landasan_teori') },
      ],
    })
  }

  // BAB IV
  if (babModules.includes('PELAKSANAAN') || babModules.includes('KEGIATAN_INDUSTRI') || babModules.includes('DATA_PENGAMATAN')) {
    const kegItems: OutlineItem[] = (ctx.kegiatan || []).map((k) => ({
      id: `kegiatan_${(k.bidang || '').toLowerCase().replace(/\s+/g, '_')}_intro`,
      title: `Kegiatan: ${k.bidang || 'Utama'}`,
      status: getSectionStatus(`kegiatan_${(k.bidang || '').toLowerCase().replace(/\s+/g, '_')}_intro`),
    }))
    if (ctx.studi_kasus?.judul) {
      kegItems.push({
        id: 'studi_kasus_proses',
        title: `Studi Kasus: ${ctx.studi_kasus.judul}`,
        status: getSectionStatus('studi_kasus_proses'),
      })
    }
    groups.push({
      groupTitle: 'BAB IV: PELAKSANAAN & KEGIATAN',
      items: kegItems.length > 0 ? kegItems : [{ id: 'pelaksanaan', title: 'Jurnal & Foto Kegiatan', status: 'missing' }],
    })
  }

  // BAB V
  if (babModules.includes('PEMBAHASAN')) {
    groups.push({
      groupTitle: 'BAB V: PEMBAHASAN & ANALISIS',
      items: [
        { id: 'pembahasan', title: 'Pembahasan & Analisis Pekerjaan', status: getSectionStatus('pembahasan') },
      ],
    })
  }

  // BAB VI
  if (babModules.includes('PENUTUP') || babModules.includes('KESIMPULAN_SARAN')) {
    groups.push({
      groupTitle: 'BAB VI: PENUTUP',
      items: [
        { id: 'kesimpulan_saran', title: 'Kesimpulan dan Saran', status: getSectionStatus('kesimpulan_saran') },
      ],
    })
  }

  // Back Matter
  groups.push({
    groupTitle: 'Lampiran & Dokumentasi',
    items: [
      { id: 'daftar_pustaka', title: 'Daftar Pustaka', status: ctx.daftar_pustaka && ctx.daftar_pustaka.length > 0 ? 'ready' : 'auto' },
      { id: 'lampiran', title: 'Lampiran Foto & Sertifikat', status: ctx.assets && ctx.assets.length > 0 ? 'ready' : 'missing' },
    ],
  })

  return (
    <div
      style={{
        border: '1px solid var(--line, #ddd6c8)',
        borderRadius: '10px',
        backgroundColor: 'var(--surface, #fffdf8)',
        padding: '1.1rem 1.2rem',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.05rem', fontFamily: 'var(--font-serif)' }}>
        Struktur Fisik Laporan Word
      </h3>
      <p className="muted" style={{ fontSize: '0.8rem', margin: '0 0 1rem', lineHeight: 1.4 }}>
        Urutan bagian laporan sesuai template resmi Word SMKN 4 Bandar Lampung:
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {groups.map((grp, gIdx) => (
          <div key={gIdx}>
            <div
              style={{
                fontSize: '0.76rem',
                fontWeight: 700,
                color: 'var(--green-700, #14614a)',
                letterSpacing: '0.04em',
                marginBottom: '0.4rem',
                textTransform: 'uppercase',
              }}
            >
              {grp.groupTitle}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingLeft: '0.25rem' }}>
              {grp.items.map((item) => {
                const isActive = activeSectionKey === item.id
                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectSection && onSelectSection(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.35rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      backgroundColor: isActive ? 'var(--green-100, #e2efe7)' : 'transparent',
                      color: isActive ? 'var(--green-700, #14614a)' : 'var(--ink, #262521)',
                      fontWeight: isActive ? 600 : 400,
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '0.4rem' }}>
                      {item.title}
                    </span>

                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                        ...(item.status === 'ready'
                          ? { background: 'var(--green-100, #e2efe7)', color: 'var(--green-700, #14614a)' }
                          : item.status === 'auto'
                          ? { background: 'var(--paper-2, #ece8de)', color: 'var(--ink-soft, #6d675c)' }
                          : { background: 'var(--amber-100, #f6ead0)', color: 'var(--amber-700, #92610c)' }),
                      }}
                    >
                      {item.status === 'ready' ? 'Siap ✓' : item.status === 'auto' ? 'Otomatis' : 'Belum'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
