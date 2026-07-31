import { IconLightbulb, IconSparkles } from '@/components/common/Icons'

interface AntiAIHighlighterProps {
  text: string
  onReplace?: (newText: string) => void
}

const AI_WORD_MAP: Record<string, string> = {
  'robust': 'handal',
  'scalable': 'dapat dikembangkan',
  'seamless': 'lancar',
  'leverage': 'memanfaatkan',
  'facilitate': 'membantu',
  'enhance': 'meningkatkan',
  'era globalisasi': 'saat ini',
  'revolusioner': 'baru',
}

export default function AntiAIHighlighter({ text, onReplace }: AntiAIHighlighterProps) {
  if (!text) return null

  const lowerText = text.toLowerCase()
  const foundEntries = Object.entries(AI_WORD_MAP).filter(([word]) => lowerText.includes(word))

  if (foundEntries.length === 0) return null

  const handleReplaceSingle = (word: string, replacement: string) => {
    if (!onReplace) return
    const regex = new RegExp(word, 'gi')
    const updated = text.replace(regex, replacement)
    onReplace(updated)
  }

  const handleReplaceAll = () => {
    if (!onReplace) return
    let updated = text
    foundEntries.forEach(([word, replacement]) => {
      const regex = new RegExp(word, 'gi')
      updated = updated.replace(regex, replacement)
    })
    onReplace(updated)
  }

  return (
    <div
      style={{
        marginTop: '0.75rem',
        padding: '0.85rem 1rem',
        backgroundColor: 'var(--amber-100, #f6ead0)',
        border: '1px solid var(--amber-200, #e6d3a8)',
        borderRadius: '8px',
        fontSize: '0.86rem',
        color: 'var(--amber-700, #92610c)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <strong style={{ fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <IconLightbulb size={16} /> Saran Variasi Kata Laporan Akademis
        </strong>
        {onReplace && (
          <button
            type="button"
            className="btn-sm"
            onClick={handleReplaceAll}
            style={{
              padding: '0.25rem 0.6rem',
              fontSize: '0.78rem',
              background: 'var(--amber-700, #92610c)',
              borderColor: 'var(--amber-800, #784e09)',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            <IconSparkles size={14} /> Ganti dengan Kata Alternatif
          </button>
        )}
      </div>

      <p style={{ margin: '0 0 0.5rem 0', lineHeight: 1.5 }}>
        Berikut beberapa pilihan kata baku alternatif untuk memperkaya laporanmu:
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        {foundEntries.map(([word, replacement], i) => (
          <span
            key={i}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              backgroundColor: 'var(--surface, #fffdf8)',
              border: '1px solid var(--line, #ddd6c8)',
              padding: '0.2rem 0.5rem',
              borderRadius: '6px',
              fontSize: '0.82rem',
              color: 'var(--ink, #262521)',
            }}
          >
            <span style={{ textDecoration: 'line-through', opacity: 0.7 }}>{word}</span>
            <span style={{ color: 'var(--green-700, #14614a)', fontWeight: 600 }}>→ {replacement}</span>
            {onReplace && (
              <button
                type="button"
                onClick={() => handleReplaceSingle(word, replacement)}
                title={`Ganti "${word}" dengan "${replacement}"`}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '0 2px',
                  cursor: 'pointer',
                  color: 'var(--green-700, #14614a)',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  marginLeft: '2px',
                }}
              >
                ✓
              </button>
            )}
          </span>
        ))}
      </div>
    </div>
  )
}
