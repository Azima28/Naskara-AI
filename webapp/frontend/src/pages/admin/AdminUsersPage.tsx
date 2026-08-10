import React, { useEffect, useState } from 'react'
import {
  createAdminUser,
  deleteUser,
  listAdminUsers,
  resetUserPassword,
  toggleUserStatus,
  updateUserRole,
} from '@/api/client'
import type { UserManagementItem, UserRole } from '@/types/api'
import NotificationModal from '@/components/common/NotificationModal'
import { useAuth } from '@/store/auth'
import {
  IconCheck,
  IconCross,
  IconKey,
  IconPlus,
  IconTrash,
  IconUsers,
} from '@/components/common/Icons'

export default function AdminUsersPage() {
  const currentUser = useAuth((s) => s.user)
  const [users, setUsers] = useState<UserManagementItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({ email: '', name: '', password: '', role: 'siswa' })
  const [resetTarget, setResetTarget] = useState<UserManagementItem | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<UserManagementItem | null>(null)

  const [notice, setNotice] = useState<{ title: string; message: string; type: 'success' | 'error' } | null>(null)

  const loadUsers = async () => {
    setLoading(true)
    try {
      const res = await listAdminUsers({ search: search.trim(), role: roleFilter || undefined })
      setUsers(res.items)
      setTotal(res.total)
    } catch (err: any) {
      setNotice({ title: 'Error', message: err?.response?.data?.detail || 'Gagal memuat daftar pengguna.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [search, roleFilter])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createAdminUser(addForm)
      setNotice({ title: 'Sukses', message: `User ${addForm.email} berhasil dibuat.`, type: 'success' })
      setShowAddModal(false)
      setAddForm({ email: '', name: '', password: '', role: 'siswa' })
      loadUsers()
    } catch (err: any) {
      setNotice({ title: 'Gagal Tambah User', message: err?.response?.data?.detail || 'Gagal menambah user.', type: 'error' })
    }
  }

  const handleRoleChange = async (user: UserManagementItem, newRole: UserRole) => {
    if (user.id === currentUser?.id && newRole !== 'admin') {
      setNotice({ title: 'Peringatan', message: 'Anda tidak dapat menurunkan role akun admin Anda sendiri.', type: 'error' })
      return
    }
    try {
      await updateUserRole(user.id, newRole)
      setNotice({ title: 'Role Diperbarui', message: `Role ${user.email} diubah menjadi ${newRole}.`, type: 'success' })
      loadUsers()
    } catch (err: any) {
      setNotice({ title: 'Error', message: err?.response?.data?.detail || 'Gagal merubah role user.', type: 'error' })
    }
  }

  const handleStatusToggle = async (user: UserManagementItem) => {
    if (user.id === currentUser?.id && user.is_active) {
      setNotice({ title: 'Peringatan', message: 'Anda tidak dapat menonaktifkan akun admin Anda sendiri.', type: 'error' })
      return
    }
    try {
      await toggleUserStatus(user.id, !user.is_active)
      setNotice({
        title: 'Status Diperbarui',
        message: `Status akun ${user.email} diubah menjadi ${!user.is_active ? 'Aktif' : 'Non-Aktif'}.`,
        type: 'success',
      })
      loadUsers()
    } catch (err: any) {
      setNotice({ title: 'Error', message: err?.response?.data?.detail || 'Gagal mengubah status user.', type: 'error' })
    }
  }

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetTarget || !newPassword) return
    try {
      await resetUserPassword(resetTarget.id, newPassword)
      setNotice({ title: 'Sukses Reset Password', message: `Password user ${resetTarget.email} telah diperbarui.`, type: 'success' })
      setResetTarget(null)
      setNewPassword('')
    } catch (err: any) {
      setNotice({ title: 'Error', message: err?.response?.data?.detail || 'Gagal reset password.', type: 'error' })
    }
  }

  const handleDeleteUserConfirm = async () => {
    if (!deleteTarget) return
    if (deleteTarget.id === currentUser?.id) {
      setNotice({ title: 'Peringatan', message: 'Anda tidak dapat menghapus akun admin Anda sendiri.', type: 'error' })
      setDeleteTarget(null)
      return
    }
    try {
      await deleteUser(deleteTarget.id)
      setNotice({ title: 'User Dihapus', message: `User ${deleteTarget.email} beserta seluruh data draftnya telah dihapus.`, type: 'success' })
      setDeleteTarget(null)
      loadUsers()
    } catch (err: any) {
      setNotice({ title: 'Error', message: err?.response?.data?.detail || 'Gagal menghapus user.', type: 'error' })
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--ink)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconUsers size={24} color="var(--green-600)" /> Manajemen Pengguna ({total} User) &amp; Otorisasi RBAC
          </h1>
          <p style={{ color: 'var(--ink-soft)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
            Kelola daftar akun pengguna, penetapan peran (Admin, Siswa), reset password, dan status aktif.
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn--primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <IconPlus size={16} /> Tambah User Baru
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', background: 'var(--surface)', padding: '16px', borderRadius: '8px', border: '1px solid var(--line)' }}>
        <input
          type="text"
          placeholder="Cari berdasarkan nama atau email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input"
          style={{ flex: 1 }}
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="form-input" style={{ width: '180px' }}>
          <option value="">Semua Role</option>
          <option value="siswa">Siswa</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* User Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: 'var(--paper)', borderBottom: '1px solid var(--line)', color: 'var(--ink-soft)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 16px' }}>Pengguna</th>
              <th style={{ padding: '12px 16px' }}>Role / Hak Akses</th>
              <th style={{ padding: '12px 16px' }}>Status Akun</th>
              <th style={{ padding: '12px 16px' }}>Jumlah Draft</th>
              <th style={{ padding: '12px 16px' }}>Terakhir Login</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--ink-soft)' }}>
                  Memuat data pengguna...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--ink-soft)' }}>
                  Tidak ada pengguna ditemukan.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{u.name || 'Tanpa Nama'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)' }}>{u.email}</div>
                  </td>

                  <td style={{ padding: '12px 16px' }}>
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        border: '1px solid var(--line)',
                        background: u.role === 'admin' ? 'var(--red-100, #fee2e2)' : 'var(--green-100, #dcfce7)',
                        color: u.role === 'admin' ? 'var(--red-600, #dc2626)' : 'var(--green-800, #166534)',
                      }}
                    >
                      <option value="siswa">Siswa</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>

                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => handleStatusToggle(u)}
                      style={{
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: u.is_active ? '#dcfce7' : '#fee2e2',
                        color: u.is_active ? '#15803d' : '#b91c1c',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {u.is_active ? <><IconCheck size={12} /> Aktif</> : <><IconCross size={12} /> Non-Aktif</>}
                    </button>
                  </td>

                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{u.draft_count} draft</td>

                  <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--ink-soft)' }}>
                    {u.last_login ? new Date(u.last_login).toLocaleString('id-ID') : 'Belum Pernah'}
                  </td>

                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        onClick={() => setResetTarget(u)}
                        className="btn btn--outline btn--sm"
                        style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <IconKey size={14} /> Reset Pass
                      </button>
                      <button
                        onClick={() => setDeleteTarget(u)}
                        className="btn btn--danger btn--sm"
                        style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <IconTrash size={14} /> Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Add User */}
      {showAddModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3 style={{ marginTop: 0 }}>Tambah User Baru</h3>
            <form onSubmit={handleCreateUser}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Email</label>
                <input
                  type="email"
                  required
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Password (min 8 char)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Role</label>
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                  className="form-input"
                  style={{ width: '100%' }}
                >
                  <option value="siswa">Siswa</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn--outline">
                  Batal
                </button>
                <button type="submit" className="btn btn--primary">
                  Simpan User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reset Password */}
      {resetTarget && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3 style={{ marginTop: 0 }}>Reset Password ({resetTarget.email})</h3>
            <form onSubmit={handleResetPasswordSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Password Baru (min 8 karakter)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setResetTarget(null)} className="btn btn--outline">
                  Batal
                </button>
                <button type="submit" className="btn btn--primary">
                  Simpan Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification Confirm Modal */}
      {deleteTarget && (
        <NotificationModal
          isOpen={true}
          type="error"
          title="Konfirmasi Hapus User"
          message={`Apakah Anda yakin ingin menghapus akun ${deleteTarget.email}? Seluruh draft dan file miliknya akan terhapus secara permanen.`}
          confirmLabel="Hapus Permanen"
          onConfirm={handleDeleteUserConfirm}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {notice && (
        <NotificationModal
          isOpen={true}
          type={notice.type}
          title={notice.title}
          message={notice.message}
          onClose={() => setNotice(null)}
        />
      )}
    </div>
  )
}

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
}

const modalContentStyle: React.CSSProperties = {
  background: 'var(--surface)',
  padding: '24px',
  borderRadius: '8px',
  width: '100%',
  maxWidth: '440px',
  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
}
