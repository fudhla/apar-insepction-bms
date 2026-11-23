# Design Specification Document — Modul Admin Pusat
## Sistem Tracking & Inspeksi APAR Armada Rig (`apar-inspection-app`)

**Versi:** 1.0 (HSE Industrial Command Center)  
**Target Platform:** Desktop-First Web Application (1280px+ optimal, tablet/mobile fallback)  
**Dokumen Terkait:** [docs/prd_admin.md](file:///c:/Users/ASUS/apar-inspection-app/docs/prd_admin.md), [docs/architecture_admin.md](file:///c:/Users/ASUS/apar-inspection-app/docs/architecture_admin.md)  
**Desain & UI/UX Taste:** Industrial Command Center, High-Density Data Grid, Safety Engineering Aesthetic  

---

## 1. Filosofi Desain & Arah Visual

Jika **Modul User (HFO)** dirancang dengan filosofi *Tactical Field Companion* yang ramah sentuhan satu tangan di bawah terik matahari lapangan rig, maka **Modul Admin Pusat** dirancang dengan filosofi **HSE Industrial Command Center**:

1. **Information-Dense & Scan-Friendly:** Layar desktop dimanfaatkan secara maksimal. Menampilkan matriks status 16 Rig dan ratusan tabung dalam satu pandangan tanpa membuang ruang dengan spasi kosong berlebihan (*no wasteful padding*).
2. **Authoritative & Safety Engineering Aesthetic:** Memadukan palet warna industrial (*Dark Slate* `#0F172A`, *Gunmetal* `#1E293B`, dan *Safety Red* `#DC2626`) dengan kartu data bergaris batas presisi (*crisp 1px borders*), tipografi teknis, serta angka bergaya tabular (*tabular numerals*).
3. **No "AI Slop" / Zero Fluff:** Menghindari efek blur berlebihan, gradasi pelangi yang kekanak-kanakan, animasi lambat yang membuang waktu, atau ilustrasi 3D generik. Setiap piksel memiliki fungsi operasional yang jelas bagi seorang Koordinator HSE.
4. **Poka-Yoke & Deterministic Review:** Antarmuka verifikasi tiket perbaikan dirancang khusus dengan tata letak *Side-by-Side Visual Comparison* (Foto Temuan Kerusakan Awal vs Foto Bukti Fisik Perbaikan) agar admin dapat mengambil keputusan persetujuan (*Approve*) atau penolakan (*Reject*) secara objektif dan instan.

---

## 2. Token Desain (Design Tokens)

### 2.1 Palet Warna Operasional (HSE Color System)

```
┌────────────────────────────────────────────────────────────────────────┐
│                              PALET ADMIN PUSAT                         │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ Base Surfaces     │ Safety Status     │ Technical Accents              │
│ #0F172A (Slate 900)│ #DC2626 (Red 600) │ #2563EB (Blue 600 - Hydrotest) │
│ #1E293B (Slate 800)│ #16A34A (Grn 600) │ #64748B (Slate 500 - Border)   │
│ #F8FAFC (Slate 50) │ #D97706 (Amb 600) │ #F1F5F9 (Slate 100 - Table Alt)│
└───────────────────┴───────────────────┴────────────────────────────────┘
```

| Token | Nilai Hex | Tailwind Class | Penggunaan & Konteks |
| :--- | :--- | :--- | :--- |
| **Surface Dark** | `#0F172A` | `bg-slate-900` | Latar belakang sidebar, header command center, modal dark accent |
| **Surface Card** | `#FFFFFF` | `bg-white` | Latar belakang kartu data, tabel, form dialog |
| **Surface Canvas** | `#F8FAFC` | `bg-slate-50` | Latar utama area konten admin (kontras lembut dengan kartu putih) |
| **Border Subtle** | `#E2E8F0` | `border-slate-200` | Garis batas kartu, pemisah baris tabel, input field |
| **Border Strong** | `#334155` | `border-slate-700` | Garis batas komponen dark (sidebar, terminal badge) |
| **Text Primary** | `#0F172A` | `text-slate-900` | Judul, angka metrik utama, label penting |
| **Text Secondary** | `#475569` | `text-slate-600` | Deskripsi, keterangan tabel, sub-label |
| **Text Muted** | `#94A3B8` | `text-slate-400` | Placeholder, tanggal sekunder, breadcrumb |
| **Safety Danger** | `#DC2626` | `bg-red-600` / `text-red-600` | Tabung rusak, tiket open, hydrotest kadaluarsa, tombol hapus |
| **Safety Success**| `#16A34A` | `bg-emerald-600` / `text-emerald-600` | Tabung layak, tiket closed/verified, rig 100% inspected |
| **Safety Warning**| `#D97706` | `bg-amber-600` / `text-amber-600` | Tiket pending review, hydrotest <60 hari, inspeksi parsial |
| **Technical Cyan**| `#0284C7` | `bg-sky-600` / `text-sky-600` | Kategori tahunan (pihak ke-3), status in_progress |

### 2.2 Tipografi & Angka Tabular
- **Font Family:** `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, sans-serif.
- **Font Mono (Data Krusial):** `ui-monospace`, `SFMono-Regular`, `Menlo`, `Monaco`, `Consolas`, monospace.
  - Digunakan untuk: Kode Aset (`APAR-BMS07-001`), Nomor Seri, Tanggal (`2026-11-20`), dan Angka Metrik (`tabular-nums font-mono`).
- **Skala Hirarki Teks:**
  - `Display / KPI`: `text-2xl` s.d. `text-3xl font-extrabold tracking-tight`
  - `Header H1`: `text-xl font-bold text-slate-900`
  - `Header H2 / Card Title`: `text-sm font-bold uppercase tracking-wider text-slate-700`
  - `Body Standard`: `text-xs sm:text-sm font-medium text-slate-800`
  - `Micro Label / Badge`: `text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest`

---

## 3. Tata Letak Shell Admin (Admin Layout Architecture)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [TOP NAVIGATION BAR: 56px]                                                              │
│ [BMS LOGO] HSE Command Center  │  Rig: [Semua 16 Rig ▼]  │  Q [Search Asset / Serial]  │
│                                │  Demo Reset ↺          │  👤 Admin HSE (admin@bms.id)│
├────────────────────┬───────────────────────────────────────────────────────────────────┤
│ [SIDEBAR: 250px]   │ [MAIN CONTENT WORKSPACE: Auto Scroll]                             │
│                    │                                                                   │
│ 📊 Command Center  │ Breadcrumb: Admin > Master Tabung APAR > BMS-07                  │
│ 🧯 Master APAR(224)│                                                                   │
│ 🛠️ Verifikasi (2)★ │ [KPI Summary Cards: 4 Kolom]                                      │
│ 📋 Log Audit       │ [Total 224]  [Inspected 88%]  [Perlu Tindakan 14]  [Pending Rev 2]│
│ ⏱️ Radar Hydrotest │                                                                   │
│ 👷 Personel HFO(48)│ [Filter Toolbar: Rig ▼ | Tipe ▼ | Status ▼ | 🔍 Search | + Tambah] │
│ 📑 Laporan Excel   │                                                                   │
│                    │ [High-Density Data Grid / Matrix Table]                           │
│ ────────────────── │ [Row 1: APAR-BMS07-001 | Powder 9Kg | Rig Carrier | Layak | ...]  │
│ 🚪 Keluar (Logout) │ [Row 2: APAR-BMS07-005 | CO2 6.8Kg | Genset      | Rusak | ...]  │
└────────────────────┴───────────────────────────────────────────────────────────────────┘
```

### 3.1 Sidebar Navigasi Kiri (Fixed 250px)
- **Status Tetap (Sticky):** Bertahan di sisi kiri layar dengan latar `#0F172A` dan garis pembatas `border-r border-slate-800`.
- **Indikator Aktif Berkelas:** Menu terpilih memiliki latar `bg-red-600/15 border-l-4 border-red-600 text-white font-semibold`.
- **Badge Counter Real-Time:**
  - Menu *Verifikasi Tiket* memiliki badge berkedip amber (`bg-amber-500 text-slate-950 font-bold`) jika ada tiket berstatus `pending_review`.
  - Menu *Radar Hydrotest* memiliki badge merah jika ada tabung `kadaluarsa` atau `< 60 hari`.
- **Footer Sidebar:** Tombol Logout dengan konfirmasi SweetAlert2 dan tombol cepat kembali ke portal User HFO.

### 3.2 Top Bar Utilitas (Fixed 56px)
- **Rig Quick Switcher:** Dropdown global untuk memfilter seluruh dashboard hanya ke 1 Rig tertentu atau menampilkan `Semua 16 Rig (Fleet Mode)`.
- **Omni-Search Bar (`Ctrl+K`):** Kotak pencarian global untuk menemukan tabung APAR berdasarkan Kode Aset atau Nomor Seri secara instan.
- **System Status Indicator:** Lampu hijau kecil bertuliskan `Local Engine Active • 224 APAR Synced`.

---

## 4. Spesifikasi Desain Antarmuka Halaman (Screen Specifications)

### 4.1 Command Center Dashboard (`/admin/dashboard`)

#### A. 4 Telemetry KPI Cards (Grid 4 Kolom Desktop)
1. **Total Tabung Armada:**
   - Angka besar `224` (font mono).
   - Subteks: `Tersebar di 16 Rig Operasional BMS`.
   - Ikon: `ShieldCheck` (Slate-400).
2. **Kepatuhan Inspeksi Bulan Ini:**
   - Angka persentase misal `89.3%` dengan progress bar horizontal setinggi 6px.
   - Subteks: `200 dari 224 unit telah diperiksa`.
   - Indikator: Hijau (`>=90%`), Amber (`70-89%`), Merah (`<70%`).
3. **Unit Perlu Tindakan Segera:**
   - Angka `14` dengan aksen merah tebal (`bg-red-50 text-red-700 border-red-200`).
   - Rincian: `8 Tabung Rusak • 6 Kadaluarsa Hydrotest`.
4. **Tiket Menunggu Verifikasi Admin:**
   - Angka `2` dengan badge pulsa amber (`bg-amber-100 text-amber-900 border-amber-300`).
   - Call to Action: Link tombol *"Verifikasi Sekarang →"*.

#### B. Fleet Compliance Matrix (Tabel Matriks 16 Rig)
Tabel ringkas yang menampilkan seluruh 16 Rig secara berdampingan:
- Kolom: `Kode Rig`, `Wilayah Operasi`, `Total APAR`, `Inspeksi Bulan Ini (Progress Bar)`, `Kondisi Fisik (Layak / Rusak)`, `Status Hydrotest`, `Petugas HFO Terakhir`, dan `Aksi (Detail Rig)`.
- Interaksi: Klik salah satu baris Rig otomatis mengaktifkan filter global untuk rig tersebut.

---

### 4.2 Manajemen Master APAR (`/admin/apars`)

#### A. Filter Toolbar & Bulk Actions
- Input teks pencarian cerdas (Kode Aset, Serial No, Merek, Penempatan).
- Filter Rig (16 Rig + opsi "Semua Rig").
- Filter Tipe (7 tipe standar: `Powder 9 Kg ABC`, `CO2`, `Foam 100 Liter`, dll).
- Filter Status Kondisi (`Semua`, `Layak`, `Perlu Perbaikan`).
- Tombol Primer: `+ Tambah Tabung Baru` (Membuka modal input).
- Tombol Sekunder: `Cetak Lembar QR Massal` (Membuka generator stiker QR).

#### B. Tabel Master Data (High Density Table)
| Kode Aset | Rig | Tipe & Kapasitas | Penempatan | Manufaktur / Hydrotest | Kondisi Fisik | Pengecek Terakhir | Aksi |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `APAR-BMS07-001` | **BMS-07** | Powder 9 Kg ABC | Rig Carrier | 2023-04 (Aman) | <span class="badge-green">Layak</span> | APRIADI S (20 Nov) | `[Edit] [QR] [Hapus]` |
| `APAR-BMS07-005` | **BMS-07** | CO2 6.8 Kg | Mud Pump | 2021-01 (<span class="badge-amber">< 60 Hari</span>) | <span class="badge-red">Perlu Perbaikan</span> | M. FAKHRI W (19 Nov) | `[Edit] [QR] [Hapus]` |

#### C. Modal Input / Edit Tabung APAR
- Form rapi 2 kolom:
  - Kolom Kiri: Rig Penempatan (`rigId`), Kode Aset (`assetCode`), Tipe Tabung (`typeId`), Penempatan Fisik (`location`).
  - Kolom Kanan: Merek Tabung (`brand`), Nomor Seri (`serialNo`), Pemilik Charge (`chargeOwner: BMS / APM`), Tanggal Manufaktur (`manufactureDate`).
- **Poka-Yoke Rule:** Jika tipe tabung `CO2` dipilih, sistem menampilkan info alert: *"Manometer tidak berlaku untuk tipe CO2 (Kondisi dinilai berdasarkan timbangan berat tabung)"*.
- **Auto-Kalkulasi Hydrotest:** Sistem menampilkan kalkulasi instan: `Jatuh tempo hydrotest: [Tanggal Manufaktur + 5 Tahun]`.

---

### 4.3 Verifikasi Tiket Perbaikan (`/admin/maintenances`)

Inilah antarmuka paling krusial untuk menjamin integritas perbaikan tabung APAR sebelum status tabung dipulihkan ke `layak`.

#### A. Tab Status Tiket Work Order
- `Semua (8)`
- `Menunggu Tindakan / Open (3)` — Baru dilaporkan HFO dari form inspeksi.
- `Sedang Dikerjakan / In Progress (2)` — Admin telah menginstruksikan perbaikan.
- `Menunggu Verifikasi / Pending Review (2)` — **Memerlukan persetujuan Admin (Highlighted Amber)**.
- `Selesai / Closed (1)` — Telah diverifikasi dan ditutup.

#### B. Drawer Verifikasi Visual Berdampingan (*Side-by-Side Review Drawer*)
Ketika Admin mengklik tombol *"Review Bukti"* pada tiket `pending_review`, sebuah drawer selebar 800px muncul dari sisi kanan layar:

```
┌────────────────────────────────────────────────────────────────────────┐
│ VERIFIKASI PERBAIKAN TIKET: WO-2026-004             [✕ Tutup Drawer]   │
│ Tabung: APAR-BMS07-003 • Rig: BMS-07 • Penempatan: Mud Pump 1          │
├───────────────────────────────────┬────────────────────────────────────┤
│ 📸 TEMUAN KERUSAKAN AWAL          │ 🛠️ BUKTI FISIK PERBAIKAN          │
│ Dilaporkan: 18 Nov 2026           │ Diunggah: 20 Nov 2026              │
│ Pelapor: APRIADI S (HFO)          │ Pelaksana: SULAIMAN (HFO)          │
│                                   │                                    │
│ ┌───────────────────────────────┐ │ ┌────────────────────────────────┐ │
│ │                               │ │ │                                │ │
│ │   [FOTO KERUSAKAN AWAL]       │ │ │   [FOTO BUKTI PERBAIKAN]       │ │
│ │   (Hose pecah / retak)        │ │ │   (Hose baru terpasang rapi)   │ │
│ │                               │ │ │                                │ │
│ └───────────────────────────────┘ │ └────────────────────────────────┘ │
│                                   │                                    │
│ ⚠️ Komponen Rusak:                │ 📝 Catatan Perbaikan Lapangan:     │
│ • Selang / Hose (Pecah karet)     │ "Selang lama telah diganti dengan  │
│ • Catatan: Retak rambut 5 cm      │ sparepart baru stock Firex 9Kg,    │
│   berisiko bocor saat ditekan.    │ pin segel terpasang ulang rapi."   │
├───────────────────────────────────┴────────────────────────────────────┤
│ KEPUTUSAN VERIFIKASI ADMIN PUSAT:                                      │
│                                                                        │
│ [ Catatan Admin (Opsional jika disetujui, Wajib jika ditolak) ....... ]│
│                                                                        │
│ ┌───────────────────────────────┐  ┌─────────────────────────────────┐ │
│ │ ❌ TOLAK BUKTI PERBAIKAN      │  │ ✅ SETUJUI & PULIHKAN STATUS    │ │
│ │ (Kembali ke 'in_progress')    │  │ (Tiket 'closed', APAR 'layak')  │ │
│ └───────────────────────────────┘  └─────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

- **Logika Otomatis saat `Approve & Close`:**
  1. Status tiket diubah menjadi `closed`.
  2. Tanggal verifikasi dan nama admin pencatat disimpan.
  3. **Status tabung APAR terkait otomatis dipulihkan dari `'perlu_perbaikan'` menjadi `'layak'`**.
  4. Muncul notifikasi `showSuccess('Tiket Selesai', 'Status tabung telah dipulihkan menjadi Layak.')`.
- **Logika saat `Reject`:**
  1. Admin wajib mengisi alasan penolakan (misal: *"Foto buram, harap foto ulang manometer dalam posisi jarum hijau"*).
  2. Status tiket dikembalikan ke `in_progress`.
  3. Catatan penolakan tersimpan dan dapat dibaca oleh HFO di rig terkait.

---

### 4.4 Radar Siklus Hydrotest 5 Tahunan (`/admin/hydrotest`)

Tabung APAR wajib menjalani uji tekan (*hydrostatic test*) setiap 5 tahun sekali sesuai regulasi Depnaker / NFPA 10.

#### A. Metrik Integritas Tabung
- **Aman (> 60 Hari):** Tabung dengan usia uji tekan masih jauh dari batas waktu.
- **Mendekati Uji Tekan (< 60 Hari):** Tabung yang harus segera dijadwalkan ke vendor pihak ke-3.
- **Kadaluarsa (Expired):** Tabung yang telah melewati batas 5 tahun dan **wajib di-grounding / ditukar tabung cadangan**.
- **Perlu Cek Fisik:** Tabung yang tanggal produksinya tidak terbaca di pelat tabung lapangan.

#### B. Generator Surat Perintah Kerja (SPK) Vendor Pihak ke-3
- Admin dapat menandai (*checkbox*) tabung-tabung yang masuk kategori `< 60 hari` atau `kadaluarsa`.
- Tombol: `Buat Daftar Penugasan Vendor (PT Sepakat / Pihak ke-3)`.
- Sistem mengekspor daftar tabung terpilih lengkap dengan Nomor Seri, Merek, dan Lokasi Rig untuk lampiran PO vendor pengujian.

---

### 4.5 Generator Stiker QR Code Massal (*Bulk QR Sheet*)

Untuk mempermudah penempelan stiker fisik pada tabung APAR di seluruh 16 Rig:

1. **Format Lembar Cetak A4 Standard:**
   - Grid 3 kolom × 4 baris (12 stiker per lembar A4) atau 4 kolom × 6 baris (24 stiker mini).
2. **Desain Anatomi Setiap Stiker QR:**
   ```
   ┌──────────────────────────────────────────┐
   │ [BMS LOGO]  PT BUMI MEKAR SAKTI          │
   │ INSPEKSI APAR K3 & LINGKUNGAN KERJA      │
   ├───────────────────┬──────────────────────┤
   │                   │ RIG: BMS-07          │
   │   ┌───────────┐   │ KODE: APAR-BMS07-001 │
   │   │  ██ ▄█ ▀█ │   │ TIPE: Powder 9 Kg    │
   │   │  █▄ ▀█ ▄█ │   │ LOKASI: Rig Carrier  │
   │   └───────────┘   │ CHARGE: BMS          │
   │   Scan via Web    │ HYDROTEST: 2028-04   │
   └───────────────────┴──────────────────────┘
   ```
3. **Pilihan Cetak:**
   - Tombol `Print Langsung (Browser Print Preview)` dengan styling `@media print` rapi (latar putih bersih, garis potong putus-putus tipis).
   - Opsi filter cetak per Rig atau cetak seluruh armada.

---

### 4.6 Ekspor Laporan Excel Standar BMS (`/admin/reports`)

Format keluaran harus **100% identik** dengan format operasional file Excel `Tracking_APAR_2025.xlsx`:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ LAPORAN BULANAN PEMERIKSAAN ALAT PEMADAM API RINGAN (APAR)                                              │
│ Periode: November 2026  •  Armada: Seluruh Rig Operasional PT Bumi Mekar Sakti                        │
├────┬────────┬────────────┬─────────────┬───────────┬────────────┬─────────────┬──────┬───┬──────────────┤
│ NO │ RIG    │ TANGGAL    │ TYPE        │ SERIAL NO │ TAHUN APAR │ PENEMPATAN  │ ...  │7  │ HAL PERBAIKAN│
│    │        │            │             │           │            │             │      │PTS│              │
├────┼────────┼────────────┼─────────────┼───────────┼────────────┼─────────────┼──────┼───┼──────────────┤
│ 1  │ BMS-07 │ 2026-11-20 │ Powder 9 Kg │ FX-90211  │ 2023       │ Rig Carrier │  OK  │...│ -            │
│ 2  │ BMS-07 │ 2026-11-19 │ CO2 6.8 Kg  │ CD-55412  │ 2021       │ Mud Pump 1  │ RUSAK│...│ Ganti Selang │
└────┴────────┴────────────┴─────────────┴───────────┴────────────┴─────────────┴──────┴───┴──────────────┘
```

- **Ekspor Instan:** Menggunakan pembuatan Blob CSV / Data URI UTF-8 yang otomatis memicu download file `Laporan_APAR_BMS_[BULAN]_[TAHUN].csv` yang langsung dapat dibuka di Microsoft Excel tanpa error karakter encoding.
- **Opsi Cetak PDF:** Layout landscape siap cetak untuk dokumen rapat HSE bulanan.

---

## 5. Panduan Responsif & Ergonomi Desktop

| Breakpoint | Lebar Layar | Penyesuaian Antarmuka Admin |
| :--- | :--- | :--- |
| **Wide Desktop** | `>= 1440px` | Tampilan ideal: Sidebar 250px tetap terbuka, tabel 8-10 kolom penuh, Drawer verifikasi 800px tidak menutupi tabel utama. |
| **Standard Desktop** | `1280px - 1439px` | Layout standar: Sidebar 250px, tabel dengan scroll horizontal pada kolom sekunder, Drawer verifikasi melayang di atas konten. |
| **Laptop / Small Desktop** | `1024px - 1279px` | Sidebar dapat diciutkan (*collapsible*) menjadi mode ikon 64px untuk memberikan ruang tabel lebih lebar. |
| **Tablet Fallback** | `768px - 1023px` | Sidebar menjadi *off-canvas drawer* yang dipicu tombol hamburger di top bar. Matriks 16 rig beralih ke mode kartu ganda. |
| **Mobile Fallback** | `< 768px` | Kartu metrik bertumpuk 1 kolom, tabel berubah menjadi daftar kartu ringkas, tombol aksi tetap dapat diakses dengan jari. |

---

## 6. Integrasi Dialog SweetAlert2 (HSE Desktop Standard)

Seluruh dialog interaktif di modul Admin menggunakan helper terstandarisasi `swalHelper.js`:

1. **Konfirmasi Hapus APAR:**
   - Ikon: `warning`
   - Judul: `Hapus Tabung APAR?`
   - Teks: `Tabung [Kode Aset] di Rig [Rig] akan dihapus permanen dari basis data armada.`
   - Tombol: Merah `#DC2626` ("Ya, Hapus Unit").
2. **Konfirmasi Reset Password HFO:**
   - Ikon: `question`
   - Judul: `Reset Password Akun?`
   - Teks: `Password untuk personel [Nama HFO] akan dikembalikan ke setelan standar '123456'.`
   - Tombol: Biru `#2563EB` ("Ya, Reset Password").
3. **Konfirmasi Tutup Tiket Perbaikan:**
   - Ikon: `success`
   - Judul: `Setujui & Tutup Tiket?`
   - Teks: `Bukti perbaikan valid. Tiket akan diselesaikan dan status tabung otomatis kembali Layak.`
   - Tombol: Hijau `#16A34A` ("Setujui & Pulihkan Tabung").

---

## 7. Status & Langkah Implementasi

Desain antarmuka di atas sepenuhnya kompatibel dengan komponen bersama (`src/shared/`) dan siap diimplementasikan ke dalam struktur komponen React di `src/admin/` sebagaimana dirinci dalam dokumen [docs/architecture_admin.md](file:///c:/Users/ASUS/apar-inspection-app/docs/architecture_admin.md).