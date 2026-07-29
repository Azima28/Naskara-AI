import React from 'react'
import { Link } from 'react-router-dom'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="auth-split">
      {/* Left side panel — Academic & Anti-AI Branding */}
      <div className="auth-split__hero">
        <div className="auth-split__hero-overlay"></div>
        <div className="auth-split__hero-content">
          <Link to="/" className="auth-split__logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              <path d="M12 6h4" />
              <path d="M12 10h4" />
            </svg>
            <span>SiPKL Academic</span>
          </Link>

          <div className="auth-split__manifesto">
            <span className="auth-split__badge">
              ✦ Standar Resmi SMKN 4 Bandung &amp; Vokasi 2026
            </span>
            <h2 className="auth-split__headline">
              Susun Laporan PKL Siap Cetak Tanpa Pusing Format Word.
            </h2>
            <p className="auth-split__body">
              Otomatisasi lengkap dari Margin 4-4-3-3 cm, penomoran Halaman Romawi/Arab, Garis Pengesahan, hingga draf AI anti-halusinasi yang aman dari sensor AI detector sekolah.
            </p>
          </div>

          <div className="auth-split__trust-cards">
            <div className="trust-card">
              <div className="trust-card__icon">📄</div>
              <div>
                <strong>Format .docx Native MS Word</strong>
                <p>Tidak corrupt, TOC otomatis, &amp; bookmark lampiran valid</p>
              </div>
            </div>
            <div className="trust-card">
              <div className="trust-card__icon">🛡️</div>
              <div>
                <strong>Bebas Halusinasi AI</strong>
                <p>Bahasa baku akademik Indonesia yang natural dan tidak kaku</p>
              </div>
            </div>
          </div>

          <div className="auth-split__footer">
            <Link to="/">← Kembali ke Beranda</Link> | <Link to="/format-guide">Lihat Panduan Format</Link>
          </div>
        </div>
      </div>

      {/* Right side panel — Form Container */}
      <div className="auth-split__form-container">
        <div className="auth-split__form-box">
          <div className="auth-split__header">
            <h1>{title}</h1>
            <p className="muted">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
