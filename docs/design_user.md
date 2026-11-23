# Design System & UI/UX Specification — Modul User (`DESIGN_USER.md`)
## Sistem Tracking & Inspeksi APAR (`apar-inspection-app`)

---

## 1. Prinsip Desain Lapangan (*Mobile-First*)
1. **Satu Tangan & Cepat:** Kru di lapangan sering memakai sarung tangan atau berdiri di area terang. Tombol utama dan pilihan checklist harus besar (*minimum height* `44px–48px`) dengan jarak antar tombol yang lega agar tidak salah tekan.
2. **Kontras Tinggi:** Latar belakang terang (`#F8FAFC`) dengan kartu putih (`#FFFFFF`) dan teks gelap (`#0F172A`) agar tetap terbaca di bawah sinar matahari.
3. **Zero Confusion:** Gunakan Bahasa Indonesia yang ringkas, tampilkan Kode Aset dengan font monospace agar angka `0` dan huruf `O` jelas, serta beri umpan balik warna instan pada setiap aksi.

---

## 2. Palet Warna (Tema K3 / HSE)

| Token | Hex | Penggunaan di Modul User |
| :--- | :--- | :--- |
| **Primary (Safety Red)** | `#DC2626` | Tombol `Scan QR`, tombol `Simpan Inspeksi`, menu aktif |
| **Success (Layak)** | `#16A34A` | Tombol `Bagus` aktif, badge `Layak`, Hydrotest `Aman` |
| **Warning (Perhatian)** | `#D97706` | Hydrotest `< 60 hari`, tiket `In Progress` |
| **Info (Review)** | `#2563EB` | Tiket `Pending Review` |
| **Danger (Rusak)** | `#E11D48` | Tombol `Rusak` aktif, kotak `Hal Perbaikan`, Hydrotest `Kadaluarsa` |
| **Neutral (N/A)** | `#64748B` | Penguncian `Pressure Gauge = N/A` pada tipe CO2 |
| **Canvas & Surface** | `#F8FAFC` / `#FFFFFF` | Latar halaman & kartu dengan border `#E2E8F0` |

---

## 3. Struktur Navigasi User

### Mobile (`< 768px`)
- **Top Bar (`56px`):** Nama Rig aktif di kiri (`Rig BMS-07`) + badge nama inspektor & tombol keluar di kanan.
- **Bottom Navigation Bar (`64px`, fixed bottom):** 5 menu sejajar:
  1. `Beranda` (`/user/dashboard`)
  2. `APAR` (`/user/apars`)
  3. **`Scan`** (`/user/scan`) — tombol tengah menonjol (bulat merah `#DC2626`, sedikit terangkat)
  4. `Perbaikan` (`/user/maintenances`) — tampilkan badge angka merah jika ada tiket aktif
  5. `Riwayat` (`/user/history`)

### Desktop (`>= 768px`)
- **Sidebar Kiri (`240px`)** berisi logo aplikasi, info Rig aktif, 5 menu navigasi di atas, dan tombol `Ganti Rig / Keluar` di bagian bawah.

---

## 4. Spesifikasi Tampilan Komponen Kunci

### A. Kartu APAR (`AparCard.jsx`)
- **Baris Atas:** Kode Aset (`font-mono font-bold`, misal `APAR-BMS07-001`) di kiri + Badge Status (`Layak` / `Perlu Perbaikan`) di kanan.
- **Baris Tengah:** Penempatan (`font-semibold`, misal `FIRE BOX`) dan Tipe APAR (`Powder 9 Kg ABC`).
- **Baris Bawah:** Status Hydrotest (`Aman • Exp 2028` / `Kadaluarsa`) + indikator apakah sudah dicek bulan ini (`Sudah Cek` / `Belum Cek`).

### B. Form Checklist 7 Komponen (`UserInspectForm.jsx`)
- **Sticky Header Info:** Menampilkan Kode Aset, Tipe, dan Penempatan di atas layar saat scroll.
- **Tampilan Per Komponen (7 Kartu Vertikal):**
  - Kiri: Nama komponen (`Handle`, `Hose`, `Nozle`, `Pengaman Tabung`, `Pin Handle`, `Pressure Gauge`, `Tabung`).
  - Kanan: 2 tombol segmen berdampingan: **`Bagus`** dan **`Rusak`**.
  - **Khusus `Pressure Gauge` pada CO2:** Kedua tombol disembunyikan dan diganti pill abu-abu **`N/A (Otomatis CO2)`**.
- **Blok Kondisional Kerusakan:**
  - Muncul otomatis dengan border merah (`border-rose-300 bg-rose-50`) begitu minimal 1 komponen dipilih `Rusak`.
  - Berisi label wajib `Hal Perbaikan *` (textarea, placeholder: *"Contoh: Hose bocor, jarum tekanan turun..."*) dan input foto opsional.
