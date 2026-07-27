# Format Laporan PKL (Praktik Kerja Lapangan) SMK

**Gunakan saat user minta bikin LAPORAN PKL.**

---

## 🔴 Aturan Mutlak

SAMA dengan makalah — lihat references/makalah-format.md bagian 🔴 Aturan Mutlak.

Intinya: No bullet (•), TNR 12pt, 1.5 spasi, margin 4-4-3-3, justify.

---

## Perbedaan Laporan PKL vs Makalah

| Aspek | Makalah | Laporan PKL |
|-------|---------|-------------|
| Tujuan | Tugas / topik umum | Dokumentasi PKL di perusahaan |
| BAB II | Tinjauan Pustaka / teori | Profil Perusahaan |
| BAB III | Metode / Pembahasan | Pelaksanaan PKL |
| Lampiran | Opsional | WAJIB logbook surat foto |
| Lembar tambahan | Cover + Pengesahan | + Pernyataan Keaslian + Nilai |

---

## Cara Saya Nentuin Struktur

Saya ANALISIS prompt user + project codebase untuk nentuin struktur:

| Indikator di Prompt | Simpulan |
|---------------------|----------|
| User bilang "laporan PKL" | Pake format laporan PKL |
| User bilang nama perusahaan | Profil Perusahaan wajib di BAB II |
| User bilang "project" / "aplikasi" / "Flutter" | BAB khusus project |
| User gak bilang berapa BAB | Saya tentuin sendiri (biasanya 3-5) |
| User bilang "3 BAB" | Sesuai permintaan |

### Contoh Analisis

Prompt: "Buat laporan PKL dari project Kantin Digital di PT Maju Jaya"
Analisis:
- Laporan PKL
- Tempat: PT Maju Jaya  BAB II Profil Perusahaan
- Ada project Flutter  BAB III Pelaksanaan
- Butuh screenshot  BAB IV Hasil
- 5 BAB cocok

Prompt: "Buat laporan kegiatan PKL selama 2 bulan"
Analisis:
- Gak ada project spesifik
- Fokus ke kegiatan
- 3 BAB cukup: Pendahuluan  Kegiatan  Penutup

---

## Panduan Cepat

1. Load file ini
2. Analisis prompt + project
3. Tentukan struktur sendiri
4. Load helper dari references/makalah-format.md
5. Generate script  kirim .docx

### Helper Functions

Gunakan helper functions yang SAMA PERSIS dengan references/makalah-format.md.
