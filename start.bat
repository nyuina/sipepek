@echo off
title SPOT - Local Server
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js belum terinstall.
  echo Jalankan: winget install OpenJS.NodeJS.LTS
  echo Atau buka README.md untuk petunjuk instalasi.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Menginstall dependensi...
  call npm install
  if errorlevel 1 (
    echo [ERROR] Gagal menginstall dependensi.
    pause
    exit /b 1
  )
)

echo.
echo ========================================
echo   SPOT berjalan di http://localhost:8080
echo   Tekan Ctrl+C untuk menghentikan
echo ========================================
echo.

call npm start
