import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PublicNavbar from '@/components/layout/PublicNavbar'
import Footer from '@/components/layout/Footer'
import { useAuth } from '@/store/auth'
import { createDraft } from '@/api/client'
import {
  IconSparkles,
  IconRocket,
  IconDocument,
  IconCross,
  IconCheck,
  IconShield,
  IconLightning,
  IconPencil,
} from '@/components/common/Icons'

export default function LandingPage() {
  const { token, user } = useAuth()
  const nav = useNavigate()
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const handleStartReport = async () => {
    if (!token || !user) {
      nav('/register')
      return
    }
    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    const d = await createDraft(`Laporan PKL - ${today}`)
    nav(`/wizard/${d.id}`)
  }

  const faqs = [
    {
      q: 'Apakah file laporan yang dihasilkan bisa diedit kembali di MS Word?',
      a: 'Ya, 100%! Aplikasi kami menghasilkan file .docx native murni yang sepenuhnya kompatibel dengan Microsoft Word 2016, 2019, 2021, Office 365, maupun WPS Office. Anda bebas mengedit font, isi paragraf, maupun posisi gambar kapan saja.',
    },
    {
      q: 'Bagaimana sistem menangani penomoran halaman Romawi dan Arab?',
      a: 'Sistem membagi dokumen menjadi beberapa Section fisik MS Word. Bagian Depan (Pengesahan, Kata Pengantar, Daftar Isi) secara otomatis diberi nomor halaman Romawi kecil (i, ii, iii...) di bawah tengah. Mulai dari BAB I PENDAHULUAN, nomor halaman berganti ke Angka Arab (1, 2, 3...) di kanan atas, sesuai pedoman baku SMKN 4 Bandung.',
    },
    {
      q: 'Mengapa draf buatan AI di SiPKL dijamin bebas halusinasi?',
      a: 'Engine AI kami dilengkapi 3-layer anti-halusinasi yang mengunci fakta dasar (nama siswa, industri, divisi, peralatan, dan tanggal PKL). AI hanya memperhalus tata bahasa Indonesia baku akademik tanpa mengarang fakta palsu atau istilah yang tidak Anda alami selama PKL.',
    },
    {
      q: 'Apakah format Margin 4-4-3-3 cm benar-benar presisi?',
      a: 'Sangat presisi. Kami mengatur Page Setup langsung pada XML Microsoft Word: Kiri 4.0 cm (untuk jilid), Atas 4.0 cm, Kanan 3.0 cm, dan Bawah 3.0 cm. Selain itu, seluruh tabel identitas dibatasi lebar maksimum 14.00 cm agar tidak menabrak batas margin kanan.',
    },
    {
      q: 'Apakah bisa digunakan untuk jurusan SMK selain RPL?',
      a: 'Sangat bisa! SiPKL mendukung lebih dari 15 jurusan vokasi (TKJ, DKV, Teknik Otomotif, Teknik Logam, Ketenagalistrikan, Akuntansi, dll). Kami menyediakan contoh jurnal kegiatan & profil industri khusus untuk setiap jurusan.',
    },
    {
      q: 'Bagaimana jika Daftar Isi MS Word saya menampilkan "Error! Bookmark not defined"?',
      a: 'Di SiPKL, error tersebut 100% tidak akan terjadi. Setiap gambar lampiran dan judul sub-bab secara otomatis didaftarkan dengan ID Bookmark terenkapsulasi yang diikat langsung pada paragraph body dokumen.',
    },
  ]

  return (
    <div className="landing-layout">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-section__container">
          <div className="hero-section__badge">
            <IconSparkles size={15} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} /> Standar Resmi SMKN 4 Bandung &amp; Vokasi 2026
          </div>

          <h1 className="hero-section__title">
            Susun Laporan PKL Resmi &amp; Presisi Sesuai Standar Sekolah
          </h1>

          <p className="hero-section__subtitle">
            Hasilkan file <strong>Microsoft Word (.docx) native</strong> otomatis dengan margin 4-4-3-3 cm, penomoran Romawi/Arab presisi, tabel identitas rapi, dan draf AI anti-halusinasi.
          </p>

          <div className="hero-section__cta-group">
            <button onClick={handleStartReport} className="btn-primary hero-btn-lg">
              <IconRocket size={18} style={{ marginRight: '0.5rem' }} /> Buat Laporan Gratis Sekarang
            </button>
            <Link to="/format-guide" className="btn-outline hero-btn-lg">
              <IconDocument size={18} style={{ marginRight: '0.5rem' }} /> Pelajari Standar Format
            </Link>
          </div>

          {/* Interactive Document Preview Mockup */}
          <div className="hero-mockup">
            <div className="hero-mockup__header">
              <div className="hero-mockup__dots">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
              </div>
              <div className="hero-mockup__title-bar">
                Laporan_PKL_SMKN4_Bandung_Official.docx (Live Preview)
              </div>
              <div className="hero-mockup__status-badge">
                ✓ Native MS Word XML
              </div>
            </div>

            <div className="hero-mockup__body">
              <div className="doc-page-mockup">
                <div className="doc-page-mockup__margin-line top-left">Margin 4 cm</div>
                <div className="doc-page-mockup__margin-line top-right">Margin 3 cm</div>

                <div className="doc-page-mockup__content">
                  <div className="doc-heading">LAPORAN PRAKTEK KERJA LAPANGAN</div>
                  <div className="doc-subheading">PADA PT. TELEKOMUNIKASI INDONESIA TSK</div>
                  <div className="doc-spacing-enter">[ Enter Spacing Otomatis Bebas Overflow ]</div>

                  <div className="doc-logo-box">
                    <div className="logo-placeholder">LOGO SMKN 4 BANDUNG</div>
                  </div>

                  <div className="doc-meta-table">
                    <div className="meta-row"><span>Nama</span><span>: Muhammad Rizky Pratama</span></div>
                    <div className="meta-row"><span>NIS / NISN</span><span>: 212210482 / 0054819283</span></div>
                    <div className="meta-row"><span>Kompetensi</span><span>: Rekayasa Perangkat Lunak (RPL)</span></div>
                  </div>

                  <div className="doc-footer-school">
                    PEMERINTAH DAERAH PROVINSI JAWA BARAT<br />
                    DINAS PENDIDIKAN - SMKN 4 BANDUNG<br />
                    2026
                  </div>
                </div>

                <div className="doc-page-mockup__page-num">
                  Nomor Halaman: i (Romawi) / 1 (Arab BAB I)
                </div>
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
            <span className="trust-stat__label">Bookmark TOC MS Word</span>
          </div>
          <div className="trust-divider"></div>
          <div className="trust-stat">
            <span className="trust-stat__num">4-4-3-3</span>
            <span className="trust-stat__label">Margin Presisi cm</span>
          </div>
        </div>
      </section>

      {/* Section 1: Problem vs Solution Visual Comparison */}
      <section className="comparison-section">
        <div className="comparison-section__container">
          <div className="section-head">
            <span className="section-head__tag">PERBANDINGAN NYATA</span>
            <h2>Mengapa Cara Manual di Word Sering Ditolak Pembimbing?</h2>
            <p className="muted">
              Menyusun laporan PKL secara manual di Microsoft Word sering memicu error format yang membuang waktu revisi berulang kali.
            </p>
          </div>

          <div className="comparison-grid">
            {/* Card Manual */}
            <div className="comparison-card comparison-card--bad">
              <div className="comparison-card__badge"><IconCross size={14} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} /> CARA MANUAL DI MS WORD</div>
              <h3>Sering Rusak &amp; Ditolak Pembimbing</h3>
              <ul className="comparison-list">
                <li>
                  <span className="icon"><IconCross size={18} color="var(--red-600)" /></span>
                  <div>
                    <strong>Margin Tidak Sesuai (2.5 cm Default)</strong>
                    <p>Halaman terpotong saat dijilid karena margin kiri tidak 4 cm.</p>
                  </div>
                </li>
                <li>
                  <span className="icon"><IconCross size={18} color="var(--red-600)" /></span>
                  <div>
                    <strong>"Error! Bookmark not defined" di Daftar Isi</strong>
                    <p>Gambar lampiran tidak diikat bookmark sehingga TOC rusak saat di-update.</p>
                  </div>
                </li>
                <li>
                  <span className="icon"><IconCross size={18} color="var(--red-600)" /></span>
                  <div>
                    <strong>Halaman Sampul Melimpah ke Halaman 2</strong>
                    <p>Jarak enter manual tidak konsisten jika dibuka di versi Word berbeda.</p>
                  </div>
                </li>
                <li>
                  <span className="icon"><IconCross size={18} color="var(--red-600)" /></span>
                  <div>
                    <strong>Sub-list Menggunakan <code>a)</code> bukan <code>a.</code> Bold</strong>
                    <p>Tidak memenuhi standar tata tulis ilmiah Indonesia baku.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Card SiPKL */}
            <div className="comparison-card comparison-card--good">
              <div className="comparison-card__badge"><IconCheck size={14} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} /> SOLUSI SIPKL ACADEMIC</div>
              <h3>100% Rapi &amp; Siap Langsung Cetak</h3>
              <ul className="comparison-list">
                <li>
                  <span className="icon"><IconCheck size={18} color="var(--green-700)" /></span>
                  <div>
                    <strong>Margin Presisi 4-4-3-3 cm Terkunci</strong>
                    <p>Otomatis diset pada XML dokumen: 4cm Kiri, 4cm Atas, 3cm Kanan, 3cm Bawah.</p>
                  </div>
                </li>
                <li>
                  <span className="icon"><IconCheck size={18} color="var(--green-700)" /></span>
                  <div>
                    <strong>TOC Safe dengan Bookmark Terenkapsulasi</strong>
                    <p>Lampiran diisi ID bookmark valid sehingga Daftar Isi MS Word 100% aman.</p>
                  </div>
                </li>
                <li>
                  <span className="icon"><IconCheck size={18} color="var(--green-700)" /></span>
                  <div>
                    <strong>Enter Spacing Terhitung Presisi Point</strong>
                    <p>Kop pengesahan &amp; footer cover dijamin dorong tepat ke batas bawah halaman.</p>
                  </div>
                </li>
                <li>
                  <span className="icon"><IconCheck size={18} color="var(--green-700)" /></span>
                  <div>
                    <strong>Sub-list Standar <code>a.</code> <code>b.</code> <code>c.</code> Bold &amp; Kapital</strong>
                    <p>Format otomatis: Huruf kapital awal kalimat &amp; penanda titik tebal.</p>
                  </div>
                </li>
              </ul>
            </div>
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
              <h3>Asisten AI Anti-Halusinasi</h3>
              <p>Gunakan generator AI untuk memperhalus draf paragraf Kesimpulan &amp; Saran tanpa mengubah fakta.</p>
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
              <h3>3-Layer Anti-Halusinasi AI</h3>
              <p>AI mengunci konteks fakta teknis Anda sehingga hasil tulisan alami, profesional, dan bebas dari kalimat mengarang.</p>
            </div>

            <div className="feature-box">
              <div className="feature-box__icon"><IconDocument size={28} color="var(--green-700)" /></div>
              <h3>Bookmark Lampiran MS Word Safe</h3>
              <p>Setiap gambar dokumentasi diberi penanda bookmark otomatis sehingga tidak menimbulkan error pada Daftar Isi.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: FAQ Accordion */}
      <section className="faq-section">
        <div className="faq-section__container">
          <div className="section-head">
            <span className="section-head__tag">PERTANYAAN UMUM</span>
            <h2>Sering Ditanyakan seputar SiPKL</h2>
          </div>

          <div className="faq-list">
            {faqs.map((item, idx) => (
              <div
                key={idx}
                className={`faq-item ${openFaq === idx ? 'is-open' : ''}`}
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              >
                <div className="faq-item__question">
                  <h3>{item.q}</h3>
                  <span className="faq-item__icon">{openFaq === idx ? '−' : '+'}</span>
                </div>
                {openFaq === idx && (
                  <div className="faq-item__answer">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            ))}
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
