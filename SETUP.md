# Instruksi Sebelum Menjalankan Project

Dokumen ini berisi langkah penting sebelum mulai coding dan sebelum mengupload project ke GitHub private.

## 1. Pastikan perangkat sudah siap

- Instal Node.js LTS terbaru
- Instal Git
- Pastikan Anda sudah login ke GitHub atau memiliki akses ke akun GitHub pribadi
- Pastikan folder project sudah terbuka di VS Code

## 2. Install dependency project

Di terminal, jalankan:

    cd C:\Users\Administrator\Documents\spot
    npm install

## 3. Jalankan aplikasi

    npm start

Lalu buka browser ke:

    http://localhost:8080

## 4. Jika ingin menjalankan di mode development

    npm run dev

## 5. Persiapan GitHub private

### Opsi A: Menggunakan GitHub CLI

Jika GitHub CLI sudah terpasang:

    gh auth login
    git init
    git add .
    git commit -m "Initial commit"
    gh repo create spot-private --private --source=. --remote=origin --push

### Opsi B: Menggunakan remote GitHub manual

    git init
    git branch -M main
    git add .
    git commit -m "Initial commit"
    git remote add origin https://github.com/NAMA_USER/spot-private.git
    git push -u origin main

Ganti NAMA_USER dengan username GitHub Anda.

## 6. Catatan penting project

- Project ini sudah memiliki package.json dengan mode private, sehingga aman untuk repository private
- Folder asset private sudah dibuat untuk logo preloader dan header yang tidak boleh diakses publik secara umum
- Server Express sudah mengatur route khusus untuk file private agar hanya halaman tertentu yang dapat memuat asset tersebut
- Jangan menaruh file sensitif di folder yang diakses publik secara langsung

## 7. Sebelum mulai coding ulang

- Pastikan Anda berada pada branch yang benar
- Selalu pull sebelum edit jika repository sudah ada
- Gunakan commit yang jelas dan terpisah per fitur
- Jalankan validasi ringan sebelum push:

    node --check server.js
    node --check js/app.js
    node --check js/forms.js
    node --check js/map.js

## 8. Saran organisasi kerja

Gunakan struktur commit seperti ini:

- feat: tambah fitur baru
- fix: perbaiki bug
- chore: update config atau struktur proyek
- style: penyesuaian tampilan UI

## 9. Catatan terakhir

Project ini sudah siap untuk dikembangkan lebih lanjut. Untuk repository private, Anda tetap bisa push ke GitHub tanpa harus membuka akses publik.
