/**
 * Utility Pemolesan Bahasa Indonesia Formal & Akademis (KBBI / EYD) untuk Laporan PKL.
 * Mengubah ketikan/slang santai siswa menjadi kalimat akademis baku.
 */
export function polishAcademicText(text: string): string {
  if (!text || typeof text !== 'string') return ''

  // Strip section delimiter markers automatically
  let t = text.replace(/<<<.*?>>>/g, '').replace(/===.*?===/g, '').replace(/<<</g, '').replace(/>>>/g, '').trim()
  if (!t) return ''

  const replacements: [RegExp, string][] = [
    [/\bbikin\b/gi, 'Membuat'],
    [/\bpakai\b/gi, 'menggunakan'],
    [/\bngoding\b/gi, 'melakukan pemrograman'],
    [/\bngetes\b/gi, 'melakukan pengujian'],
    [/\bngedit\b/gi, 'melakukan penyuntingan'],
    [/\bbantu\b/gi, 'membantu'],
    [/\bfixing\b/gi, 'memperbaiki'],
    [/\bfix\b/gi, 'memperbaiki'],
    [/\bsetup\b/gi, 'menyiapkan'],
    [/\bhandling\b/gi, 'penanganan'],
    [/\bmasukkin\b/gi, 'memasukkan'],
    [/\bi'm\b/gi, 'Penulis'],
    [/\b[Nn]tegrasi\b/g, 'Integrasi'],
    [/\b[Aa]plikas\b/g, 'Aplikasi'],
    [/\b[Mm]engambangkan\b/g, 'Mengembangkan'],
    [/\b[Pp]rogram\b/g, 'Program'],
    [/\b[Pp]rosesh\b/g, 'Proses'],
  ]

  for (const [pattern, replacement] of replacements) {
    t = t.replace(pattern, replacement)
  }

  // Kapitalisasi huruf pertama
  if (t && t[0] === t[0].toLowerCase() && t[0] !== t[0].toUpperCase()) {
    t = t[0].toUpperCase() + t.slice(1)
  }

  // Pastikan diakhiri titik jika merupakan kalimat utuh (bukan list item pendek)
  if (t && !t.endsWith('.') && !t.endsWith('!') && !t.endsWith('?')) {
    t += '.'
  }

  return t
}

/**
 * Pemolesan untuk array string (seperti list tugas, misi, tata tertib).
 */
export function polishAcademicList(list: string[]): string[] {
  if (!Array.isArray(list)) return []
  return list.map((item) => polishAcademicText(item)).filter(Boolean)
}

/**
 * Pembersihan khusus untuk naskah Kesimpulan dan Saran (BAB VI).
 * Memastikan tag marker mentah seperti [KESIMPULAN] dan [SARAN] dibersihkan sepenuhnya
 * dari text area editor agar narasi terlihat bersih dan profesional.
 */
export function cleanKesimpulanSaran(text: string | string[]): string {
  const raw = Array.isArray(text) ? text.join('\n') : (text || '')
  if (!raw.trim()) return ''

  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean)
  const cleanedLines: string[] = []

  for (const line of lines) {
    const unbulleted = line.replace(/^[-\*•]\s*/, '').trim()
    const tagUpper = unbulleted.replace(/\.$/, '').toUpperCase().trim()

    // Buang tag marker [KESIMPULAN], [SARAN], KESIMPULAN:, SARAN: dll.
    if (
      tagUpper === '[KESIMPULAN]' ||
      tagUpper === '[SARAN]' ||
      tagUpper === 'KESIMPULAN' ||
      tagUpper === 'SARAN' ||
      tagUpper === 'KESIMPULAN:' ||
      tagUpper === 'SARAN:'
    ) {
      continue
    }
    cleanedLines.push(unbulleted)
  }

  return cleanedLines.join('\n').trim()
}
