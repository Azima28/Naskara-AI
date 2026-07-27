# JALANKAN_SIMULASI.ps1
# Klik kanan > "Run with PowerShell" untuk menjalankan simulasi lengkap.

$ROOT    = Split-Path -Parent $MyInvocation.MyCommand.Path
$BACKEND = "$ROOT\webapp\backend"
$PYTHON  = "$BACKEND\.venv\Scripts\python.exe"
$UVICORN = "$BACKEND\.venv\Scripts\uvicorn.exe"

Write-Host ""
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "  PKL REPORT GENERATOR — SIMULASI ALUR USER WEB" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""

# --- 1. Cek apakah backend sudah jalan ---
$running = $false
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8000/health" -TimeoutSec 2
    if ($health.status -eq "ok") {
        Write-Host "[OK] Backend sudah jalan di port 8000" -ForegroundColor Green
        $running = $true
    }
} catch {}

# --- 2. Start backend jika belum jalan ---
if (-not $running) {
    Write-Host "[...] Menjalankan backend server (tunggu ~5 detik)..." -ForegroundColor Yellow

    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $UVICORN
    $psi.Arguments = "app.main:app --host 0.0.0.0 --port 8000"
    $psi.WorkingDirectory = $BACKEND
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $false
    $psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Minimized
    $proc = [System.Diagnostics.Process]::Start($psi)

    Write-Host "    Backend PID: $($proc.Id)" -ForegroundColor Gray

    # Tunggu sampai backend siap
    $ready = $false
    for ($i = 0; $i -lt 20; $i++) {
        Start-Sleep -Seconds 1
        try {
            $h = Invoke-RestMethod -Uri "http://localhost:8000/health" -TimeoutSec 2
            if ($h.status -eq "ok") { $ready = $true; break }
        } catch {}
        Write-Host "    Menunggu... ($($i+1)/20)" -ForegroundColor Gray
    }

    if ($ready) {
        Write-Host "[OK] Backend siap!" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Backend tidak bisa jalan dalam 20 detik." -ForegroundColor Red
        Write-Host "        Coba jalankan manual dulu:" -ForegroundColor Red
        Write-Host "        cd '$BACKEND'" -ForegroundColor White
        Write-Host "        .\.venv\Scripts\uvicorn.exe app.main:app --port 8000" -ForegroundColor White
        Read-Host "Tekan Enter untuk keluar"
        exit 1
    }
}

# --- 3. Jalankan simulasi ---
Write-Host ""
Write-Host "[>>>] Menjalankan simulasi alur user web..." -ForegroundColor Cyan
Write-Host ""

Set-Location $ROOT
& $PYTHON "simulate_web_user.py"

Write-Host ""
Write-Host "===========================================================" -ForegroundColor Cyan

# Tanya buka file output
$out = "$ROOT\hasil\Laporan-PKL-Bintang-Ramadhan.docx"
if (Test-Path $out) {
    Write-Host ""
    $open = Read-Host "Buka file hasil sekarang? (y/n)"
    if ($open -eq "y") {
        Start-Process $out
    }
}

Write-Host ""
Read-Host "Selesai. Tekan Enter untuk menutup"
