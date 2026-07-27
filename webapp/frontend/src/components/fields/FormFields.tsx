import { useState, type ReactNode } from 'react'
import { uploadAsset } from '@/api/client'

/** Field primitives reusable di semua wizard step. */

type Importance = 'wajib' | 'penting' | 'opsional'

/**
 * Penanda tingkat kepentingan field.
 *
 * Teks penjelas disertakan sebagai <span> ber-class "sr-only" (bukan hanya
 * atribut `title`) karena tooltip tidak pernah muncul di perangkat sentuh dan
 * tidak dibacakan screen reader. Arti tiap tingkat dijelaskan oleh
 * <ImportanceLegend /> di bagian atas setiap step.
 */
function renderImportance(required?: boolean, importance?: Importance) {
  if (required || importance === 'wajib')
    return (
      <span className="field__req">
        *<span className="sr-only"> (wajib diisi)</span>
      </span>
    )
  if (importance === 'penting')
    return (
      <span className="field__badge field__badge--penting">
        Penting<span className="sr-only"> — sangat disarankan diisi</span>
      </span>
    )
  if (importance === 'opsional')
    return (
      <span className="field__badge field__badge--opsional">
        Opsional<span className="sr-only"> — boleh dikosongkan</span>
      </span>
    )
  return null
}

/**
 * Legenda arti penanda field. Dipasang sekali di atas tiap step supaya siswa
 * tidak perlu menebak beda "*", "Penting", dan "Opsional".
 */
export function ImportanceLegend() {
  return (
    <ul className="legend">
      <li>
        <span className="field__req" aria-hidden="true">*</span> Wajib — laporan tidak bisa dibuat tanpa ini
      </li>
      <li>
        <span className="field__badge field__badge--penting" aria-hidden="true">Penting</span> Boleh dilewati, tapi
        laporan jadi kurang lengkap
      </li>
      <li>
        <span className="field__badge field__badge--opsional" aria-hidden="true">Opsional</span> Kosongkan saja kalau
        tidak punya datanya
      </li>
    </ul>
  )
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
  importance,
  type = 'text',
  hint,
  readOnly,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
  importance?: Importance
  type?: 'text' | 'email' | 'tel' | 'number' | 'date'
  hint?: string
  /**
   * Field diisi otomatis oleh sistem. Memakai `readOnly` (bukan
   * `pointer-events: none`) supaya statusnya ikut dibacakan screen reader dan
   * tidak bisa difokus lalu diedit lewat keyboard.
   */
  readOnly?: boolean
}) {
  return (
    <label className={`field${readOnly ? ' field--auto' : ''}`}>
      <span className="field__label">
        {label} {renderImportance(required, importance)}
        {readOnly && <span className="field__badge field__badge--auto">Terisi otomatis</span>}
      </span>
      <input
        className="field__input"
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        required={required || importance === 'wajib'}
        readOnly={readOnly}
        aria-readonly={readOnly || undefined}
      />
      {hint && <span className="field__hint">{hint}</span>}
    </label>
  )
}

export function NumberField({
  label,
  value,
  onChange,
  placeholder,
  importance,
  required,
  hint,
  readOnly,
}: {
  label: string
  value: number | null
  onChange: (v: number | null) => void
  placeholder?: string
  importance?: Importance
  required?: boolean
  hint?: string
  readOnly?: boolean
}) {
  return (
    <label className={`field${readOnly ? ' field--auto' : ''}`}>
      <span className="field__label">
        {label} {renderImportance(required, importance)}
        {readOnly && <span className="field__badge field__badge--auto">Terisi otomatis</span>}
      </span>
      <input
        className="field__input"
        type="number"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        required={required || importance === 'wajib'}
        readOnly={readOnly}
        aria-readonly={readOnly || undefined}
      />
      {hint && <span className="field__hint">{hint}</span>}
    </label>
  )
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  required,
  importance,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { label: string; value: string }[]
  required?: boolean
  importance?: Importance
  hint?: string
}) {
  return (
    <label className="field">
      <span className="field__label">
        {label} {renderImportance(required, importance)}
      </span>
      <select
        className="field__input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required || importance === 'wajib'}
      >
        <option value="" disabled>Pilih {label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && <span className="field__hint">{hint}</span>}
    </label>
  )
}

export function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  importance,
  required,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  importance?: Importance
  required?: boolean
  hint?: string
}) {
  return (
    <label className="field">
      <span className="field__label">
        {label} {renderImportance(required, importance)}
      </span>
      <textarea
        className="field__input"
        value={value}
        placeholder={placeholder}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        required={required || importance === 'wajib'}
      />
      {hint && <span className="field__hint">{hint}</span>}
    </label>
  )
}

export function FieldGroup({
  title,
  children,
  full,
}: {
  title: string
  children: ReactNode
  /** Saat true, body memakai satu kolom penuh (untuk tabel / repeater lebar). */
  full?: boolean
}) {
  return (
    <div className="field-group">
      <h3 className="field-group__title">{title}</h3>
      <div className={`field-group__body${full ? ' field-group__body--full' : ''}`}>{children}</div>
    </div>
  )
}

