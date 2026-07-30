# Naskara AI — Dokumen Handoff

**Project**: Web app generator Laporan PKL SMK (.docx)
**Workspace**: `c:\Work\Project Ai\docx_skill_package`
**Last updated**: 2024-07-24
**Status**: Fase 0, 1, 2 selesai & terverifikasi ✅ | Fase 3 (docx pipeline) berikutnya

---

## Arsitektur (Keputusan yang Sudah Dikunci)

| Keputusan | Pilihan |
|---|---|
| Cara jalan | **Local-first** — laptop user saja sekarang, hosting nanti |
| Frontend | **React + Vite + TypeScript** |
| Backend | **FastAPI** (Python 3.11) |
| Model AI | **9router** (lokal) — OpenAI-compatible endpoint, configurable via env |
| Database | **SQLite** (SQLAlchemy, swap ke Postgres = ubah 1 connection string) |
| Auth | JWT (bcrypt + python-jose/passlib) |
| Alur konten BAB | **AI draft → review & edit di app** → generate .docx |

---

## Rencana 6 Fase (dari plan yang disetujui user)

### ✅ Fase 0 — Scaffold & Kontrak Data (SELESAI)
- [x] Backend FastAPI skeleton (`config.py`, `db.py`, `main.py`)
- [x] Pydantic schemas mirror `data-schema.md` → `schemas.py` (18 top-level keys)
- [x] Import `scripts/validate_pkl_data.py` as-is → `validation.py` wrapper
- [x] Endpoint: `GET /health`, `POST /validate`, `POST /recommend-bab`
- [x] Frontend Vite + React + TS, path alias `@/`, dev proxy `/api` → backend
- [x] TS types mirror Pydantic → `types/pkl.ts` + empty factories
- [x] API client → `api/client.ts`
- [x] **Verifikasi**: sample Niken → 21/21 (100%), empty → 0/21 + 9 blocking

### ✅ Fase 1 Backend — Auth & Drafts CRUD (SELESAI)
- [x] `models.py`: User + Draft (data_json = PklContext utuh)
- [x] `security.py`: bcrypt hash + JWT create/decode
- [x] `dependencies.py`: `get_current_user` dependency (decode Bearer token)
- [x] `routers/auth.py`: register, login, /me
- [x] `routers/drafts.py`: list, create, get, update (autosave), delete
- [x] Routers didaftarkan di `main.py`
- [x] **Verifikasi httpx**: 11 test semua passed (register/login/me/CRUD/wrong-pw/duplicate)

### ✅ Fase 1 Frontend — Auth & Dashboard (SELESAI)
- [x] React Router (halaman: /login, /register, /dashboard, /wizard/:id, /editor/:id)
- [x] Auth store (zustand): token + user di localStorage + restore on load
- [x] API client: axios interceptor auto-attach Bearer token
- [x] Halaman Login + Register + Dashboard (daftar draft + buat/hapus)
- [x] ProtectedRoute guard
- [x] **Verifikasi**: full flow via proxy (register/login/me/create/list) semua OK

### ✅ Fase 2 — Form Wizard 11 Langkah (SELESAI)
- [x] `WizardPage.tsx`: shell 11 langkah dengan stepper, autosave debounced 2s, save indicator
- [x] 11 step components (`components/wizard/steps/`):
  - ConfigStep (modul BAB checkbox + margin + tipografi)
  - SiswaStep, SekolahStep (kop + 4 pejabat), PerusahaanStep (pimpinan + hrd + pembimbing)
  - PklStep, ProfilStep (sejarah/visi/misi + jam_kerja + job_descriptions repeaters)
  - KegiatanStep (NESTED: kegiatan → tugas, add/remove, inti WAJIB)
  - StudiKasusStep (data_angka repeater), PeralatanKendalaStep (repeaters + pelajaran + refleksi)
  - ClosingStep (kata_pengantar + daftar_pustaka), AssetsStep (lampiran checkboxes)
- [x] `FormFields.tsx`: TextField, TextareaField, NumberField, FieldGroup, StringArrayField (reusable primitives)
- [x] `CompletenessBar`: mirror 20-poin skor live via /validate (debounced 400ms), 9 WAJIB gate
- [x] Autosave: PUT /drafts/:id kirim context utuh (keputusan: context utuh, bukan partial patch)
- [x] Navigasi: linear (keputusan: linear dengan progress bar, bukan sidebar)
- [x] CSS lengkap (stepper, field groups, nested cards, checkbox grid, simple table)
- [x] **Verifikasi**: tsc clean + build sukses (314KB JS) + flow test OK (create→autosave→reload→validate 9/21 ready)
- [ ] **BELUM**: upload gambar drag-and-drop (endpoint /uploads belum) — diundur ke setelah Fase 3
- [ ] **BELUM**: panel rekomendasi BAB di wizard (recommend_bab sudah ada endpoint, perlu UI)

