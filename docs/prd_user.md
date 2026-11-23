# Product Requirements Document (PRD) — Modul User
## Sistem Tracking & Inspeksi APAR (`apar-inspection-app`)

**Versi:** 1.0 (Fokus Modul User / Kru Rig)  
**Target Deployment:** Vercel (Frontend-Only React SPA)  
**Penanggung Jawab Modul:** Fudhla  

---

## 1. Tujuan Modul User
Mendigitalisasi pekerjaan **Inspektor / Kru Rig di lapangan** agar proses pengecekan APAR tidak lagi memakai kertas atau Excel manual yang rawan typo (`Oktober-20224`, spasi Rig tidak konsisten, `Pressure Gauge` CO2 salah isi `Bagus`, dan `Tindakan` kosong 100%).

Seluruh fitur User dirancang **Mobile-First** agar nyaman dipakai dengan satu tangan saat berkeliling area Rig.

---

## 2. Ruang Lingkup Pengguna
- **Aktor:** Inspektor / Kru Rig.
- **Pembatasan Data (*Scope*):** Saat login dan memilih Rig (misal `Rig BMS-07`), User **hanya melihat dan mengelola APAR, inspeksi, dan tiket perbaikan milik Rig tersebut** (dari total 16 Rig operasional: `BMS-01` s.d. `BMS-21`).

---

## 3. Kebutuhan Fungsional (Halaman & Fitur User)

### 3.1 Simulasi Login (`/login`)
- Input **Nama Inspektor** dan pilih **Rig Aktif** dari dropdown 16 Rig terstandar.
- Menyimpan sesi aktif ke `localStorage` dan mengarahkan ke `/user/dashboard`.
- Tersedia tombol **"Ganti Rig / Keluar"** dan **"Reset Data Demo"**.

### 3.2 Beranda User (`/user/dashboard`)
- Menampilkan identitas Inspektor & Rig aktif di header.
- **4 Kartu Ringkasan (KPI Rig):**
  1. **Total APAR di Rig**
  2. **Sudah Diinspeksi Bulan Ini** (progress `X / Total`)
  3. **Kondisi Layak**
  4. **Perlu Perbaikan / Hydrotest Segera**
- **2 Tombol Aksi Cepat:** `Scan QR APAR` (utama) dan `Pilih dari Daftar`.
- **Daftar Pengingat:** Menampilkan maksimal 5 APAR prioritas di Rig ini yang belum diinspeksi bulan ini, sedang rusak, atau mendekati jatuh tempo Hydrotest (`< 60 hari` / kadaluarsa).

### 3.3 Daftar & Detail APAR Rig (`/user/apars` & `/user/apars/:id`)
- **Pencarian:** Berdasarkan `assetCode` (misal `APAR-BMS07-001`), `serialNo`, atau `placement` (*Penempatan*).
- **Filter:** Berdasarkan Tipe APAR (7 tipe standar) dan Status (`Semua`, `Layak`, `Perlu Perbaikan`, `Belum Dicek Bulan Ini`).
- **Halaman Detail APAR:**
  - Menampilkan spesifikasi lengkap (`brandModel`, `serialNo`, `placement`, `chargeOwner` `BMS`/`APM`, `manufactureDate`).
  - Menampilkan **QR Code** unik milik `assetCode`.
  - Menampilkan tanggal & badge status **Hydrotest (+5 tahun)**.
  - Menampilkan riwayat inspeksi khusus tabung tersebut dan tombol besar **"Mulai Inspeksi APAR Ini"**.

### 3.4 Scan QR (`/user/scan`)
- Membuka kamera HP menggunakan `html5-qrcode` untuk membaca `assetCode`.
- Jika `assetCode` cocok dengan APAR di Rig aktif, langsung arahkan ke `/user/inspect/:aparId`.
- Jika QR milik Rig lain, tampilkan peringatan jelas.
- **Fallback Manual:** Jika kamera tidak tersedia/ditolak, sediakan input ketik `assetCode` atau pilih langsung dari daftar APAR Rig aktif.

### 3.5 Form Inspeksi Cerdas (`/user/inspect/:aparId`)
- **Info Tabung (Read-Only):** Kode Aset, Tipe APAR, dan Penempatan.
- **Metadata Inspeksi:**
  - `Tanggal Inspeksi` (default hari ini).
  - `Kategori`: `Bulanan` (internal) atau `Tahunan` (pihak ke-3).
  - `Vendor Pihak ke-3`: muncul dan wajib diisi jika kategori = `Tahunan` (contoh: `Sepakat`).
- **7 Checklist Komponen** (`Bagus` / `Rusak`):
  1. `Handle`
  2. `Hose`
  3. `Nozle`
  4. `Pengaman Tabung`
  5. `Pin Handle`
  6. `Pressure Gauge`
  7. `Tabung`
- **Aturan Validasi Otomatis:**
  - Jika tipe APAR adalah `CO2` (`hasPressureGauge = false`), komponen `Pressure Gauge` otomatis terisi dan terkunci menjadi `N/A`.
  - Jika minimal 1 komponen dipilih `Rusak`, muncul blok wajib isi **`Hal Perbaikan`** (textarea) dan opsional unggah foto temuan.
  - Saat submit: menyimpan ke `inspections`, memperbarui `apar.status` (`layak` / `perlu_perbaikan`), dan jika ada kerusakan otomatis membuat tiket baru (`status: 'open'`) di `maintenances`.

### 3.6 Tindak Lanjut Perbaikan (`/user/maintenances`)
- Menampilkan seluruh tiket kerusakan milik Rig aktif beserta statusnya:
  - `Open` (Menunggu diproses Admin)
  - `In Progress` (Sedang ditindaklanjuti sesuai arahan Admin)
  - `Pending Review` (Foto bukti sudah diunggah, menunggu verifikasi Admin)
  - `Closed` (Selesai)
- **Aksi User:** Pada tiket berstatus `In Progress` (atau `Open` untuk simulasi mandiri), User dapat menekan **"Upload Bukti Perbaikan"** untuk mengunggah foto (disimpan sebagai base64 terkompresi) dan catatan singkat, sehingga status tiket berubah menjadi `Pending Review`.

### 3.7 Riwayat Inspeksi (`/user/history`)
- Menampilkan seluruh inspeksi yang pernah dilakukan di Rig aktif, diurutkan dari yang terbaru.
- Filter berdasarkan **Bulan & Tahun** dan Status (`Semua`, `Layak`, `Tidak Layak`).
- Klik baris/kartu untuk membuka modal detail 7 komponen checklist dan catatan perbaikan.
