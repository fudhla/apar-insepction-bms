# Product Requirements Document (PRD) — Modul Admin
## Sistem Tracking & Inspeksi APAR Armada Rig (`apar-inspection-app`)

**Versi:** 1.0 (Modul Admin Pusat / HSE Coordinator)  
**Target Deployment:** Vercel (Frontend-Only React SPA)  
**Integrasi:** Terhubung 100% dengan Modul User/HFO via `src/shared/` & `AparContext.jsx`  
**Penanggung Jawab Modul:** Fudhla & Tim Admin HSE  

---

## 1. Tujuan & Konteks Modul Admin

Jika **Modul User** dirancang *mobile-first* khusus untuk **Kru Lapangan / HFO (Health & Safety Field Officer)** yang berkeliling di area 1 Rig, maka **Modul Admin** dirancang *desktop-first* sebagai **HSE Command Center & Inventory Controller** untuk Koordinator HSE, Superintendent, dan Manajemen Pusat.

### Masalah yang Diselesaikan:
1. **Blindspot 16 Rig:** Manajemen pusat sebelumnya kesulitan melihat status kepatuhan inspeksi 16 Rig secara simultan tanpa menunggu rekap Excel manual mingguan/bulanan.
2. **Tiket Kerusakan Menggantung:** Kerusakan tabung yang dilaporkan HFO di rig terpencil sering kali tidak terpantau progres perbaikannya.
3. **Verifikasi Bukti Perbaikan yang Lemah:** Admin butuh melihat perbandingan visual (*side-by-side*) antara foto kerusakan awal yang diunggah HFO dengan foto bukti fisik perbaikan sebelum menutup tiket (*closing work order*).
4. **Jadwal Hydrotest 5 Tahunan yang Terlewat:** Menghindari tabung kadaluarsa hydrotest dengan mendeteksi otomatis tabung yang mendekati masa uji tekan (`< 60 hari`) agar vendor pihak ke-3 (contoh: PT Sepakat) dapat dijadwalkan tepat waktu.

---

## 2. Aktor & Ruang Lingkup Hak Akses (*Scope*)

| Atribut | Modul User (HFO) | Modul Admin (Pusat) |
| :--- | :--- | :--- |
| **Aktor** | 48 Personel HFO (3 HFO per Rig) | HSE Superintendent / Rig Coordinator / Admin Logistik |
| **Cakupan Data (*Scope*)** | **Terisolasi 1 Rig Aktif** (hanya melihat APAR & tiket milik Rig yang dipilih) | **Global Armada (16 Rig Operasional)**: `BMS-02` s.d. `BMS-21` (224+ unit APAR) |
| **Kewenangan APAR** | Read-Only spesifikasi APAR, Input Form Inspeksi Fisik | Create, Read, Update, Delete (CRUD) Master Tabung APAR |
| **Kewenangan Tiket** | Melaporkan Kerusakan (`open`), Mengunggah Bukti Perbaikan (`pending_review`) | Menugaskan Tindak Lanjut (`in_progress`), **Verifikasi Bukti & Menutup Tiket (`closed`)**, Menolak Bukti jika kurang jelas |
| **Kewenangan Akun** | Ganti password akun HFO sendiri | Reset password 48 HFO, reassign HFO, monitoring log aktivitas |

---

## 3. Alur Bisnis Terintegrasi (User HFO ⇄ Admin Pusat)

```
[HFO di Rig]                              [Admin di Kantor Pusat]
     │                                               │
     ├─► Menemukan Tabung Rusak                      │
     │   Input Form Inspeksi 7 Titik                 │
     │   (Otomatis Buat Tiket 'open') ──────────────►│ Muncul Notifikasi Tiket Baru
     │                                               ├─► Review temuan & ubah status ke 'in_progress'
     │◄──────────────────────────────────────────────┤   (Instruksikan perbaikan / sparepart)
     │                                               │
     ├─► Melakukan Perbaikan Fisik                   │
     │   Upload Bukti Foto & Catatan                 │
     │   (Tiket berubah ke 'pending_review') ───────►│ Muncul di Antrean Verifikasi
     │                                               ├─► Verifikasi Foto Bukti:
     │                                               │   - JIKA VALID: Tutup Tiket ('closed')
     │                                               │     -> Status APAR otomatis kembali 'layak'
     │                                               │   - JIKA DITOLAK: Kembalikan ke 'in_progress'
     │◄──────────────────────────────────────────────┤     dengan catatan revisi
```

