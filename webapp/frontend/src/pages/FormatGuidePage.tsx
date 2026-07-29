import { useState } from 'react'
import { Link } from 'react-router-dom'
import PublicNavbar from '@/components/layout/PublicNavbar'
import Footer from '@/components/layout/Footer'
import {
  IconLightbulb,
  IconCode,
  IconGlobe,
  IconPalette,
  IconRocket,
  IconCompass,
  IconBed,
  IconUtensils,
  IconScissors,
  IconFolder,
  IconChart,
  IconShoppingBag,
} from '@/components/common/Icons'

type MajorKey = 'pplg' | 'tkj' | 'dkv' | 'upw' | 'ph' | 'tb' | 'busana' | 'otkp' | 'akl' | 'bdp'

export default function FormatGuidePage() {
  const [activeTab, setActiveTab] = useState<MajorKey>('pplg')

  const majors: { id: MajorKey; name: string; code: string }[] = [
    { id: 'pplg', name: 'Pemrograman Perangkat Lunak & Gim (PPLG)', code: 'PPLG' },
    { id: 'tkj', name: 'Teknik Komputer & Jaringan (TKJ)', code: 'TKJ' },
    { id: 'dkv', name: 'Desain Komunikasi Visual (DKV)', code: 'DKV' },
    { id: 'upw', name: 'Usaha Perjalanan Wisata (UPW)', code: 'UPW' },
    { id: 'ph', name: 'Perhotelan (PH)', code: 'PH' },
    { id: 'tb', name: 'Tata Boga / Kuliner (TB)', code: 'TB' },
    { id: 'busana', name: 'Tata Busana / Fashion (TS)', code: 'TS' },
    { id: 'otkp', name: 'Otomatisasi & Tata Kelola Perkantoran (OTKP)', code: 'OTKP' },
    { id: 'akl', name: 'Akuntansi & Keuangan Lembaga (AKL)', code: 'AKL' },
    { id: 'bdp', name: 'Bisnis Daring & Pemasaran (BDP)', code: 'BDP' },
  ]

  return (
    <div className="guide-layout">
      <PublicNavbar />

      <section className="guide-hero">
        <div className="guide-hero__container">
          <span className="guide-hero__tag">PEDOMAN RESMI 2026</span>
          <h1>Panduan Format Penulisan Laporan PKL SMKN 4 Bandar Lampung</h1>
          <p className="guide-hero__lead">
            Panduan lengkap spesifikasi tata tulis ilmiah, tata letak margin 4-4-3-3 cm, aturan penomoran halaman bertingkat, serta struktur penulisan sub-list yang berlaku resmi di SMKN 4 Bandar Lampung.
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
              <IconLightbulb size={18} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> <strong>Otomatisasi di Naskara:</strong> Seluruh margin ini diset langsung di XML dokumen. Seluruh tabel identitas dibatasi maksimal <code>14.00 cm</code> (21.01cm - 4cm - 3cm = 14.01cm) agar tidak pernah menabrak margin kanan.
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
              Sesuai Pedoman Akademik 2026 SMKN 4 Bandar Lampung, dokumen PKL wajib memiliki dua kelompok penomoran halaman yang terpisah:
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

          {/* Card 4: Tab Switcher Jurusan SMKN 4 Bandar Lampung */}
          <div className="guide-card">
            <h2>4. Contoh Isian Jurnal Kegiatan per Jurusan SMKN 4 Bandar Lampung</h2>
            <p className="muted">
              Pilih konsentrasi keahlian Anda untuk melihat contoh jurnal kegiatan teknis yang relevan dan diterima sekolah:
            </p>

            <div className="tab-buttons">
              {majors.map((m) => (
                <button
                  key={m.id}
                  className={`tab-btn ${activeTab === m.id ? 'is-active' : ''}`}
                  onClick={() => setActiveTab(m.id)}
                >
                  {m.code}
                </button>
              ))}
            </div>

            <div className="jurusan-guide-box">
              {activeTab === 'pplg' && (
                <div>
                  <h3><IconCode size={20} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> Pemrograman Perangkat Lunak &amp; Gim (PPLG)</h3>
                  <p><strong>Contoh Divisi:</strong> Software Engineering / Web Development / Game Dev / QA Tester</p>
                  <p><strong>Peralatan Utama:</strong> Visual Studio Code, Git/GitHub, MySQLWorkbench, Postman API, Node.js, Unity/Unreal Engine.</p>
                  <p><strong>Contoh Kegiatan:</strong> Slicing UI Figma ke React, Pembuatan API Endpoint Authentication, Fix Bug Query Database SQL, Testing Unit Test &amp; Optimasi Speed Query.</p>
                </div>
              )}
              {activeTab === 'tkj' && (
                <div>
                  <h3><IconGlobe size={20} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> Teknik Komputer &amp; Jaringan (TKJ)</h3>
                  <p><strong>Contoh Divisi:</strong> Network Administrator / IT Support / Infrastructure &amp; Cloud</p>
                  <p><strong>Peralatan Utama:</strong> Router MikroTik, Tang Crimping, LAN Tester, Switch Cisco, Winbox, Kabel UTP Cat6.</p>
                  <p><strong>Contoh Kegiatan:</strong> Konfigurasi VLAN &amp; Routing OSPF, Crimping Kabel LAN, Setting Bandwidth Management Queues MikroTik, Troubleshooting Koneksi Jaringan.</p>
                </div>
              )}
              {activeTab === 'dkv' && (
                <div>
                  <h3><IconPalette size={20} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> Desain Komunikasi Visual (DKV)</h3>
                  <p><strong>Contoh Divisi:</strong> Creative Media / Graphic Designer / Video Editor / Motion Artist</p>
                  <p><strong>Peralatan Utama:</strong> Adobe Photoshop, Illustrator, Premiere Pro, Pen Tablet Wacom, Camera DSLR.</p>
                  <p><strong>Contoh Kegiatan:</strong> Desain Banner Promosi Digital, Editing Video Profil Perusahaan, Slicing Asset Vector Logo, Layouting Booklet Brosur &amp; Motion Graphics.</p>
                </div>
              )}
              {activeTab === 'upw' && (
                <div>
                  <h3><IconCompass size={20} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> Usaha Perjalanan Wisata (UPW)</h3>
                  <p><strong>Contoh Divisi:</strong> Tour Operator / Travel Consultant / Ticketing Reservation / Guiding</p>
                  <p><strong>Peralatan Utama:</strong> GDS Sabre/Amadeus Reservation System, Time Table Rute, Costing Sheet Excel, Travel Contract Rate.</p>
                  <p><strong>Contoh Kegiatan:</strong> Pembuatan Itinerary Tour 3D2N Bandung-Lembang, Calculation Travel Costing &amp; Fixed Cost per Pax, Inbound Tour Guiding, Reservation Flight &amp; Hotel Ticket.</p>
                </div>
              )}
              {activeTab === 'ph' && (
                <div>
                  <h3><IconBed size={20} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> Perhotelan (PH)</h3>
                  <p><strong>Contoh Divisi:</strong> Front Office / Housekeeping / Laundry / Guest Relation Officer</p>
                  <p><strong>Peralatan Utama:</strong> Opera Property Management System (PMS), Housekeeping Trolley, Linen &amp; Amenities Check-list, Room Key Card Programmer.</p>
                  <p><strong>Contoh Kegiatan:</strong> Handling Guest Check-In &amp; Check-Out, Room Inspection 21 Poin Housekeeping, Turndown Service Deluxe Room, Guest Complaint Resolution &amp; Luggage Handling.</p>
                </div>
              )}
              {activeTab === 'tb' && (
                <div>
                  <h3><IconUtensils size={20} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> Tata Boga / Kuliner (TB)</h3>
                  <p><strong>Contoh Divisi:</strong> Main Kitchen / Pastry &amp; Bakery / Banquet Service / Cold Kitchen</p>
                  <p><strong>Peralatan Utama:</strong> Commercial Oven, Portioning Digital Scale, Chef Knives Set, Chiller/Freezer FIFO, Cooking Thermometer.</p>
                  <p><strong>Contoh Kegiatan:</strong> Standardisasi Mise en Place Bahan Utama, Pembuatan Pastry &amp; Bakery, Audit Hygiene HACCP, Control Food Cost Menu Buffet Banquet dari 38% ke 29.5%.</p>
                </div>
              )}
              {activeTab === 'busana' && (
                <div>
                  <h3><IconScissors size={20} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> Tata Busana / Fashion (TS)</h3>
                  <p><strong>Contoh Divisi:</strong> Fashion Designer Assistant / Pattern Maker / Garment Quality Control / Sample Sewing</p>
                  <p><strong>Peralatan Utama:</strong> Mesin Jahit High-Speed Industri, Mesin Obras 4-Benang, Manekin Draping, Gunting Kain Tailor, Meteran Jahit.</p>
                  <p><strong>Contoh Kegiatan:</strong> Pembuatan Pola Busana Custom Sistem Meyneke, Draping Sample Kain Blaco, Cutting Material Kain &amp; Toleransi Jahitan 1.5 cm, Quality Control Kerapatan Stik Jahitan.</p>
                </div>
              )}
              {activeTab === 'otkp' && (
                <div>
                  <h3><IconFolder size={20} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> Otomatisasi &amp; Tata Kelola Perkantoran (OTKP)</h3>
                  <p><strong>Contoh Divisi:</strong> Sekretaris / Administrasi Perkantoran / Public Relation / Digital Archiving</p>
                  <p><strong>Peralatan Utama:</strong> Mesin Scanner High-Speed, e-Office Archiving App, Telepon PABX, Filling Cabinet, Paper Shredder.</p>
                  <p><strong>Contoh Kegiatan:</strong> Digitalisasi Surat Masuk/Keluar, Pengelolaan Agenda Rapat Direksi, Penanganan Telepon PABX &amp; Tamu Perusahaan, Retrieval Document System di bawah 1 Menit.</p>
                </div>
              )}
              {activeTab === 'akl' && (
                <div>
                  <h3><IconChart size={20} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> Akuntansi &amp; Keuangan Lembaga (AKL)</h3>
                  <p><strong>Contoh Divisi:</strong> Accounting Staff / Finance / Tax Officer / Payroll / Collection Waive</p>
                  <p><strong>Peralatan Utama:</strong> MYOB Accounting, Accurate Software, Microsoft Excel Advanced, e-Faktur Pajak, Kalkulator Finansial.</p>
                  <p><strong>Contoh Kegiatan:</strong> Rekonsiliasi Bank Bulanan, Jurnal Penyesuaian Kas Kecil (Petty Cash), Penghitungan Waive Discount Denda Debitur, Penyusunan Laporan Laba Rugi Perusahaan.</p>
                </div>
              )}
              {activeTab === 'bdp' && (
                <div>
                  <h3><IconShoppingBag size={20} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} /> Bisnis Daring &amp; Pemasaran (BDP)</h3>
                  <p><strong>Contoh Divisi:</strong> Digital Marketing / E-Commerce Specialist / Social Media Admin / Content Creator</p>
                  <p><strong>Peralatan Utama:</strong> Meta Business Suite, Shopee/Tokopedia Seller Center, TikTok Ads Manager, Google Analytics, Canva Pro.</p>
                  <p><strong>Contoh Kegiatan:</strong> Setting Ads Meta Campaign Usia Target 18-35 Tahun, Management Product Listing Marketplace, Live Streaming Sales Promotion, Tracking Conversion Rate &amp; ROAS.</p>
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
