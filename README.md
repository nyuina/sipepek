# SiPepeK — Sistem Pemetaan Penerangan & Panel KwH Meter

Aplikasi web untuk pemetaan dan pendataan **titik penerangan jalan** serta **titik panel meter listrik** menggunakan peta OpenStreetMap (gratis).

## Fitur

- Peta interaktif berbasis **OpenStreetMap** + **Leaflet.js**
- Geotagging: klik peta atau gunakan **Lokasi Saya** (GPS)
- Dua jenis titik: **Lampu Jalan** dan **Panel Meter Listrik**
- Form pendataan lengkap (kondisi, spesifikasi, catatan)
- Daftar titik dengan pencarian dan filter
- Penyimpanan lokal (LocalStorage) — tidak perlu server
- Export / Import data JSON
- **Grouping panel–lampu**: satu panel meter dapat dihubungkan ke banyak titik lampu, dengan garis koneksi di peta

## Struktur Folder

```
spot/
├── index.html          # Halaman utama
├── css/
│   └── style.css       # Stylesheet
├── js/
│   ├── config.js       # Konfigurasi & konstanta
│   ├── storage.js      # CRUD LocalStorage & export/import
│   ├── map.js          # Integrasi peta Leaflet/OSM
│   ├── forms.js        # Form, daftar titik, modal
│   └── app.js          # Entry point aplikasi
└── README.md
```

## Cara Penggunaan

1. **Tambah titik baru**
   - Buka tab **Tambah Data**
   - Pilih jenis titik (Lampu / Panel Meter)
   - Isi formulir
   - Klik lokasi di peta (atau tombol **Lokasi Saya**)
   - Klik **Simpan Titik**

2. **Lihat & kelola titik**
   - Tab **Daftar Titik** — cari, filter, klik item
   - Klik marker di peta untuk detail
   - Edit atau hapus dari modal detail

3. **Backup data**
   - **Export** — unduh file JSON
   - **Import** — muat ulang data (gabung atau ganti)

4. **Kelola grup panel–lampu**
   - Klik titik **Panel Meter** di peta → centang lampu yang terhubung → **Simpan Grup**
   - Atau saat menambah lampu, pilih panel di field **Panel Meter Terhubung**
   - Garis putus-putus di peta menunjukkan koneksi panel ke lampu

## Data Titik

### Penerangan Jalan (Lampu)
| Field | Keterangan |
|-------|-----------|
| Nama/Kode | Identifikasi titik |
| Lokasi/Jalan | Alamat atau nama jalan |
| Jenis Lampu | LED, HPS, Mercury, dll |
| Daya (Watt) | Kapasitas lampu |
| Tinggi Tiang (m) | Tinggi tiang |
| Kondisi | Baik / Rusak Ringan / Rusak Berat / Tidak Aktif |

### Panel Meter Listrik
| Field | Keterangan |
|-------|-----------|
| Nama/Kode | Identifikasi panel |
| Nomor Meter | Nomor meter PLN |
| Kapasitas (kVA) | Kapasitas panel |
| Fase | 1 Fase / 3 Fase |
| Kondisi | Baik / Rusak Ringan / Rusak Berat / Tidak Aktif |

## Teknologi

- HTML5, CSS3, JavaScript (ES Modules)
- [Leaflet.js](https://leafletjs.com/) — peta interaktif
- [OpenStreetMap](https://www.openstreetmap.org/) — tile peta gratis
- LocalStorage — penyimpanan data lokal

## Lisensi

Gratis untuk digunakan dan dimodifikasi.
