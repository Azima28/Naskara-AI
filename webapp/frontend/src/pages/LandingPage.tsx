import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PublicNavbar from '@/components/layout/PublicNavbar'
import Footer from '@/components/layout/Footer'
import { useAuth } from '@/store/auth'
import {
  IconSparkles,
  IconRocket,
  IconDocument,
  IconShield,
  IconLightning,
  IconPencil,
} from '@/components/common/Icons'

export default function LandingPage() {
  const { token, user } = useAuth()
  const nav = useNavigate()
  const [previewTab, setPreviewTab] = useState<'cover' | 'identitas' | 'bab1'>('cover')

  const handleStartReport = () => {
    if (!token || !user) {
      nav('/login')
      return
    }
    nav('/dashboard')
  }

  return (
    <div className="landing-layout">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-section__container">
          <div className="hero-section__badge">
            <IconSparkles size={15} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} /> Standar Resmi SMKN 4 Bandar Lampung &amp; Vokasi 2026
          </div>

          <h1 className="hero-section__title">
            Susun Laporan PKL Resmi &amp; Presisi Sesuai Standar Sekolah
          </h1>

          <p className="hero-section__subtitle">
            Buat Laporan PKL <strong>Microsoft Word (.docx) Rapi &amp; Standar Sekolah</strong> otomatis dengan margin 4-4-3-3 cm, penomoran Romawi/Arab presisi, tabel identitas rapi, dan draf AI akurat sesuai data kegiatanmu.
          </p>

          <div className="hero-section__cta-group">
            <button onClick={handleStartReport} className="btn-primary hero-btn-lg">
              <IconRocket size={18} style={{ marginRight: '0.5rem' }} /> Buat Laporan Gratis Sekarang
            </button>
            <Link to="/format-guide" className="btn-outline hero-btn-lg">
              <IconDocument size={18} style={{ marginRight: '0.5rem' }} /> Pelajari Standar Format
            </Link>
          </div>

          {/* Real SMKN 4 Bandar Lampung Interactive Document Preview Mockup */}
          <div className="hero-mockup hero-mockup--animated">
            <div className="hero-mockup__header">
              <div className="hero-mockup__dots">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
              </div>
              <div className="hero-mockup__title-bar">
                Laporan_PKL_SMKN4_Bandar_Lampung_Official.docx (Tampilan Pratinjau Langsung)
              </div>
              <div className="hero-mockup__status-badge">
                Format MS Word (.docx) Standar Sekolah
              </div>
            </div>

            {/* Interactive Section Switcher Tabs */}
            <div className="preview-tab-bar">
              <button
                type="button"
                className={`preview-tab-btn ${previewTab === 'cover' ? 'is-active' : ''}`}
                onClick={() => setPreviewTab('cover')}
              >
                1. Cover Laporan SMKN 4
              </button>
              <button
                type="button"
                className={`preview-tab-btn ${previewTab === 'identitas' ? 'is-active' : ''}`}
                onClick={() => setPreviewTab('identitas')}
              >
                2. Identitas Industri (Tabel 14cm)
              </button>
              <button
                type="button"
                className={`preview-tab-btn ${previewTab === 'bab1' ? 'is-active' : ''}`}
                onClick={() => setPreviewTab('bab1')}
              >
                3. BAB I Pendahuluan (Sub-list a. b.)
              </button>
            </div>

            <div className="hero-mockup__body">
              <div className="doc-page-mockup">
                <div className="doc-page-mockup__margin-line top-left">Margin Kiri 4.0 cm (Jilid)</div>
                <div className="doc-page-mockup__margin-line top-right">Margin Kanan 3.0 cm</div>

                {/* TAB 1: COVER REAL SMKN 4 BANDAR LAMPUNG */}
                {previewTab === 'cover' && (
                  <div className="doc-page-mockup__content preview-fade-in">
                    <div className="doc-heading">LAPORAN PRAKTEK KERJA LAPANGAN</div>
                    <div className="doc-subheading">PADA KANTOR / PERUSAHAAN MITRA PKL</div>
                    <div className="doc-spacing-enter">[ Enter Spacing Otomatis Presisi - Push Footer ]</div>

                    <div className="doc-logo-box">
                      <img
                        src="/logo_smkn4.jpeg"
                        alt="Logo SMKN 4 Bandar Lampung"
                        className="smkn4-logo-preview"
                        onError={(e) => {
                          // Fallback if image fails to load
                          (e.target as HTMLElement).style.display = 'none'
                        }}
                      />
                    </div>

                    <div className="doc-meta-table">
                      <div className="meta-row"><span>Nama Siswa</span><span>: Muhammad Rizky Pratama</span></div>
                      <div className="meta-row"><span>NIS / NISN</span><span>: 212210482 / 0054819283</span></div>
                      <div className="meta-row"><span>Kelas</span><span>: XII [Jurusan Kamu]</span></div>
                      <div className="meta-row"><span>Kompetensi</span><span>: [Nama Kompetensi Keahlian Kamu]</span></div>
                    </div>

                    <div className="doc-footer-school">
                      PEMERINTAH PROVINSI LAMPUNG<br />
                      DINAS PENDIDIKAN DAN KEBUDAYAAN<br />
                      SMKN 4 BANDAR LAMPUNG<br />
                      JL. HOST COKROAMINOTO NO. 102 BANDAR LAMPUNG<br />
                      2026
                    </div>

                    <div className="doc-page-mockup__page-num">
                      Nomor Halaman: Tanpa Nomor Halaman (Halaman Sampul)
                    </div>
                  </div>
                )}

                {/* TAB 2: IDENTITAS INDUSTRI (TABEL LEBAR PERSIS 14.00 CM) */}
                {previewTab === 'identitas' && (
                  <div className="doc-page-mockup__content preview-fade-in">
                    <div className="doc-heading" style={{ fontSize: '1.05rem', marginBottom: '1.25rem' }}>
                      IDENTITAS DUNIA KERJA / INDUSTRI
                    </div>

                    <table className="preview-identitas-table">
                      <tbody>
                        <tr><td style={{ width: '38%' }}>1. Nama Perusahaan / DUDI</td><td style={{ width: '4%' }}>:</td><td>PT. TELEKOMUNIKASI INDONESIA TSK</td></tr>
                        <tr><td>2. Alamat Perusahaan</td><td>:</td><td>Jl. Japati No. 1, Sadang Serang, Bandung</td></tr>
                        <tr><td>3. No. Telepon / Fax</td><td>:</td><td>(022) 4521500</td></tr>
                        <tr><td>4. Nama Pimpinan DUDI</td><td>:</td><td>Ir. H. Budi Santoso, M.T.</td></tr>
                        <tr><td>5. Pembimbing Industri</td><td>:</td><td>Ahmad Fauzi, S.T.</td></tr>
                        <tr><td>6. Divisi / Departemen</td><td>:</td><td>Network &amp; Application Development</td></tr>
                      </tbody>
                    </table>

                    <div className="preview-table-spec-badge">
                      ✓ Tabel Otomatis Rapi &amp; Pas di Kertas A4
                    </div>

                    <div className="doc-page-mockup__page-num" style={{ marginTop: '3rem' }}>
                      Nomor Halaman: iii (Romawi Kecil - Bottom Center)
                    </div>
                  </div>
                )}

                {/* TAB 3: BAB I PENDAHULUAN (SUB-LIST STANDAR a. b. BOLD) */}
                {previewTab === 'bab1' && (
                  <div className="doc-page-mockup__content preview-fade-in" style={{ textAlign: 'left' }}>
                    <div className="doc-heading" style={{ fontSize: '1.1rem' }}>BAB I</div>
                    <div className="doc-heading" style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>PENDAHULUAN</div>

                    <div className="preview-subbab-title">1.1 Latar Belakang</div>
                    <p className="preview-para">
                      Praktek Kerja Lapangan (PKL) merupakan salah satu bentuk penyelenggaraan pendidikan keahlian vokasi yang memadukan secara sistematik dan sinkron antara program pendidikan di sekolah dan program penguasaan keahlian yang diperoleh melalui kegiatan bekerja langsung di dunia kerja.
                    </p>

                    <div className="preview-subbab-title" style={{ marginTop: '1rem' }}>1.2 Tujuan PKL</div>
                    <div className="preview-list">
                      <div className="preview-list-item">
                        <strong>a.</strong> <strong>Penerapan Keahlian Teknis:</strong> Mengaplikasikan teori kompetensi Rekayasa Perangkat Lunak pada proyek pengembangan sistem informasi di PT. Telekomunikasi Indonesia TSK.
                      </div>
                      <div className="preview-list-item">
                        <strong>b.</strong> <strong>Pengembangan Sikap Profesional:</strong> Melatih kedisiplinan, etika kerja industri, serta kemampuan komunikasi tim dalam lingkungan kerja nyata.
                      </div>
                    </div>

                    <div className="doc-page-mockup__page-num" style={{ marginTop: '2rem', textAlign: 'right' }}>
                      Nomor Halaman: 1 (Angka Arab - Top Right)
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics & Social Trust Banner */}
      <section className="trust-banner">
        <div className="trust-banner__container">
          <div className="trust-stat">
            <span className="trust-stat__num">100%</span>
            <span className="trust-stat__label">Standar Panduan SMKN 4</span>
          </div>
          <div className="trust-divider"></div>
          <div className="trust-stat">
            <span className="trust-stat__num">15+</span>
            <span className="trust-stat__label">Jurusan Vokasi Didukung</span>
          </div>
          <div className="trust-divider"></div>
          <div className="trust-stat">
            <span className="trust-stat__num">0 Error</span>
            <span className="trust-stat__label">Daftar Isi &amp; Nomor Halaman Rapi</span>
          </div>
          <div className="trust-divider"></div>
          <div className="trust-stat">
            <span className="trust-stat__num">4-4-3-3</span>
            <span className="trust-stat__label">Margin Presisi cm</span>
          </div>
        </div>
      </section>

      {/* Section 2: 4-Step Workflow */}
      <section className="workflow-section">
        <div className="workflow-section__container">
          <div className="section-head">
            <span className="section-head__tag">ALUR KERJA MUDAH</span>
            <h2>4 Langkah Cepat Menyusun Laporan PKL</h2>
            <p className="muted">Dari data mentah hingga dokumen Microsoft Word siap cetak.</p>
          </div>

          <div className="workflow-steps">
            <div className="step-card">
              <div className="step-card__num">01</div>
              <h3>Isi Data Siswa &amp; Industri</h3>
              <p>Masukkan identitas siswa, nama perusahaan tempat PKL, pembimbing, dan tanggal pelaksanaan.</p>
            </div>
            <div className="step-card">
              <div className="step-card__num">02</div>
              <h3>Jurnal &amp; Kegiatan</h3>
              <p>Tuliskan tugas harian, peralatan yang digunakan, serta kendala teknis yang dihadapi selama PKL.</p>
            </div>
            <div className="step-card">
              <div className="step-card__num">03</div>
              <h3>Pemeriksaan Otomatis Kesesuaian Data</h3>
              <p>Gunakan generator AI untuk memperhalus draf paragraf Kesimpulan &amp; Saran sesuai data asli kegiatanmu.</p>
            </div>
            <div className="step-card">
              <div className="step-card__num">04</div>
              <h3>Unduh File .docx</h3>
              <p>Dapatkan file MS Word asli yang sudah rapi dengan margin 4-4-3-3 cm dan penomoran Romawi/Arab.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Key Features Cards */}
      <section className="features-section">
        <div className="features-section__container">
          <div className="section-head">
            <span className="section-head__tag">FITUR UNGGULAN</span>
            <h2>Didesain Khusus untuk Standar Akademik SMK</h2>
          </div>

          <div className="features-grid">
            <div className="feature-box">
              <div className="feature-box__icon"><IconDocument size={28} color="var(--green-700)" /></div>
              <h3>Margin 4-4-3-3 cm Presisi XML</h3>
              <p>Batas tepi halaman diatur otomatis pada level XML dokumen Word agar hasil cetak tidak terpotong saat penjilidan.</p>
            </div>

            <div className="feature-box">
              <div className="feature-box__icon"><IconDocument size={28} color="var(--green-700)" /></div>
              <h3>Penomoran Halaman Bertingkat</h3>
              <p>Nomor Romawi kecil (i, ii...) untuk Halaman Depan dan Angka Arab (1, 2...) mulai dari BAB I Pendahuluan.</p>
            </div>

            <div className="feature-box">
              <div className="feature-box__icon"><IconDocument size={28} color="var(--green-700)" /></div>
              <h3>Tabel Identitas Lebar 14.00 cm</h3>
              <p>Seluruh tabel identitas siswa &amp; industri dibatasi persis 14.00 cm agar muat sempurna di area cetak A4.</p>
            </div>

            <div className="feature-box">
              <div className="feature-box__icon"><IconPencil size={28} color="var(--green-700)" /></div>
              <h3>Sub-list Standar <code>a.</code> <code>b.</code> <code>c.</code></h3>
              <p>Penomoran rincian menggunakan abjad titik tebal dengan huruf kapital di awal kalimat sesuai EYD/EYD V.</p>
            </div>

            <div className="feature-box">
              <div className="feature-box__icon"><IconShield size={28} color="var(--green-700)" /></div>
              <h3>Pemeriksaan Otomatis Kesesuaian Data</h3>
              <p>Sistem menjaga agar tulisan laporan tetap sesuai fakta kegiatanmu secara alami dan profesional.</p>
            </div>

            <div className="feature-box">
              <div className="feature-box__icon"><IconDocument size={28} color="var(--green-700)" /></div>
              <h3>Bookmark Lampiran MS Word Safe</h3>
              <p>Setiap gambar dokumentasi diberi penanda bookmark otomatis sehingga tidak menimbulkan error pada Daftar Isi.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="cta-section">
        <div className="cta-section__container">
          <h2>Siap Menyusun Laporan PKL Sesuai Standar Sekolah?</h2>
          <p>Mulai gratis sekarang dan selesaikan draf laporan Anda tanpa khawatir revisi format Word.</p>
          <button onClick={handleStartReport} className="btn-primary hero-btn-lg">
            <IconLightning size={18} style={{ marginRight: '0.4rem' }} /> Buat Draf Laporan Sekarang (Gratis)
          </button>
        </div>
      </section>

      <Footer />
    </div>
  )
}