### ⬜ Fase 3 — Pipeline Docx (BELUM DIMULAI)
- [ ] **Refactor** `references/docx-helpers-pkl.md` → `backend/app/docx/builder.py` `PklDocBuilder` (class stateless, `doc` bukan global)
- [ ] **Tulis baru** `backend/app/docx/assembly.py`: `assemble_report()` kodifikasi `front-matter-catalog.md` + `bab-catalog.md`
- [ ] `routers/generate.py`: POST /generate → validate → assemble → stream .docx
- [ ] Frontend: tombol Download di editor

### ⬜ Fase 4 — Integrasi AI (BELUM DIMULAI)
- [ ] `ai/provider.py`: abstrak `generate(system, user) -> str`
- [ ] `ai/client.py`: httpx client ke 9router (configurable base_url + model)
- [ ] `prompts/base.py`: system prompt + golden rules (no bullets, TNR spirit)
- [ ] `prompts/sections.py`: template per section (latar belakang, kesimpulan, …)
- [ ] `prompts/jurusan/`: fragmen per-jurusan dari `jurusan-knowledge.md`
- [ ] `routers/ai.py`: POST /ai/draft-section + /ai/regenerate
- [ ] Frontend `Editor.tsx`: panel per BAB section, pre-fill AI draft, editable, tombol regenerate

### ⬜ Fase 5 — Polish (BELUM DIMULAI)
- [ ] Highlighter anti-AI di editor (port `indonesian-akademik-humanis.md`)
- [ ] Settings panel (margin presets, font/spacing override, skip front-matter pages)
- [ ] Re-validate sebelum download + warning inline
- [ ] README lengkap (cara jalan, config 9router, swap DB/AI)

---

## Struktur File Saat Ini

```
docx_skill_package/
├── references/                        ← Sumber kebenaran (READ-ONLY, jangan ubah)
│   ├── bab-catalog.md                7 modul BAB + logika pemilihan (5 escalation rules)
│   ├── data-schema.md                JSON schema pkl-context.json (18 keys)
│   ├── docx-helpers-pkl.md           ~26KB helper python-docx (kode asli, script-level global doc)
│   ├── docx-js-reference.md           2KB Node.js cheatsheet (ref only, gak ada impl)
│   ├── formatting-defaults.md         TNR 12pt, 1.5, justify, margin 4-4-3-3, no bullets
│   ├── front-matter-catalog.md       10 halaman depan, presisi reverse-engineered
│   ├── indonesian-akademik-humanis.md 7.4KB anti-AI humanization rules
│   ├── interview-flow.md              5-phase interview (untuk skill-based, referensi saja)
│   ├── jurusan-knowledge.md          10 jurusan + case study templates + glossaries
│   ├── laporan-pkl-landasan-hukum.md UU/PP untuk BAB Landasan Teori
│   ├── *.legacy.md (3 file)          diabaikan
│   └── ...
│
├── scripts/
│   ├── validate_pkl_data.py           ⭐ Sumber kebenaran validasi (di-import backend)
│   └── ...
│
├── examples/
│   └── sample-pkl-data.json           ⭐ Data contoh lengkap Niken (AKL, PT Reksa Finance)
│
├── LAPORAN PKL NIKEN FIXED.docx      ⭐ Reference output .docx (untuk visual QA)
│
└── webapp/                            ← BARU (project web app)
    ├── backend/
    │   ├── .env                       config lokal (SECRET_KEY dev, AI_BASE_URL localhost:1234)
    │   ├── .env.example               template config
    │   ├── requirements.txt           deps: fastapi, sqlalchemy, pydantic, passlib, bcrypt==4.0.1, httpx, python-docx
    │   ├── .venv/                     Python 3.11 venv (bcrypt==4.0.1 PINNED — jangan upgrade)
    │   └── app/
    │       ├── __init__.py
    │       ├── main.py                 FastAPI app, CORS, router registration, /health + /validate + /recommend-bab
    │       ├── config.py               Settings (pydantic-settings), path constants, runtime dirs
    │       ├── db.py                   SQLAlchemy engine/session/get_db/init_db
    │       ├── models.py               User + Draft models
    │       ├── schemas.py              ⭐ Pydantic mirror 18-key data-schema.md + empty factories
    │       ├── security.py              bcrypt + JWT
    │       ├── dependencies.py         get_current_user (Bearer token dependency)
    │       ├── validation.py           ⭐ import validate_pkl_data asli + wrapper bertipe
    │       ├── routers/
    │       │   ├── __init__.py
    │       │   ├── auth.py             register/login/me (DONE, tested)
    │       │   └── drafts.py           CRUD + autosave (DONE, tested)
    │       ├── ai/                     (kosong, isi Fase 4)
    │       ├── docx/                  (kosong, isi Fase 3)
    │       └── prompts/                (kosong, isi Fase 4)
    │
    ├── frontend/
    │   ├── package.json               react + react-router-dom + zustand + axios
    │   ├── vite.config.ts             proxy /api → backend (target: 8003, ganti ke 8000 di prod)
    │   ├── tsconfig.app.json          path alias @/*
    │   ├── src/
    │   │   ├── main.tsx               entrypoint
    │   │   ├── index.css              minimal resets
    │   │   ├── App.tsx                ⭐ Shell Fase 0 (tes koneksi + validate button)
    │   │   ├── App.css                styling shell
    │   │   ├── types/
    │   │   │   ├── pkl.ts             ⭐ TS types mirror Pydantic + empty factories
    │   │   │   └── api.ts             ValidationResult, BabRecommendation, HealthResponse
    │   │   ├── api/
    │   │   │   └── client.ts          axios instance + getHealth/validateData/recommendBab
    │   │   ├── store/                 (kosong, isi Fase 1 frontend)
    │   │   ├── pages/                 (kosong, isi Fase 1 frontend)
    │   │   ├── components/            (kosong, isi Fase 2)
    │   │   └── lib/                   (kosong, isi Fase 2 — client-side validation mirror)
    │   └── ...
    │
    ├── uploads/.gitkeep
    ├── output/.gitkeep
    └── .gitignore
```

