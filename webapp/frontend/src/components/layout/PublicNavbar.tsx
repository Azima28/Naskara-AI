import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import { IconDashboard } from '@/components/common/Icons'

export default function PublicNavbar() {
  const { user, token, logout } = useAuth()
  const nav = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path: string) => location.pathname === path

  return (
    <header className="public-nav">
      <div className="public-nav__container">
        {/* Brand Logo */}
        <Link to="/" className="public-nav__brand">
          <div className="public-nav__logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              <path d="M12 6h4" />
              <path d="M12 10h4" />
            </svg>
          </div>
          <div className="public-nav__brand-text">
            <span className="public-nav__title">Naskara<span className="public-nav__badge-sm">Academic</span></span>
            <span className="public-nav__subtitle">Generator Laporan Vokasi</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className={`public-nav__links ${mobileMenuOpen ? 'is-open' : ''}`}>
          <Link
            to="/"
            className={`public-nav__link ${isActive('/') ? 'is-active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Beranda
          </Link>
          <Link
            to="/format-guide"
            className={`public-nav__link ${isActive('/format-guide') ? 'is-active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Panduan Format SMKN 4
          </Link>
          <Link
            to="/about"
            className={`public-nav__link ${isActive('/about') ? 'is-active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Tentang Kami
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="public-nav__actions">
          {token && user ? (
            <div className="public-nav__user-group">
              <Link to="/dashboard" className="btn-sm btn-primary">
                <IconDashboard size={16} style={{ marginRight: '0.4rem' }} /> Buka Dashboard
              </Link>
              <button
                onClick={() => { logout(); nav('/login') }}
                className="btn-sm btn-outline"
                title="Keluar akun"
              >
                Keluar
              </button>
            </div>
          ) : (
            <div className="public-nav__auth-group">
              <Link to="/login" className="public-nav__link-login">
                Masuk
              </Link>
              <Link to="/register" className="btn-sm btn-primary">
                Buat Laporan Gratis
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            className="public-nav__toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileMenuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
