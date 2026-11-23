# Architecture Specification — Modul User (`ARCHITECTURE_USER.md`)
## Sistem Tracking & Inspeksi APAR (`apar-inspection-app`)

---

## 1. Arsitektur & Batasan Kerja
Aplikasi menggunakan **React (Vite) + Tailwind CSS** yang di-deploy ke **Vercel**. Seluruh kode fitur User diisolasi di dalam folder `src/user/`, sedangkan kontrak data bersama berada di `src/shared/` agar tidak berkonflik dengan folder `src/admin/` milik rekan tim.

- **Penyimpanan:** `localStorage` melalui `AparContext` (kunci berawalan `bms_apar_v1_`).
- **Routing:** `react-router-dom` dengan `vercel.json` rewrite ke `/index.html` agar tidak 404 saat refresh.
- **Catatan Penting:** File di `src/admin/` cukup dibuat 1 halaman placeholder sementara bila rekan tim belum menggabungkan kodenya.

---

## 2. Struktur Folder (Fokus User & Shared)

```text
apar-inspection-app/
├── vercel.json
├── package.json
└── src/
    ├── App.jsx
    ├── shared/                        # Kontrak Data Bersama
    │   ├── context/
    │   │   └── AparContext.jsx        # State & aksi CRUD localStorage
    │   ├── data/
    │   │   ├── rigsSeed.js            # 16 Rig operasional
    │   │   ├── aparTypesSeed.js       # 7 Master tipe APAR
    │   │   └── aparsSeed.js           # Data awal APAR (termasuk contoh rusak & CO2)
    │   ├── utils/
    │   │   ├── hydrotestUtils.js      # Hitung +5 tahun & status kadaluarsa
    │   │   └── imageUtils.js          # Kompres foto upload ke base64 (< 300KB)
    │   ├── components/
    │   │   ├── StatusBadge.jsx
    │   │   └── ProtectedRoute.jsx
    │   └── pages/
    │       └── LoginPage.jsx          # Pilih User Rig (+ placeholder tab Admin)
    │
    └── user/                          # FOKUS PENGERJAAN KAMU
        ├── components/
        │   ├── UserLayout.jsx         # Top Bar + Bottom Nav (HP) / Sidebar (Desktop)
        │   ├── AparCard.jsx           # Kartu ringkas APAR
        │   ├── QrScannerBox.jsx       # Kamera html5-qrcode + fallback manual
        │   └── InspectionDetailModal.jsx # Modal detail 7 komponen di Riwayat
        └── pages/
            ├── UserDashboard.jsx      # /user/dashboard
            ├── UserAparList.jsx       # /user/apars
            ├── UserAparDetail.jsx     # /user/apars/:id
            ├── UserScanPage.jsx       # /user/scan
            ├── UserInspectForm.jsx    # /user/inspect/:aparId
            ├── UserMaintenances.jsx   # /user/maintenances
            └── UserHistory.jsx        # /user/history
```

---

## 3. Kontrak Data & Fungsi `AparContext.jsx` yang Dipakai Modul User

### State & Selector Khusus User (Otomatis Terfilter `currentUser.rigId`)
- `currentUser`: `{ role: 'user', name: string, rigId: string }`
- `userApars`: Daftar APAR milik Rig yang sedang login.
- `userInspections`: Riwayat inspeksi milik Rig yang sedang login.
- `userMaintenances`: Daftar tiket perbaikan milik Rig yang sedang login.
- `aparTypes` & `rigs`: Data referensi master.

### Aksi (Actions) yang Dipanggil dari Halaman User
1. `loginAsUser(inspectorName, rigId)`: Menyimpan sesi User ke state & `localStorage`.
2. `logout()`: Menghapus sesi dan kembali ke `/login`.
3. `submitInspection(payload)`:
   - Menerima `{ aparId, inspectionDate, category, thirdPartyVendor, checklist, issueDescription, findingPhoto }`.
   - Memaksa `checklist.pressureGauge = 'na'` jika tipe APAR punya `hasPressureGauge === false`.
   - Menentukan `overallStatus = 'tidak_layak'` jika ada komponen `'rusak'`, selain itu `'layak'`.
   - Menyimpan record baru ke `inspections` dan memperbarui `apar.status`.
   - Jika `overallStatus === 'tidak_layak'`, otomatis menambah tiket baru ke `maintenances` dengan `status: 'open'`.
4. `uploadRepairEvidence(maintenanceId, photoBase64, repairNotes)`:
   - Mengisi `evidencePhoto` dan `repairNotes` pada tiket terkait, lalu mengubah `status` menjadi `'pending_review'`.
5. `resetDemoData()`: Mengembalikan seluruh `localStorage` ke data seed awal.

---

## 4. Pengamanan Teknis Khusus Frontend-Only
1. **Kompresi Foto Sebelum Simpan ke `localStorage`:** Kapasitas `localStorage` terbatas (~5 MB). Setiap foto yang diunggah di form inspeksi atau bukti perbaikan wajib dikompres lewat `<canvas>` (`imageUtils.js`) maksimal lebar `800px` kualitas JPEG `0.7` agar tidak memicu `QuotaExceededError`.
2. **Perhitungan Hydrotest Aman:** `hydrotestUtils.js` wajib mem-parsing `manufactureDate` (`YYYY-MM-DD`) dan menambah **5 tahun penuh** (`setFullYear(year + 5)`), serta menangani kasus `manufactureDate === null` sebagai status `"Perlu Cek Fisik"`.
3. **Konfigurasi Vercel (`vercel.json`):**
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```
