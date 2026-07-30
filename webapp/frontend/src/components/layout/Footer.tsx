import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="public-footer">
      <div className="public-footer__container">
        <div className="public-footer__grid">
          {/* Col 1: Brand info */}
          <div className="public-footer__col public-footer__col--brand">
            <div className="public-footer__brand">
              <span className="public-footer__title">Naskara AI</span>
              <span className="public-footer__badge">SMKN 4 Bandar Lampung Standard</span>
            </div>
            <p className="public-footer__desc">
              Platform otomatisasi penyusunan laporan Praktek Kerja Lapangan (PKL) resmi vokasi Indonesia. Menghasilkan dokumen Microsoft Word (.docx) native dengan presisi margin 4-4-3-3 cm, penomoran Romawi/Arab, dan bebas dari halusinasi AI.
            </p>
            <div className="public-footer__trust-tag">
              <span className="trust-dot"></span> Format Teruji di MS Word 2016 - 365
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div className="public-footer__col">
            <h4 className="public-footer__heading">Navigasi</h4>
            <ul className="public-footer__list">
              <li><Link to="/">Beranda</Link></li>
              <li><Link to="/format-guide">Panduan Format SMKN 4</Link></li>
              <li><Link to="/about">Tentang &amp; Misi Akademik</Link></li>
              <li><Link to="/login">Masuk Akun</Link></li>
              <li><Link to="/register">Daftar Akun Baru</Link></li>
            </ul>
          </div>

          {/* Col 3: Standar Jurusan SMKN 4 Bandar Lampung */}
          <div className="public-footer__col">
            <h4 className="public-footer__heading">Jurusan SMKN 4 Bandar Lampung</h4>
            <ul className="public-footer__list">
              <li><span>PPLG (Perangkat Lunak &amp; Gim)</span></li>
              <li><span>TKJ (Teknik Komputer &amp; Jaringan)</span></li>
              <li><span>DKV (Desain Komunikasi Visual)</span></li>
              <li><span>UPW (Usaha Perjalanan Wisata)</span></li>
              <li><span>PH (Perhotelan)</span></li>
              <li><span>Tabog (Tata Boga / Kuliner)</span></li>
              <li><span>Tabus (Tata Busana / Fashion)</span></li>
              <li><span>AKL (Akuntansi &amp; Keuangan)</span></li>
              <li><span>BDP (Bisnis &amp; Pemasaran)</span></li>
            </ul>
          </div>

          {/* Col 4: Kepatuhan Format */}
          <div className="public-footer__col">
            <h4 className="public-footer__heading">Standar Akademik</h4>
            <div className="public-footer__specs">
              <div className="spec-chip">Margin: 4cm Kiri, 4cm Atas, 3cm Kanan, 3cm Bawah</div>
              <div className="spec-chip">Font: Times New Roman 12pt / 1.5 Spasi</div>
              <div className="spec-chip">Bookmark Lampiran TOC MS Word Safe</div>
              <div className="spec-chip">Sub-list Penomoran: a. b. c. Bold</div>
            </div>
          </div>
        </div>

        <div className="public-footer__bottom">
          <p>© {new Date().getFullYear()} Naskara AI Generator. Dibuat khusus untuk Pendidikan Vokasi Indonesia.</p>
          <div className="public-footer__bottom-links">
            <Link to="/format-guide">Pedoman Penulisan</Link>
            <span className="dot-sep">•</span>
            <Link to="/about">Ketentuan Layanan</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
