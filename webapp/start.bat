@echo off
echo Memulai Frontend (Vite) dan Backend (FastAPI)...

:: Buka terminal baru untuk Frontend
start cmd /k "cd frontend && npm run dev"

:: Buka terminal baru untuk Backend
start cmd /k "cd backend && .venv\Scripts\uvicorn.exe app.main:app --reload --port 8000"

echo Selesai! Dua jendela terminal baru seharusnya sudah terbuka.
