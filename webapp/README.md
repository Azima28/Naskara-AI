# Naskara AI (Web App)

Aplikasi web local-first untuk membantu siswa SMK menyusun Laporan Praktik Kerja Lapangan (PKL) sesuai standar akademik Indonesia. Aplikasi ini mencakup wizard form 11 langkah, integrasi AI lokal (via 9router) untuk menyusun draf narasi, dan generator file `.docx` dengan presisi tingkat tinggi.

## 🚀 Fitur Utama
1. **Wizard 11 Langkah:** Pengisian data terstruktur (Siswa, Sekolah, Perusahaan, Kegiatan, dll).
2. **Auto-Save:** Draft otomatis tersimpan di SQLite lokal.
3. **AI Draf Naratif:** Membuat draf latar belakang, profil, dan pembahasan spesifik per jurusan tanpa generic AI clichés.
4. **Anti-AI Highlighter:** Mendeteksi penggunaan frasa klise AI pada saat review.
5. **Presisi .docx:** Format presisi sesuai standar (TNR 12pt, Margin 4-4-3-3, Tab stop pengesahan, dan skema nomor halaman).

---

## 🛠️ Persyaratan Sistem
- Python 3.11+
- Node.js 18+ (atau 20+)
- **9router** (atau LM Studio / Ollama) untuk koneksi AI lokal. (Jika tidak aktif, aplikasi akan menggunakan mode Dummy Text).

---

## ⚙️ Cara Menjalankan (Local Development)

Aplikasi ini menggunakan pendekatan Monorepo terpisah antara `backend` (FastAPI) dan `frontend` (React+Vite). Keduanya harus dijalankan secara bersamaan.

### 1. Menyiapkan Backend (FastAPI)
Buka terminal baru:
```bash
cd webapp/backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# Mac/Linux
source .venv/bin/activate

pip install -r requirements.txt
```

Salin contoh environment file:
```bash
cp .env.example .env
```
Lalu jalankan server backend:
```bash
uvicorn app.main:app --reload --port 8010
```
Backend akan berjalan di `http://localhost:8010`. Folder `pkl_reports.db` (SQLite) akan otomatis terbuat.

### 2. Menyiapkan Frontend (React + Vite)
Buka terminal baru:
```bash
cd webapp/frontend
npm install

# Jalankan development server
npm run dev
```
Frontend akan berjalan di `http://localhost:5173`. Frontend sudah dikonfigurasi untuk nge-proxy semua request `/api` ke `http://localhost:8010`.

---

## 🤖 Konfigurasi AI (9router / LM Studio)

Secara default, aplikasi akan mencari endpoint OpenAI-compatible di `http://localhost:1234/v1`.

Untuk mengubah provider AI ke layanan eksternal (seperti OpenAI atau Groq), cukup ubah variabel lingkungan di `webapp/backend/.env`:
```env
AI_ENABLED=True
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
AI_API_KEY=sk-xxxxxx
```
Jika `AI_ENABLED=False`, aplikasi akan membuat teks dummy tanpa gagal.

---

## 🗄️ Mengubah Database ke PostgreSQL

Aplikasi ini dirancang untuk mudah di-*scale* ke production multi-user. Karena menggunakan SQLAlchemy, Anda hanya perlu mengubah `DATABASE_URL` di `webapp/backend/.env`:

```env
# Dari:
DATABASE_URL=sqlite:///./pkl_reports.db

# Menjadi:
DATABASE_URL=postgresql://user:password@localhost:5432/pkl_db
```
Tidak ada kode yang perlu diubah.

---

## 🏗️ Struktur Proyek
- `backend/app/docx/`: Logika perakitan (assembly) dan formatter (builder) `.docx`.
- `backend/app/prompts/`: Template prompt AI dan basis pengetahuan per jurusan (AKL, TKJ, dll).
- `frontend/src/components/wizard/`: Form input 11-langkah.
- `frontend/src/pages/EditorPage.tsx`: Halaman editor dengan dukungan highlight anti-AI.
- `references/`: Sumber dokumen kanonik (schema, aturan jurusan) dari sistem awal.
