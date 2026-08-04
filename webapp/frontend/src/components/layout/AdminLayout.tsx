import React from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import {
  IconActivity,
  IconArrowLeft,
  IconDashboard,
  IconDocument,
  IconGear,
  IconImage,
  IconLogOut,
  IconShield,
  IconUsers,
} from '@/components/common/Icons'

export default function AdminLayout() {
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const roleLabel = user?.role === 'admin' ? 'ADMIN PANEL' : 'GURU PANEL'
  const roleBadgeStyle: React.CSSProperties = {
    background: user?.role === 'admin' ? 'var(--red-100, #fee2e2)' : 'var(--blue-100, #dbeafe)',
    color: user?.role === 'admin' ? 'var(--red-600, #dc2626)' : 'var(--blue-700, #1d4ed8)',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.05em',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--line)',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--green-600)', letterSpacing: '-0.02em' }}>
              Naskara AI
            </span>
            <span style={roleBadgeStyle}>
              <IconShield size={12} /> {roleLabel}
            </span>
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link
            to="/dashboard"
            className="btn btn--outline btn--sm"
            style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <IconArrowLeft size={14} /> Ke Dashboard Siswa
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink)' }}>{user?.name || 'Administrator'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>{user?.email}</div>
            </div>
            <button onClick={handleLogout} className="btn btn--secondary btn--sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <IconLogOut size={14} /> Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Body: Sidebar + Content Shell */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar Navigation */}
        <aside
          style={{
            width: '240px',
            background: 'var(--surface)',
            borderRight: '1px solid var(--line)',
            padding: '24px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', paddingLeft: '8px', marginBottom: '8px' }}>
            Menu Utama
          </div>

          <NavLink
            to="/admin"
            end
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--green-600)' : 'var(--ink)',
              background: isActive ? 'var(--green-50, #f0fdf4)' : 'transparent',
            })}
          >
            <IconDashboard size={18} /> Ringkasan Overview
          </NavLink>

          <NavLink
            to="/admin/users"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--green-600)' : 'var(--ink)',
              background: isActive ? 'var(--green-50, #f0fdf4)' : 'transparent',
            })}
          >
            <IconUsers size={18} /> Manajemen User
          </NavLink>

          <NavLink
            to="/admin/drafts"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--green-600)' : 'var(--ink)',
              background: isActive ? 'var(--green-50, #f0fdf4)' : 'transparent',
            })}
          >
            <IconDocument size={18} /> Moderasi Draft PKL
          </NavLink>

          <NavLink
            to="/admin/assets"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--green-600)' : 'var(--ink)',
              background: isActive ? 'var(--green-50, #f0fdf4)' : 'transparent',
            })}
          >
            <IconImage size={18} /> Audit Storage &amp; Media
          </NavLink>

          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', paddingLeft: '8px', marginTop: '16px', marginBottom: '8px' }}>
            Sistem &amp; Konfigurasi
          </div>

          <NavLink
            to="/admin/settings"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--green-600)' : 'var(--ink)',
              background: isActive ? 'var(--green-50, #f0fdf4)' : 'transparent',
            })}
          >
            <IconGear size={18} /> Template &amp; AI Settings
          </NavLink>

          <NavLink
            to="/admin/logs"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--green-600)' : 'var(--ink)',
              background: isActive ? 'var(--green-50, #f0fdf4)' : 'transparent',
            })}
          >
            <IconActivity size={18} /> Audit Logs &amp; Health
          </NavLink>
        </aside>

        {/* Dynamic Outlet Body */}
        <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
