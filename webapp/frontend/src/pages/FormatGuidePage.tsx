import { useState } from 'react'
import { Link } from 'react-router-dom'
import PublicNavbar from '@/components/layout/PublicNavbar'
import Footer from '@/components/layout/Footer'
import {
  IconLightbulb,
  IconCode,
  IconGlobe,
  IconPalette,
  IconGear,
  IconLightning,
  IconCar,
  IconRocket,
} from '@/components/common/Icons'

export default function FormatGuidePage() {
  const [activeTab, setActiveTab] = useState<'rpl' | 'tkj' | 'dkv' | 'tflm' | 'titl' | 'tkr'>('rpl')

  const majors = [
    { id: 'rpl', name: 'Rekayasa Perangkat Lunak (RPL)', code: 'RPL' },
    { id: 'tkj', name: 'Teknik Komputer & Jaringan (TKJ)', code: 'TKJ' },
    { id: 'dkv', name: 'Desain Komunikasi Visual (DKV)', code: 'DKV' },
    { id: 'tflm', name: 'Teknik Fabrikasi Logam (TFLM)', code: 'TFLM' },
    { id: 'titl', name: 'Teknik Ketenagalistrikan (TITL)', code: 'TITL' },
    { id: 'tkr', name: 'Teknik Otomotif (TKR/TSM)', code: 'TKR' },
  ]

  return (
    <div className="guide-layout">
      <PublicNavbar />

      <section className="guide-hero">
        <div className="guide-hero__container">
          <span className="guide-hero__tag">PEDOMAN RESMI 2026</span>
          <h1>Panduan Format Penulisan Laporan PKL SMKN 4 Bandung</h1>
          <p className="guide-hero__lead">
            Panduan lengkap spesifikasi tata tulis ilmiah, tata letak margin 4-4-3-3 cm, aturan penomoran halaman bertingkat, serta struktur penulisan sub-list yang berlaku resmi.
          </p>
        </div>
      </section>

      <section className="guide-body">
        <div className="guide-body__container">
          {/* Card 1: Margin & Kertas */}
          <div className="guide-card">
            <h2>1. Tata Letak Margin &amp; Ukuran Kertas (A4)</h2>
            <p className="muted">
              Ukuran kertas yang digunakan adalah <strong>A4 (21.01 cm x 29.70 cm)</strong> dengan batas margin khusus untuk penjilidan buku:
            </p>

            <div className="margin-specs-grid">
              <div className="margin-box highlight">
                <span className="margin-label">Margin Kiri (Left)</span>
                <span className="margin-val">4.0 cm</span>
                <span className="margin-note">Space ekstra 1.0 cm untuk jilid lakban/kawat</span>
              </div>
              <div className="margin-box">
                <span className="margin-label">Margin Atas (Top)</span>
                <span className="margin-val">4.0 cm</span>
                <span className="margin-note">Batas tajuk judul bab utama</span>
              </div>
              <div className="margin-box">
                <span className="margin-label">Margin Kanan (Right)</span>
                <span className="margin-val">3.0 cm</span>
                <span className="margin-note">Batas rata kanan paragraf (Justify)</span>
              </div>
              <div className="margin-box">
                <span className="margin-label">Margin Bawah (Bottom)</span>
                <span className="margin-val">3.0 cm</span>
                <span className="margin-note">Batas bawah catatan kaki / footer</span>
              </div>
            </div>

            <div className="guide-tip">
              <IconLightbulb size={18} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> <strong>Otomatisasi di SiPKL:</strong> Seluruh margin ini diset langsung di XML dokumen. Seluruh tabel identitas dibatasi maksimal <code>14.00 cm</code> (21.01cm - 4cm - 3cm = 14.01cm) agar tidak pernah menabrak margin kanan.
            </div>
          </div>

          {/* Card 2: Tipografi & Spasi */}
          <div className="guide-card">
            <h2>2. Tipografi, Jenis Font, &amp; Jarak Spasi Kalimat</h2>
            <div className="table-scroll">
              <table className="simple-table guide-table">
                <thead>
                  <tr>
                    <th>Elemen Dokumen</th>
                    <th>Jenis Font</th>
                    <th>Ukuran (Pt)</th>
                    <th>Gaya / Format</th>
                    <th>Jarak Spasi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Judul BAB (BAB I, BAB II...)</td>
                    <td>Times New Roman</td>
                    <td>14 pt</td>
                    <td>BOLD / KAPITAL SEMUA</td>
                    <td>Single (1.0) / Center</td>
                  </tr>
                  <tr>
                    <td>Sub-bab (1.1, 1.2...)</td>
                    <td>Times New Roman</td>
                    <td>12 pt</td>
                    <td>BOLD / Title Case</td>
                    <td>1.5 Spasi / Left</td>
                  </tr>
                  <tr>
                    <td>Isi Paragraf / Teks Utama</td>
                    <td>Times New Roman</td>
                    <td>12 pt</td>
                    <td>Regular (Justify)</td>
                    <td>1.5 Spasi</td>
                  </tr>
                  <tr>
                    <td>Penanda Sub-list (a. b. c.)</td>
                    <td>Times New Roman</td>
                    <td>12 pt</td>
                    <td><strong>BOLD (a. b. c.)</strong></td>
                    <td>1.5 Spasi + Huruf Kapital Awal</td>
                  </tr>
                  <tr>
                    <td>Isi Tabel / Keterangan Gambar</td>
                    <td>Times New Roman</td>
                    <td>10 - 11 pt</td>
                    <td>Regular / Center</td>
                    <td>Single (1.0) Spasi</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 3: Aturan Penomoran Halaman */}
          <div className="guide-card">
            <h2>3. Aturan Penomoran Halaman (Romawi vs Arab)</h2>
            <p className="muted">
              Sesuai Pedoman Akademik 2026, dokumen PKL wajib memiliki dua kelompok penomoran halaman yang terpisah:
            </p>

            <div className="pagenum-rules-grid">
              <div className="pagenum-rule-card">
                <div className="rule-badge rule-badge--roman">Bagian Depan (Front Matter)</div>
                <h3>Angka Romawi Kecil (i, ii, iii...)</h3>
                <ul>
                  <li>Terdiri dari: Lembar Pengesahan, Kata Pengantar, Daftar Isi, Daftar Gambar, Daftar Tabel.</li>
                  <li><strong>Posisi:</strong> Bawah Tengah (Bottom Center).</li>
                  <li>Halaman Sampul (Cover Utama) tidak diberi nomor tetapi dihitung sebagai halaman i.</li>
                </ul>
              </div>

              <div className="pagenum-rule-card">
                <div className="rule-badge rule-badge--arabic">Bagian Isi (Body Matter)</div>
                <h3>Angka Arab (1, 2, 3...)</h3>
                <ul>
                  <li>Terdiri dari: BAB I Pendahuluan hingga BAB VI Penutup dan Lampiran.</li>
                  <li><strong>Posisi Halaman Biasa:</strong> Atas Kanan (Top Right).</li>
                  <li><strong>Posisi Halaman Judul BAB:</strong> Bawah Tengah (Bottom Center).</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Card 4: Tab Switcher Jurusan Vokasi */}
          <div className="guide-card">
            <h2>4. Contoh Isian Jurnal Kegiatan per Jurusan Vokasi</h2>
            <p className="muted">
              Pilih jurusan Anda untuk melihat contoh jurnal kegiatan teknis yang relevan dan diterima sekolah:
            </p>

            <div className="tab-buttons">
              {majors.map((m) => (
                <button
                  key={m.id}
                  className={`tab-btn ${activeTab === m.id ? 'is-active' : ''}`}
                  onClick={() => setActiveTab(m.id as any)}
                >
                  {m.code}
                </button>
              ))}
            </div>

            <div className="jurusan-guide-box">
              {activeTab === 'rpl' && (
                <div>
                  <h3><IconCode size={20} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> Jurusan Rekayasa Perangkat Lunak (RPL)</h3>
                  <p><strong>Contoh Divisi:</strong> Software Engineering / Web Development / QA Tester</p>
                  <p><strong>Peralatan Utama:</strong> Visual Studio Code, Git/GitHub, MySQLWorkbench, Postman API, Node.js.</p>
                  <p><strong>Contoh Kegiatan:</strong> Slicing UI Figma ke React, Pembuatan API Endpoint Authentication, Fix Bug Query Database SQL, Testing Unit Test.</p>
                </div>
              )}
              {activeTab === 'tkj' && (
                <div>
                  <h3><IconGlobe size={20} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> Jurusan Teknik Komputer &amp; Jaringan (TKJ)</h3>
                  <p><strong>Contoh Divisi:</strong> Network Administrator / IT Support / Infrastructure</p>
                  <p><strong>Peralatan Utama:</strong> Router MikroTik, Tang Crimping, LAN Tester, Switch Cisco, Winbox, Kabel UTP Cat6.</p>
                  <p><strong>Contoh Kegiatan:</strong> Konfigurasi VLAN &amp; Routing OSPF, Crimping Kabel LAN, Setting Bandwidth Management Queues MikroTik, Troubleshooting Koneksi Jaringan.</p>
                </div>
              )}
              {activeTab === 'dkv' && (
                <div>
                  <h3><IconPalette size={20} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> Jurusan Desain Komunikasi Visual (DKV)</h3>
                  <p><strong>Contoh Divisi:</strong> Creative Media / Graphic Designer / Video Editor</p>
                  <p><strong>Peralatan Utama:</strong> Adobe Photoshop, Illustrator, Premiere Pro, Pen Tablet Wacom, Camera DSLR.</p>
                  <p><strong>Contoh Kegiatan:</strong> Desain Banner Promosi Digital, Editing Video Profil Perusahaan, Slicing Asset Vector Logo, Layouting Booklet Brosur.</p>
                </div>
              )}
              {activeTab === 'tflm' && (
                <div>
                  <h3><IconGear size={20} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> Jurusan Teknik Fabrikasi Logam (TFLM)</h3>
                  <p><strong>Contoh Divisi:</strong> Workshop Maintenance / Fabrication / Welding Inspector</p>
                  <p><strong>Peralatan Utama:</strong> Mesin Las SMAW/GMAW, Mesin Gerinda Tangan, Jangka Sorong, APD Las.</p>
                  <p><strong>Contoh Kegiatan:</strong> Pengelasan Sambungan T-Joint, Pemotongan Plat Besi dengan Cutting Torch, Finishing Penggerindaan Hasil Las, Inspeksi Visual Defek Pengelasan.</p>
                </div>
              )}
              {activeTab === 'titl' && (
                <div>
                  <h3><IconLightning size={20} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> Jurusan Teknik Ketenagalistrikan (TITL)</h3>
                  <p><strong>Contoh Divisi:</strong> Electrical Maintenance / Panel Installer / Automation</p>
                  <p><strong>Peralatan Utama:</strong> Multimeter Digital, Tang Ampere, Obeng VDE, Tang Kupas, PLC Omron.</p>
                  <p><strong>Contoh Kegiatan:</strong> Perakitan Panel Kontrol Motor 3-Fasa, Pengukuran Tegangan &amp; Arus Beban, Pemrograman Ladder Diagram PLC, Maintenance Breaker MCB/MCCB.</p>
                </div>
              )}
              {activeTab === 'tkr' && (
                <div>
                  <h3><IconCar size={20} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> Jurusan Teknik Otomotif (TKR/TSM)</h3>
                  <p><strong>Contoh Divisi:</strong> Service Advisor / Mekanik General Repair / Service Periodic</p>
                  <p><strong>Peralatan Utama:</strong> Diagnostic Scanner OBD-II, Kunci Momen, Feeler Gauge, Lift Hydraulic.</p>
                  <p><strong>Contoh Kegiatan:</strong> Tune-Up Mesin EFI 4-Silinder, Penggantian Oli Engine &amp; Filter, Ganti Kampas Rem Cakram, Scanner Clear Diagnostic Troubleshooting Code (DTC).</p>
                </div>
              )}
            </div>
          </div>

          {/* CTA Box */}
          <div className="guide-cta">
            <h2>Siap Membuat Laporan PKL Presisi Tanpa Edit Format Manual?</h2>
            <p>Sistem kami akan menerapkan seluruh standar aturan di atas secara otomatis ke file Word Anda.</p>
            <Link to="/register" className="btn-primary hero-btn-lg">
              <IconRocket size={18} style={{ marginRight: '0.4rem' }} /> Mulai Buat Laporan Sekarang (Gratis)
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
