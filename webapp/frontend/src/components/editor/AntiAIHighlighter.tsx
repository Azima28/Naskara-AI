
const AI_WORDS = [
  'signifikan', 'implementasi', 'optimal', 'kompleks', 'kolaborasi',
  'transformasi', 'inovasi', 'eksplorasi', 'esensial', 'robust',
  'scalable', 'seamless', 'leverage', 'facilitate', 'enhance',
  'era globalisasi', 'perkembangan teknologi', 'revolusioner',
  'oleh karena itu', 'di samping itu', 'selain itu', 'dengan demikian',
  'hal tersebut', 'sangat penting', 'diharapkan dapat', 'berperan penting',
  'memberikan kontribusi'
]

export default function AntiAIHighlighter({ text }: { text: string }) {
  if (!text) return null

  const lowerText = text.toLowerCase()
  const foundWords = AI_WORDS.filter(word => lowerText.includes(word))

  if (foundWords.length === 0) return null

  return (
    <div style={{
      marginTop: '0.5rem',
      padding: '0.75rem',
      backgroundColor: '#fff3cd',
      border: '1px solid #ffe69c',
      borderRadius: '4px',
      fontSize: '0.875rem',
      color: '#664d03'
    }}>
      <strong>Peringatan Gaya Bahasa AI</strong>
      <p style={{ margin: '0.25rem 0 0 0' }}>
        Terdapat kata/frasa yang sering digunakan oleh AI: 
        {foundWords.map((w, i) => (
          <span key={i} style={{ 
            display: 'inline-block',
            backgroundColor: '#ffc107', 
            padding: '0.1rem 0.3rem', 
            borderRadius: '3px',
            margin: '0 0.2rem',
            fontWeight: 'bold'
          }}>
            {w}
          </span>
        ))}
      </p>
      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem' }}>
        Disarankan untuk mengubah frasa tersebut agar tulisan terdengar lebih natural dan "humanis".
      </p>
    </div>
  )
}
