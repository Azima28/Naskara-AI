import { useEffect, useState } from 'react'
import { validateData } from '@/api/client'
import type { PklContext } from '@/types/pkl'
import type { ValidationResult } from '@/types/api'

/**
 * Bar kelengkapan live — memanggil /validate (debounced) saat context berubah.
 * Menampilkan skor % + jumlah blocking WAJIB.
 */
export default function CompletenessBar({ ctx }: { ctx: PklContext }) {
  const [result, setResult] = useState<ValidationResult | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      validateData(ctx)
        .then(setResult)
        .catch(() => setResult(null))
    }, 400) // debounce 400ms
    return () => clearTimeout(t)
  }, [ctx])

  const percent = result?.percent ?? 0
  const ready = result?.ready ?? false
  const blocking = result?.blocking.length ?? 0

  return (
    <div className="completeness">
      <div className="completeness__bar">
        <div
          className={`completeness__fill ${ready ? 'is-ready' : percent > 50 ? 'is-mid' : 'is-low'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="completeness__text">
        <strong>{percent}%</strong>
        <span className="muted">
          {' '}
          ({result?.score ?? 0}/{result?.max_score ?? 21})
        </span>
        {blocking > 0 && <span className="completeness__warn"> · {blocking} wajib belum isi</span>}
        {ready && <span className="completeness__ok"> · siap generate ✓</span>}
      </div>
    </div>
  )
}