---

## 4. Kebutuhan Fungsional (Halaman & Fitur Admin)

### 4.1 Login Admin Pusat (`/login` Tab Admin)
- Tab switcher di `/login` yang mengarahkan ke autentikasi Admin.
- Kredensial default admin pusat: Username/Email `admin@bms.co.id`, Password `admin123`.
- Validasi SweetAlert2 dan penyimpanan sesi ke `localStorage` (`bms_apar_v1_user` dengan `role: 'admin'`).

### 4.2 Global Command Center (`/admin/dashboard`)
1. **Fleet Telemetry (4 KPI Global):**
   - **Total APAR Armada:** Akumulasi seluruh tabung di 16 Rig (224 unit).
   - **Fleet Inspection Readiness:** Persentase tabung armada yang sudah diinspeksi bulan berjalan (`X / 224 unit`).
   - **Unit Perlu Tindakan:** Jumlah tabung rusak aktif + tabung hydrotest kadaluarsa di seluruh armada.
   - **Tiket Menunggu Verifikasi:** Jumlah tiket berstatus `pending_review` yang membutuhkan persetujuan Admin.
2. **Rig Compliance Matrix (Tabel Status 16 Rig):**
   - Menampilkan ringkasan matriks seluruh 16 Rig: Nama Rig, Total APAR, Progress Cek Bulan Ini, Jumlah Rusak, Tanggal Inspeksi Terakhir, dan Personel HFO yang bertugas.
3. **Pintasan Aksi Cepat:**
   - Tombol *Verifikasi Tiket Pending*, *Tambah Tabung Baru*, *Download Laporan Excel*.

### 4.3 Manajemen Master Data APAR (`/admin/apars`)
1. **Daftar Global Multi-Filter:**
   - Pencarian cerdas: Kode Aset, Serial No, Penempatan, atau Nama HFO Pengecek.
   - Filter dropdown: Filter per Rig (16 Rig), Filter Tipe APAR (7 tipe standar), dan Filter Status (`Semua`, `Layak`, `Perlu Perbaikan`, `Kadaluarsa Hydrotest`).
2. **Tambah / Edit Tabung APAR (Modal Form):**
   - Penugasan Rig (`rigId` dropdown 16 Rig).
   - Kode Aset (Auto-generate atau input manual, misal `APAR-BMS07-015`).
   - Tipe APAR (7 tipe master: `Powder 9 Kg ABC`, `CO2`, `Foam 100 Liter`, dll).
   - Penempatan Fisik (`Rig Carrier`, `Tangki 1`, `Mud Pump`, `Fire Box`, dll).
   - Merek & Model Tabung (`Firex FX-90`, `Alfrex AFCO-150`, dll) & Serial No.
   - Pemilik Charge Biaya (`BMS` / `APM`).
   - Tanggal Manufaktur (untuk kalkulasi otomatis Hydrotest 5 tahunan).
3. **Cetak Label QR Code Massal (*Bulk QR Sheet*):**
   - Kemampuan memilih Rig lalu mengunduh/mencetak lembar stiker QR Code siap potong untuk ditempel pada tabung fisik di rig.
4. **Hapus APAR:**
   - Proteksi konfirmasi SweetAlert2 sebelum menghapus data tabung dari armada.

### 4.4 Verifikasi Tiket Perbaikan & Work Order (`/admin/maintenances`)
1. **Manajemen Status Tiket Work Order:**
   - Tab filter: `Semua`, `Open (Menunggu)`, `In Progress (Dikerjakan)`, `Pending Review (Verifikasi)`, `Closed (Selesai)`.
