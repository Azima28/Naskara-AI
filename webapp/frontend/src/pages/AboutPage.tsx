import { Link } from 'react-router-dom'
import PublicNavbar from '@/components/layout/PublicNavbar'
import Footer from '@/components/layout/Footer'
import { IconLightbulb, IconShield } from '@/components/common/Icons'

export default function AboutPage() {
  return (
    <div className="about-layout">
      <PublicNavbar />

      <section className="about-hero">
        <div className="about-hero__container">
          <span className="about-hero__tag">TENTANG SIPKL ACADEMIC</span>
          <h1>Misi Membantu Pendidikan Vokasi Indonesia</h1>
          <p className="about-hero__lead">
            SiPKL Academic hadir untuk menyelesaikan masalah klasik penyusunan laporan PKL bagi siswa SMK dan mahasiswa vokasi di Indonesia: format Microsoft Word yang sering berantakan, terpotong saat penjilidan, dan ditolak pembimbing sekolah.
          </p>
        </div>
      </section>

      <section className="about-content">
        <div className="about-content__container">
          <div className="about-grid">
            <div className="about-card">
              <div className="about-card__icon"><IconLightbulb size={28} color="var(--green-700)" /></div>
              <h2>Latar Belakang Dibuatnya SiPKL</h2>
              <p>
                Setiap tahunnya, jutaan siswa SMK melangsungkan Praktek Kerja Lapangan (PKL). Namun, sebagian besar waktu mereka habis untuk membetulkan batas margin 4-4-3-3 cm, membetulkan penomoran Halaman Romawi/Arab, menyetel garis pengesahan, dan memperbaiki error "Bookmark not defined" pada Daftar Isi Word.
              </p>
              <p>
                SiPKL dibangun menggunakan engine perakit dokumen <code>python-docx</code> yang bekerja langsung pada manipulasi XML asli dokumen MS Word, menjamin 100% kepatuhan aturan format tanpa perlu pengeditan manual yang melelahkan.
              </p>
            </div>

            <div className="about-card">
              <div className="about-card__icon"><IconShield size={28} color="var(--green-700)" /></div>
              <h2>Prinsip AI Bebas Halusinasi</h2>
              <p>
                Banyak siswa menggunakan AI generik seperti ChatGPT yang menghasilkan kalimat sangat formal, kaku, dan penuh dengan istilah asing yang tidak nyata (halusinasi).
              </p>
              <p>
                SiPKL mengusung <strong>3-Layer Anti-Hallucination Architecture</strong>: AI dikunci oleh data faktual yang diisikan siswa (peralatan, kegiatan harian, divisi, dan nama perusahaan), sehingga AI hanya memperhalus struktur kalimat tanpa pernah mengarang cerita palsu.
              </p>
            </div>
          </div>

          <div className="about-standards-box">
            <h2>Struktur Laporan Standar 6-BAB SMKN 4 Bandung</h2>
            <p className="muted" style={{ marginBottom: '1.5rem' }}>
              Dokumen yang dihasilkan SiPKL telah disesuaikan dengan Pedoman Akademik 2026:
            </p>

            <div className="bab-list-grid">
              <div className="bab-item">
                <span className="bab-num">BAB I</span>
                <strong>PENDAHULUAN</strong>
                <p>Latar belakang PKL, maksud &amp; tujuan, dan metode pengumpulan data.</p>
              </div>
              <div className="bab-item">
                <span className="bab-num">BAB II</span>
                <strong>PROFIL PERUSAHAAN / INDUSTRI</strong>
                <p>Sejarah singkat, struktur organisasi, visi misi, dan bidang usaha.</p>
              </div>
              <div className="bab-item">
                <span className="bab-num">BAB III</span>
                <strong>PELAKSANAAN PRAKTEK KERJA LAPANGAN</strong>
                <p>Jurnal kegiatan harian, landasan teori, dan detail pekerjaan teknis.</p>
              </div>
              <div className="bab-item">
                <span className="bab-num">BAB IV</span>
                <strong>PERALATAN DAN KENDALA TEKNIS</strong>
                <p>Spesifikasi perangkat/alat yang digunakan dan solusi atas kendala.</p>
              </div>
              <div className="bab-item">
                <span className="bab-num">BAB V</span>
                <strong>STUDI KASUS / PEMBAHASAN KHUSUS</strong>
                <p>Pembahasan topik spesifik jurusan (coding, jaringan, desain, dll).</p>
              </div>
              <div className="bab-item">
                <span className="bab-num">BAB VI</span>
                <strong>PENUTUP (KESIMPULAN DAN SARAN)</strong>
                <p>Rangkuman hasil PKL dan saran untuk sekolah serta instansi perusahaan.</p>
              </div>
            </div>
          </div>

          <div className="about-cta-box">
            <h3>Siap Menyusun Laporan PKL Sesuai Standar Akademik?</h3>
            <p>Gunakan SiPKL gratis dan nikmati kemudahan pembuatan laporan siap cetak.</p>
            <Link to="/register" className="btn-primary hero-btn-lg">
              Buat Laporan Gratis Sekarang →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