export function ImageUploadField({
  label,
  value,
  onChange,
  importance,
  required,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  importance?: Importance
  required?: boolean
  hint?: string
}) {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setErr('')
    try {
      const res = await uploadAsset(file, 'struktur_organisasi')
      onChange(res.filename)
    } catch (error: any) {
      setErr(error.message || 'Gagal mengupload gambar')
    } finally {
      setLoading(false)
      // Reset supaya memilih file yang sama masih memicu onChange.
      e.target.value = ''
    }
  }

  return (
    <label className="field">
      <span className="field__label">
        {label} {renderImportance(required, importance)}
      </span>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFile}
          disabled={loading}
          className="field__input"
          style={{ padding: '0.4rem', flex: 1 }}
        />
        {loading && <span className="muted" style={{ fontSize: '0.85rem' }}>Mengunggah...</span>}
      </div>
      {err && <span className="error" style={{ fontSize: '0.85rem' }}>{err}</span>}
      {value && !loading && (
        <div style={{ marginTop: '0.35rem' }}>
          {/* Pratinjau gambar yang sudah terunggah */}
          <img
            src={`/api/uploads/assets/${value}`}
            alt={label}
            style={{
              maxWidth: 220, maxHeight: 140, display: 'block',
              borderRadius: 6, border: '1px solid var(--line)',
              background: 'var(--paper-2)',
            }}
          />
          <div style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '0.3rem', fontWeight: 500 }}>
            ✓ Terunggah ({value}) — pilih file lain untuk mengganti
          </div>
        </div>
      )}
      {hint && <span className="field__hint">{hint}</span>}
    </label>
  )
}

/**
 * Repeater untuk array sederhana (string[]). Tombol tambah/hapus baris.
 * Dipakai untuk: misi[], tata_tertib[], pelajaran[], daftar_pustaka[], hierarki_terima_kasih[].
 */
export function StringArrayField({
  label,
  items,
  onChange,
  placeholder,
  addLabel = '+ Tambah',
  required,
  importance,
  hint,
  itemNoun = 'baris',
}: {
  label: string
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
  addLabel?: string
  required?: boolean
  importance?: Importance
  hint?: string
  /** Kata benda untuk baris, dipakai di label tombol & konfirmasi hapus. */
  itemNoun?: string
}) {
  const update = (i: number, v: string) => {
    const next = [...items]
    next[i] = v
    onChange(next)
  }
  const add = () => onChange([...items, ''])

  /**
   * Konfirmasi hanya saat baris sudah berisi teks. Menghapus baris kosong tidak
   * merugikan siapa pun, jadi tidak perlu diganggu dengan dialog.
   */
  const remove = (i: number) => {
    const isi = items[i]?.trim()
    if (isi && !confirm(`Hapus ${itemNoun} ini?\n\n"${isi}"`)) return
    onChange(items.filter((_, idx) => idx !== i))
  }

  return (
    <div className="field field--full">
      <span className="field__label">
        {label} {renderImportance(required, importance)}
      </span>
      {hint && <span className="field__hint" style={{ marginBottom: '0.5rem' }}>{hint}</span>}
      <div className="array">
        {items.map((item, i) => (
          <div key={i} className="array__row">
            <span className="array__num" aria-hidden="true">{i + 1}.</span>
            <input
              className="field__input"
              value={item}
              placeholder={placeholder}
              aria-label={`${label} ${itemNoun} ${i + 1}`}
              onChange={(e) => update(i, e.target.value)}
            />
            <button
              type="button"
              className="btn-sm btn-danger array__remove"
              onClick={() => remove(i)}
              aria-label={`Hapus ${itemNoun} ${i + 1}`}
              title={`Hapus ${itemNoun} ${i + 1}`}
            >
              ✕
            </button>
          </div>
        ))}
        <button type="button" className="btn-sm btn-outline array__add" onClick={add}>
          {addLabel}
        </button>
      </div>
    </div>
  )
}

export function ImageArrayUploadField({
  label,
  items,
  onChange,
  hint,
}: {
  label: string
  items: string[]
  onChange: (items: string[]) => void
  hint?: string
}) {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setErr('')
    try {
      const res = await uploadAsset(file, 'lampiran')
      onChange([...items, res.filename])
    } catch (error: any) {
      setErr(error.message || 'Gagal mengupload gambar')
    } finally {
      setLoading(false)
    }
  }

  const remove = (i: number) => {
    if (!confirm(`Hapus gambar ini dari lampiran?\n\n${items[i]}`)) return
    onChange(items.filter((_, idx) => idx !== i))
  }

  return (
    <div className="field field--full">
      <span className="field__label">{label}</span>
      {hint && <span className="field__hint" style={{ marginBottom: '0.5rem' }}>{hint}</span>}
      <div className="array">
        {items.map((item, i) => (
          <div key={i} className="array__row" style={{ alignItems: 'center' }}>
            <span style={{ flex: 1, fontSize: '0.9rem', color: 'var(--text)', background: 'var(--bg-secondary)', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
              🖼️ {item}
            </span>
            <button
              type="button"
              className="btn-sm btn-danger array__remove"
              onClick={() => remove(i)}
              aria-label={`Hapus gambar ${item}`}
              title="Hapus gambar ini"
            >
              ✕
            </button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.5rem' }}>
          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            disabled={loading}
            className="field__input"
            style={{ padding: '0.4rem', maxWidth: '300px' }}
          />
          {loading && <span className="muted" style={{ fontSize: '0.85rem' }}>Mengunggah...</span>}
        </div>
        {err && <span className="error" style={{ fontSize: '0.85rem' }}>{err}</span>}
      </div>
    </div>
  )
}