2. **Review Drawer / Modal Verifikasi Berdampingan (*Side-by-Side Review*):**
   - Menampilkan **Foto Kerusakan Awal** (diunggah HFO pelapor) berdampingan dengan **Foto Bukti Fisik Perbaikan** (diunggah HFO penyelesai).
   - Menampilkan catatan kerusakan vs catatan perbaikan.
   - **Aksi Admin:**
     - **Setujui & Tutup Tiket (`Approve & Close`):** Mengubah status tiket menjadi `'closed'`, mencatat nama admin dan tanggal verifikasi, serta **secara otomatis memulihkan status APAR terkait menjadi `'layak'`**.
     - **Tolak Bukti (`Reject with Notes`):** Mengembalikan status tiket menjadi `'in_progress'` dengan catatan kekurangan (misal: *"Foto buram, harap foto ulang manometer"*).

### 4.5 Global Inspection Log & Audit Trail (`/admin/inspections`)
1. **Pusat Log Inspeksi 16 Rig:**
   - Menampilkan seluruh log pemeriksaan yang masuk dari 48 HFO lapangan secara *real-time*.
2. **Filter & Pelacakan Audit:**
   - Filter berdasarkan Rentang Tanggal, Rig Tertentu, dan Nama HFO Tertentu.
3. **Modal Rincian 7 Checklist Fisik:**
   - Klik baris inspeksi untuk melihat kondisi detail 7 titik: *Handle*, *Hose*, *Nozle*, *Pengaman Tabung*, *Pin Handle*, *Pressure Gauge* (termasuk status *N/A CO2*), dan *Tabung*.

### 4.6 Radar Siklus Hydrotest 5 Tahunan (`/admin/hydrotest`)
1. **Pemantauan Khusus Integritas Tabung:**
   - Menampilkan daftar tabung yang:
     - `Kadaluarsa` (sudah melewati 5 tahun penuh dari tanggal pembuatan).
     - `Segera Hydrotest` (sisa waktu uji tekan `< 60 hari`).
     - `Perlu Cek Fisik` (tanggal tabung tidak terbaca di lapangan).
2. **Pemesanan Batch Sertifikasi Pihak Ke-3:**
   - Memilih tabung yang sudah jatuh tempo dan mengekspor daftar uji tekan untuk diserahkan ke vendor sertifikasi (contoh: PT Sepakat).

### 4.7 Manajemen Akun & Personel HFO (`/admin/users`)
1. **Direktori 48 HFO BMS:**
   - Tabel 48 personel HFO terfilter berdasarkan 16 Rig.
   - Menampilkan nama lengkap, penempatan rig aktif, jumlah inspeksi yang telah dilakukan bulan ini, dan status password.
2. **Aksi Admin:**
   - **Reset Password ke Default:** Mengembalikan password HFO ke default `123456` jika personel lupa password di lapangan.
   - **Pindah Penugasan Rig:** Memindahkan HFO ke rig lain jika ada rotasi kru.

### 4.8 Ekspor Laporan Resmi Excel / PDF (`/admin/reports`)
1. **Format Standar Laporan BMS & SKK Migas:**
   - Kemampuan mengekspor data inspeksi bulanan ke format CSV/Excel yang strukturnya persis sama dengan dokumen Excel operasional BMS yang digunakan sebelumnya:
     - `No`, `Rig`, `Tanggal`, `Type`, `Serial No`, `Tahun APAR`, `Penempatan`, `Handle`, `Hose`, `Nozle`, `Pengaman Tabung`, `Pin Handle`, `Pressure Gauge`, `Tabung`, `Tindakan`, `Charge`, `Pihak ke 3`, `Inspeksi Tahunan`, `Hydrotest APAR`, `Hal Perbaikan`.
2. **Opsi Cetak PDF Ramah Printer:**
   - Tampilan cetak bersih hitam-putih untuk lampiran dokumen HSE meeting bulanan.