---

## Catatan Teknis Penting Untuk Agent Selanjutnya

### 1. Port Issues di Windows
- Port `8000` zombie (PID 6636 stuck di TIME_WAIT, gak bisa di-kill tanpa reboot). Backend sekarang jalan di **port 8010**.
- Vite proxy target di `vite.config.ts` = `http://127.0.0.1:8010`. Di produksi, ganti ke `8000` (atau reverse-proxy).
- Vite bind ke IPv6 `[::1]`/`localhost`, bukan `127.0.0.1`. Akses dev server lewat `http://localhost:5173`.
- **Untuk test backend**: pakai Python httpx via proxy (`http://localhost:5173/api/...`), bukan curl (curl Windows bermasalah di env ini).

### 2. bcrypt PINNED di 4.0.1
- `passlib` 1.7.4 **TIDAK kompatibel** dengan `bcrypt >= 4.1` (error `__about__.__version__`)
- `requirements.txt` sudah pin `bcrypt==4.0.1`. **JANGAN upgrade** kecuali juga upgrade passlib atau switch ke bcrypt langsung.

### 3. Validator Import Trick
- `validation.py` inject `scripts/` ke `sys.path` lalu import `validate_pkl_data` (modul asli di project root)
- Artinya backend harus dijalankan dari `webapp/backend/` (CWD-nya di situ, tapi sys.path resolve relatif ke file `validation.py` yang parents[3] = project root)
- Ini bekerja karena `__file__.resolve().parents[3]` = `docx_skill_package/`

### 4. Vite Proxy
- Frontend request ke `/api/*` → Vite rewrite ke backend (strip prefix `/api`)
- Jadi di frontend code: `axios.get('/api/health')` → backend menerima `GET /health`
- Di produksi (build static), butuh reverse proxy (nginx/caddy) atau serve frontend dari FastAPI static

### 5. Data Model — JSON di Kolom Tunggal
- `Draft.data_json` = PklContext utuh (18-key nested JSON) di satu kolom SQLite JSON
- Tidak dinormalisasi ke tabel terpisah karena struktur nested & dinamis
- Backend validate/generate bekerja pada dict utuh

### 6. docx-helpers-pkl.md — Kode BUKAN Pseudocode
- Semua fungsi di `references/docx-helpers-pkl.md` adalah **kode python-docx asli yang runnable**
- Tapi mereka mutasi satu **global `doc`** (baris 19: `doc = Document()`)
- Untuk web server, harus di-refactor jadi class `PklDocBuilder(doc)` yang stateless per-request
- Fungsi yang ada: setup_document, cover, pengesahan_industri, pengesahan_sekolah (tab 11.83/9.84cm!), identitas tables, kata_pengantar, daftar_isi (leader 13.5cm), body, headings, numbered/lettered, image, table, daftar_pustaka, spacing, save
- **Tidak ada assembler** — helper membangun elemen atomik, tidak ada yang menyusun BAB berurutan. Ini harus ditulis di Fase 3.

### 7. Presisi Nilai yang HARUS Dipertahankan
Dari reverse-engineering `LAPORAN PKL NIKEN FIXED.docx`:
- Tab stop Pengesahan Sekolah: label `11.83cm`, nama `9.84cm`
- Spacing Pengesahan Industri: `1.9`
- TOC leader tab stop: `13.5cm`
- Margin default: atas 4, bawah 3, kiri 4, kanan 3 (cm)
- Cover spacing: `1.15`
- Indent body: `1.27cm`, indent TTD: `11.43cm`
- Tanda tangan Pengesahan Sekolah: 3 ruang spacing (3 baris kosong)
- Page numbering: cover = none, front matter = lowercase Roman start 1, BAB = arabic start 1, switch setelah page break

---

## Langkah Selanjutnya (Yang Harus Dikerjakan Agent Baru)

### Prioritas 1: Fase 1 Frontend (Auth & Dashboard)

File yang perlu dibuat/diubah:

1. **`frontend/src/store/auth.ts`** — Zustand store
   ```ts
   // state: token, user (UserOut dari types/api), login(), register(), logout(), restore()
   // Persist ke localStorage
   ```

2. **`frontend/src/types/api.ts`** — Tambahkan:
   ```ts
   export interface UserOut { id: string; email: string; name: string }
   export interface TokenOut { access_token: string; token_type: string; user: UserOut }
   export interface DraftSummary { id: string; title: string; status: string; created_at: string; updated_at: string }
   export interface DraftOut { id: string; title: string; status: string; data: PklContext; created_at: string; updated_at: string }
   ```

3. **`frontend/src/api/client.ts`** — Tambahkan:
   - Axios interceptor: attach `Authorization: Bearer <token>` dari auth store
   - Fungsi: `register()`, `login()`, `getMe()`, `listDrafts()`, `createDraft()`, `getDraft()`, `updateDraft()`, `deleteDraft()`

4. **`frontend/src/main.tsx`** — Wrap `<App>` di `<BrowserRouter>`

5. **`frontend/src/App.tsx`** — Replace shell Fase 0 dengan `<Routes>`:
   - `/login` → LoginPage
   - `/register` → RegisterPage
   - `/dashboard` → DashboardPage (protected)
   - `/wizard/:draftId` → WizardPage (protected, Fase 2)
   - `/editor/:draftId` → EditorPage (protected, Fase 4)
   - ProtectedRoute component: redirect ke /login kalau gak punya token

6. **`frontend/src/pages/auth/LoginPage.tsx`** + **RegisterPage.tsx**
7. **`frontend/src/pages/Dashboard.tsx`** — List draft + tombol buat baru

### Prioritas 2: Fase 2 (Wizard)
Paling besar di frontend. `Wizard.tsx` + 11 step components + `ArrayField` reusable + `CompletenessBar` + upload + autosave.

### Prioritas 3: Fase 3 (Docx Pipeline)
Backend only. Refactor helper → `PklDocBuilder` class, tulis `assembly.py`, endpoint `/generate`.

### Prioritas 4: Fase 4 (AI)
Provider abstraction + prompts + editor per-section.

### Prioritas 5: Fase 5 (Polish)
README + anti-AI highlighter + settings.

---

## Cara Jalankan

```bash
# Backend
cd webapp/backend
.venv/Scripts/python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# Frontend (terminal lain)
cd webapp/frontend
npm run dev
# Buka http://localhost:5173

# Test backend via Python (lebih reliable dari curl di Windows)
cd webapp/backend
.venv/Scripts/python.exe -c "
import httpx
c = httpx.Client(base_url='http://127.0.0.1:8000')
print(c.get('/health').json())
"
```

---

## Context Session Sebelumnya

Session sebelumnya membuat skill-based `pkl-report-planner` di `docx_skill_package`:
- `6656326d-1fe3-4afd-8338-170ce38639a1`
- Ringkasan ada di paste-attachments (di-read di awal session ini)
- Semua reference assets (bab-catalog, jurusan-knowledge, formatting-defaults, dll) dibuat di session itu
