import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApar } from '../../shared/context/AparContext';
import { compressImageFile } from '../../shared/utils/imageUtils';
import { formatDateDisplay } from '../../shared/utils/hydrotestUtils';
import { showSuccess, showError, showConfirm } from '../../shared/utils/swalHelper';
import {
  ArrowLeft,
  Check,
  X,
  AlertTriangle,
  Camera,
  Calendar,
  Save,
  Lock,
  Building,
  CheckCircle2,
  Trash2,
  Wrench,
  Clock
} from 'lucide-react';

const CHECKLIST_ITEMS = [
  { key: 'handle', label: '1. Handle / Tuas', hint: 'Tuas tidak macet / bengkok' },
  { key: 'hose', label: '2. Hose / Selang', hint: 'Selang tidak getas / retak' },
  { key: 'nozle', label: '3. Nozle / Corong', hint: 'Corong bersih bebas sumbatan' },
  { key: 'pengamanTabung', label: '4. Pengaman Tabung', hint: 'Belt / klem dinding rig kokoh' },
  { key: 'pinHandle', label: '5. Pin Segel', hint: 'Pin baja & segel plastik utuh' },
  { key: 'pressureGauge', label: '6. Pressure Gauge', hint: 'Jarum di zona hijau (12-15 bar)' },
  { key: 'tabung', label: '7. Bodi Tabung', hint: 'Bebas korosi parah & penyok' }
];

export default function UserInspectForm() {
  const { aparId } = useParams();
  const navigate = useNavigate();
  const { userApars, rawApars, aparTypes, submitInspection, currentUser, userInspections, userMaintenances } = useApar();

  const apar = userApars.find((a) => a.id === aparId) || rawApars?.find((a) => a.id === aparId);
  const aparType = aparTypes.find((t) => t.id === apar?.typeId);
  const isCO2 = aparType ? !aparType.hasPressureGauge : false;

  const isDamagedStatus = apar?.status === 'perlu_perbaikan';

  // Validasi Isolasi Rig: Cegah akses form inspeksi ke APAR milik Rig lain
  useEffect(() => {
    if (apar && currentUser?.rigId && apar.rigId !== currentUser.rigId) {
      showError(
        'Akses Dibatasi',
        `APAR ini (${apar.assetCode}) bukan milik Rig Anda (${currentUser.rigId}). Terdaftar pada Rig ${apar.rigId}.`
      );
      navigate('/user/apars', { replace: true });
    }
  }, [apar, currentUser, navigate]);

  // Cari riwayat inspeksi terakhir untuk tabung ini
  const latestInspection = useMemo(() => {
    if (!userInspections || !aparId) return null;
    return userInspections
      .filter((i) => i.aparId === aparId)
      .sort((a, b) => {
        const dateDiff = new Date(b.inspectionDate || 0) - new Date(a.inspectionDate || 0);
        if (dateDiff !== 0) return dateDiff;
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      })[0] || null;
  }, [userInspections, aparId]);

  // Cari tiket perbaikan aktif untuk tabung ini
  const activeMaintenance = useMemo(() => {
    if (!userMaintenances || !aparId) return null;
    return userMaintenances
      .filter((m) => m.aparId === aparId && ['open', 'in_progress', 'pending_review'].includes(m.status))
      .sort((a, b) => new Date(b.createdAt || b.reportedDate || 0) - new Date(a.createdAt || a.reportedDate || 0))[0] || null;
  }, [userMaintenances, aparId]);

  const isPendingReview = activeMaintenance?.status === 'pending_review';
  const isOpenOrInProgress = activeMaintenance && ['open', 'in_progress'].includes(activeMaintenance.status);

  // Form States
  const [inspectionDate, setInspectionDate] = useState(
    () => new Date().toISOString().split('T')[0]
  );
  const [category, setCategory] = useState('bulanan');
  const [thirdPartyVendor, setThirdPartyVendor] = useState('Sepakat');

  // Checklist 7 Komponen (Pre-fill dari inspeksi terakhir jika status Perlu Perbaikan)
  const [checklist, setChecklist] = useState(() => {
    if (isDamagedStatus && latestInspection?.checklist) {
      const chk = latestInspection.checklist;
      return {
        handle: chk.handle || 'bagus',
        hose: chk.hose || 'bagus',
        nozle: chk.nozle || chk.nozzle || 'bagus',
        pengamanTabung: chk.pengamanTabung || chk.cylinderGuard || 'bagus',
        pinHandle: chk.pinHandle || chk.pinSegel || 'bagus',
        pressureGauge: isCO2 ? 'na' : (chk.pressureGauge || 'bagus'),
        tabung: chk.tabung || chk.cylinder || 'bagus'
      };
    }
    return {
      handle: 'bagus',
      hose: 'bagus',
      nozle: 'bagus',
      pengamanTabung: 'bagus',
      pinHandle: 'bagus',
      pressureGauge: isCO2 ? 'na' : 'bagus',
      tabung: 'bagus'
    };
  });

  const [issueDescription, setIssueDescription] = useState(() => {
    if (isDamagedStatus) {
      return activeMaintenance?.issueDescription || latestInspection?.notes || latestInspection?.issueDescription || '';
    }
    return '';
  });

  // Sinkronisasi otomatis saat latestInspection / activeMaintenance termuat secara asinkron
  useEffect(() => {
    if (isDamagedStatus && latestInspection?.checklist) {
      const chk = latestInspection.checklist;
      setChecklist({
        handle: chk.handle || 'bagus',
        hose: chk.hose || 'bagus',
        nozle: chk.nozle || chk.nozzle || 'bagus',
        pengamanTabung: chk.pengamanTabung || chk.cylinderGuard || 'bagus',
        pinHandle: chk.pinHandle || chk.pinSegel || 'bagus',
        pressureGauge: isCO2 ? 'na' : (chk.pressureGauge || 'bagus'),
        tabung: chk.tabung || chk.cylinder || 'bagus'
      });
      if (activeMaintenance?.issueDescription) {
        setIssueDescription(activeMaintenance.issueDescription);
      } else if (latestInspection?.notes) {
        setIssueDescription(latestInspection.notes);
      }
    }
  }, [isDamagedStatus, latestInspection?.id, activeMaintenance?.id, isCO2]);

  const [findingPhoto, setFindingPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);

  if (!apar) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h2 className="text-sm font-bold text-slate-800">Unit APAR Tidak Ditemukan</h2>
        <button
          onClick={() => navigate('/user/apars')}
          className="mt-3 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
        >
          Kembali ke Daftar APAR
        </button>
      </div>
    );
  }

  // Jika APAR milik Rig lain, jangan render form (akan dialihkan oleh useEffect)
  if (currentUser?.rigId && apar.rigId !== currentUser.rigId) {
    return null;
  }

  // Hitung jumlah komponen rusak
  const damagedItems = Object.entries(checklist).filter(([key, val]) => {
    if (key === 'pressureGauge' && isCO2) return false;
    return val === 'rusak';
  });
  const hasDamage = damagedItems.length > 0;

  const handleToggle = (key, value) => {
    if (isPendingReview) {
      showError(
        'Form Dinonaktifkan',
        'Bukti perbaikan untuk APAR ini sudah dikirim dan sedang Menunggu Verifikasi Admin.'
      );
      return;
    }
    setChecklist((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handlePhotoUpload = async (e) => {
    if (isPendingReview) return;
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const base64 = await compressImageFile(file, 800, 800, 0.7);
      setFindingPhoto(base64);
      setPhotoPreview(base64);
    } catch (err) {
      showError('Gagal Memproses Gambar', err.message || 'Format gambar tidak didukung.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isPendingReview) {
      showError(
        'Inspeksi Dinonaktifkan',
        'Bukti perbaikan untuk APAR ini sudah dikirim dan sedang Menunggu Verifikasi Admin. Silakan periksa statusnya di Halaman Perbaikan.'
      );
      return;
    }

    if (category === 'tahunan' && !thirdPartyVendor.trim()) {
      showError(
        'Vendor Pihak Ke-3 Wajib Diisi',
        'Nama vendor sertifikasi pihak ke-3 wajib diisi untuk inspeksi kategori Tahunan (contoh: Sepakat).'
      );
      return;
    }

    if (hasDamage && !issueDescription.trim()) {
      showError(
        'Hal Perbaikan Wajib Diisi',
        'Minimal 1 komponen fisik tercatat Rusak! Harap jelaskan temuan pada kolom Hal Perbaikan sebelum menyimpan.'
      );
      return;
    }

    if (hasDamage && !findingPhoto) {
      showError(
        'Foto Bukti Kerusakan Wajib Diunggah',
        'Minimal 1 komponen fisik tercatat Rusak! Harap lampirkan foto fisik komponen yang rusak agar Admin Pusat dapat memeriksa temuan awal.'
      );
      return;
    }

    const COMPONENT_LABELS = {
      handle: 'Handle',
      hose: 'Hose',
      nozle: 'Nozzle',
      pengamanTabung: 'Pengaman Tabung',
      pinHandle: 'Pin Segel',
      pressureGauge: 'Pressure Gauge',
      tabung: 'Tabung'
    };

    const damagedNames = damagedItems.map(([key]) => COMPONENT_LABELS[key] || key);
    const formattedIssue = hasDamage
      ? `[${damagedNames.join(', ')}] ${issueDescription.trim()}`
      : (issueDescription.trim() || '');

    const confirmed = await showConfirm({
      title: hasDamage ? 'Konfirmasi Temuan Kerusakan' : 'Konfirmasi Simpan Inspeksi',
      text: hasDamage
        ? `Tabung ${apar.assetCode} tercatat ada ${damagedItems.length} komponen rusak (${damagedNames.join(', ')}). Tiket perbaikan aktif (Work Order) otomatis diterbitkan ke Admin. Lanjutkan?`
        : `Simpan hasil pemeriksaan tabung ${apar.assetCode} sebagai Kondisi Layak Operasi?`,
      confirmText: hasDamage ? 'Ya, Terbitkan Tiket' : 'Ya, Simpan Layak',
      isDanger: hasDamage
    });

    if (!confirmed) return;

    try {
      setIsSubmitting(true);
      const res = await submitInspection({
        aparId: apar.id,
        inspectionDate,
        category,
        thirdPartyVendor,
        checklist,
        issueDescription: formattedIssue,
        findingPhoto
      });

      const hfoName = currentUser?.name || 'Inspektor Lapangan';
      const statusText = res.overallStatus === 'layak' ? 'LAYAK OPERASI' : 'PERLU PERBAIKAN';

      await showSuccess(
        res.overallStatus === 'layak' ? 'Inspeksi Berhasil Disimpan!' : 'Tiket Kerusakan Diterbitkan!',
        `Tabung ${apar.assetCode} dinyatakan ${statusText} oleh HFO ${hfoName}.`
      );

      navigate(`/user/apars/${apar.id}`);
    } catch (err) {
      showError('Gagal Menyimpan Inspeksi', err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successInfo) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 text-center max-w-md mx-auto shadow-sm my-6 space-y-4">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${
            successInfo.overallStatus === 'layak'
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              : 'bg-rose-50 text-rose-600 border border-rose-200'
          }`}
        >
          {successInfo.overallStatus === 'layak' ? (
            <CheckCircle2 className="w-8 h-8" />
          ) : (
            <AlertTriangle className="w-8 h-8" />
          )}
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-0.5">
            Laporan Tersimpan
          </span>
          <h2 className="text-base font-bold text-slate-900">
            {successInfo.overallStatus === 'layak'
              ? 'Inspeksi Berhasil Direkam'
              : 'Tiket Perbaikan Otomatis Terbit'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            {apar.assetCode} • {successInfo.overallStatus === 'layak' ? 'KONDISI LAYAK' : 'PERLU PERBAIKAN'}
          </p>
        </div>

        {successInfo.overallStatus === 'tidak_layak' && (
          <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-xl text-left text-xs text-rose-900 space-y-1">
            <span className="font-bold block">Status Work Order: OPEN</span>
            <p className="text-[11px] leading-relaxed">
              Tiket telah masuk antrean. Kru lapangan dapat mengunggah bukti penyelesaian di menu <strong>Perbaikan</strong>.
            </p>
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => navigate(`/user/apars/${apar.id}`)}
            className="flex-1 py-2.5 px-4 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors btn-tactile"
          >
            Lihat Spesifikasi
          </button>
          <button
            type="button"
            onClick={() => navigate('/user/dashboard')}
            className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors btn-tactile"
          >
            Kembali ke Console
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl w-full mx-auto space-y-3">
      {/* 1. Header Info APAR Lebih Ramping & Tipis */}
      <div className="bg-[#0F172A] text-white rounded-xl py-2 px-3.5 sm:px-4 shadow-sm border border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            title="Kembali"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono font-black text-sm sm:text-base text-white tracking-wide">
              {apar.assetCode}
            </span>
            <span className="text-[10px] font-mono font-bold bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-slate-300 uppercase">
              {apar.placement}
            </span>
            <span className="text-slate-400 text-xs hidden sm:inline">
              • {apar.typeName} {apar.brandModel ? `(${apar.brandModel})` : ''}
            </span>
          </div>
        </div>

        {/* Live Status Tag */}
        <div className="shrink-0">
          {hasDamage ? (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
              {damagedItems.length} KOMPONEN RUSAK
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              7/7 KOMPONEN NORMAL
            </span>
          )}
        </div>
      </div>

      {/* 1. Banner Biru: Jika Tiket Berstatus pending_review (Menunggu Verifikasi Admin) */}
      {isPendingReview && (
        <div className="bg-blue-50 border border-blue-200/90 rounded-xl p-3 sm:py-3 sm:px-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-start sm:items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 text-blue-600">
              <Clock className="w-4.5 h-4.5" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-blue-950 block text-xs sm:text-sm">
                Bukti perbaikan untuk APAR ini sudah dikirim dan sedang Menunggu Verifikasi Admin.
              </span>
              <p className="text-[11px] text-blue-800 leading-relaxed mt-0.5">
                Tiket perbaikan ({activeMaintenance.id}) telah dilengkapi bukti fisik oleh <strong className="font-semibold text-blue-950">{activeMaintenance.evidenceUploadedBy || 'HFO Lapangan'}</strong>. Tombol submit dinonaktifkan untuk mencegah pembuatan tiket ganda.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/user/maintenances')}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold shrink-0 flex items-center justify-center gap-1.5 shadow-sm btn-tactile transition-colors"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Lihat Status di Halaman Perbaikan</span>
          </button>
        </div>
      )}

      {/* 2. Banner Peringatan: Jika Tiket Berstatus open atau in_progress (Belum Unggah Bukti Selesai) */}
      {!isPendingReview && (isOpenOrInProgress || isDamagedStatus) && (
        <div className="bg-amber-50 border border-amber-200/90 rounded-xl p-3 sm:py-2.5 sm:px-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in duration-150">
          <div className="flex items-start sm:items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 text-amber-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-amber-950 block">
                Tiket Perbaikan Sedang Aktif ({activeMaintenance?.status === 'in_progress' ? 'Sedang Diproses' : 'Status: Open'})
              </span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Unit APAR ini memiliki tiket perbaikan aktif. Harap selesaikan unggah bukti tindakan perbaikan melalui tombol di samping daripada membuat tiket baru.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/user/maintenances')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shrink-0 flex items-center justify-center gap-1.5 shadow-sm btn-tactile transition-colors"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Buka Halaman Perbaikan</span>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {errorMessage && (
          <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-xs flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 2. Parameter Pemeriksaan: Satu Baris Horizontal Penuh */}
        <div className="bg-white rounded-xl border border-slate-200/90 py-2.5 px-3.5 sm:px-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
              1. Parameter:
            </span>
            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
              Rig {apar.rigId}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {/* Input Tanggal Pengecekan */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                Tanggal:
              </span>
              <input
                type="date"
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-600 bg-white"
                required
              />
            </div>

            {/* Tombol Klasifikasi Inspeksi */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                Klasifikasi:
              </span>
              <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setCategory('bulanan')}
                  className={`px-2.5 py-1 rounded-md font-bold text-xs transition-all ${
                    category === 'bulanan'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Bulanan (Kru Rig)
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('tahunan')}
                  className={`px-2.5 py-1 rounded-md font-bold text-xs transition-all ${
                    category === 'tahunan'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tahunan (Vendor)
                </button>
              </div>
            </div>

            {/* Input Vendor Pihak ke-3 (Muncul Inline di Baris yang Sama jika Tahunan) */}
            {category === 'tahunan' && (
              <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                <span className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                  Vendor <span className="text-red-600">*</span>:
                </span>
                <input
                  type="text"
                  value={thirdPartyVendor}
                  onChange={(e) => setThirdPartyVendor(e.target.value)}
                  placeholder="Contoh: Sepakat"
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-600 w-32 sm:w-40"
                  required
                />
              </div>
            )}
          </div>
        </div>

        {/* 3. Checklist 7 Titik Kritis: Grid Horizontal Landscape (2 Baris di Desktop) */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-4 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
              2. Checklist Fisik 7 Titik Kritis (Standar NFPA 10)
            </span>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
              Pilih Kondisi Per Komponen
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {CHECKLIST_ITEMS.map((item) => {
              const isPressureGauge = item.key === 'pressureGauge';
              const isCO2PressureGauge = isPressureGauge && isCO2;
              const currentVal = checklist[item.key];

              return (
                <div
                  key={item.key}
                  className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/60 flex flex-col justify-between gap-2 hover:border-slate-300 transition-colors"
                >
                  {/* Bagian Atas: Nama Komponen + Deskripsi Singkat */}
                  <div>
                    <span className="font-bold text-xs text-slate-900 block truncate">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate mt-0.5" title={item.hint}>
                      {isCO2PressureGauge
                        ? 'Pengukuran bobot timbangan (non-manometer)'
                        : item.hint}
                    </span>
                  </div>

                  {/* Bagian Bawah: Switch Tombol Bagus / Rusak atau Lock N/A */}
                  <div>
                    {isCO2PressureGauge ? (
                      /* Safety Lockout Tagout untuk CO2 */
                      <div className="w-full py-1.5 px-2 rounded-lg bg-slate-200 border border-slate-300 text-slate-700 text-xs font-mono font-bold flex items-center justify-center gap-1.5 select-none cursor-not-allowed">
                        <Lock className="w-3 h-3 text-slate-500" />
                        <span>N/A (SISTEM CO2)</span>
                      </div>
                    ) : (
                      /* 2 Tombol Segmen Kompak Berdampingan */
                      <div className="grid grid-cols-2 gap-1.5 bg-slate-200/70 p-0.5 rounded-lg border border-slate-200">
                        {/* Tombol Bagus */}
                        <button
                          type="button"
                          disabled={isPendingReview}
                          onClick={() => handleToggle(item.key, 'bagus')}
                          className={`py-1.5 px-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                            isPendingReview
                              ? currentVal === 'bagus'
                                ? 'bg-emerald-600/70 text-white cursor-not-allowed'
                                : 'text-slate-400 cursor-not-allowed'
                              : currentVal === 'bagus'
                              ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-700'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Bagus</span>
                        </button>

                        {/* Tombol Rusak */}
                        <button
                          type="button"
                          disabled={isPendingReview}
                          onClick={() => handleToggle(item.key, 'rusak')}
                          className={`py-1.5 px-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                            isPendingReview
                              ? currentVal === 'rusak'
                                ? 'bg-rose-600/70 text-white cursor-not-allowed'
                                : 'text-slate-400 cursor-not-allowed'
                              : currentVal === 'rusak'
                              ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-700'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <X className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Rusak</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Panel Kondisional Temuan Kerusakan (Menyamping: 2/3 Textarea & 1/3 Upload Foto) */}
        {hasDamage && (
          <div className="bg-rose-50/80 border border-rose-300/80 rounded-xl p-3 sm:p-4 shadow-sm space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-rose-900">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-bold text-xs uppercase tracking-wider">
                Tindakan Temuan Lapangan ({damagedItems.length} Titik Rusak) — Wajib Isi
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
              {/* Kolom 1 & 2: Textarea Hal Perbaikan */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-rose-950 mb-1">
                  Hal Perbaikan / Uraian Kerusakan <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  rows={2}
                  placeholder="Contoh: Hose getas retak, jarum manometer drop di bawah zona hijau..."
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-rose-300 focus:outline-none focus:ring-1 focus:ring-rose-600 bg-white font-medium text-slate-900"
                  required={hasDamage}
                />
              </div>

              {/* Kolom 3: Upload Foto Fisik Kerusakan */}
              <div className="md:col-span-1">
                <span className="block text-xs font-bold text-rose-950 mb-1">
                  Foto Bukti Kerusakan <span className="text-red-600">*</span>
                </span>
                <div className="flex items-center gap-2">
                  <label className="flex-1 px-3 py-2 bg-white border border-rose-300 hover:border-rose-400 text-rose-900 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm btn-tactile">
                    <Camera className="w-3.5 h-3.5 text-rose-600" />
                    <span>{photoPreview ? 'Ganti Foto' : 'Pilih Foto'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>

                  {photoPreview && (
                    <div className="relative inline-block shrink-0">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-9 h-9 object-cover rounded-lg border border-rose-300"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoPreview(null);
                          setFindingPhoto(null);
                        }}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-700 text-white flex items-center justify-center text-[10px] font-bold shadow"
                        title="Hapus foto"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                {isCompressing && (
                  <span className="text-[10px] text-rose-700 font-mono animate-pulse mt-0.5 block">
                    Mengompres foto...
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4.b Dokumentasi Opsional jika Semua Komponen Layak */}
        {!hasDamage && (
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-slate-800 block">Kondisi 7 Titik Komponen Bagus (Layak)</span>
                <span className="text-[11px] text-slate-500">Foto fisik tabung saat pemeriksaan (opsional).</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm btn-tactile">
                <Camera className="w-3.5 h-3.5 text-slate-500" />
                <span>{photoPreview ? 'Ganti Foto' : 'Foto Tabung (Opsional)'}</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              {photoPreview && (
                <div className="relative inline-block shrink-0">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-8 h-8 object-cover rounded-lg border border-slate-300"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoPreview(null);
                      setFindingPhoto(null);
                    }}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px] font-bold shadow"
                    title="Hapus foto"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. Baris Bawah Ringkas: Ringkasan Status & Tombol Simpan Inspeksi */}
        <div className="bg-white rounded-xl border border-slate-200/90 py-2.5 px-3.5 sm:px-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs">
            {isPendingReview ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 animate-ping" />
                <span className="font-bold text-blue-800">
                  Menunggu Verifikasi Admin
                </span>
                <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
                  • Submit Dinonaktifkan (Cegah Tiket Ganda)
                </span>
              </>
            ) : hasDamage ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0 animate-pulse" />
                <span className="font-bold text-rose-700">
                  {damagedItems.length} Titik Rusak
                </span>
                <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
                  • Otomatis Terbitkan Work Order Tiket
                </span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-bold text-slate-800">
                  7/7 Titik Pemeriksaan Normal
                </span>
                <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
                  • Tabung Siap Dinyatakan Layak Operasi
                </span>
              </>
            )}
          </div>

          {isPendingReview ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/user/maintenances')}
                className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-1.5 btn-tactile"
              >
                <Wrench className="w-4 h-4" />
                <span>Lihat Status di Halaman Perbaikan</span>
              </button>
              <button
                type="button"
                disabled
                className="py-2 px-4 rounded-xl bg-slate-200 text-slate-400 font-bold text-xs sm:text-sm cursor-not-allowed flex items-center justify-center gap-1.5 select-none"
                title="Tombol submit dinonaktifkan karena sedang menunggu verifikasi Admin"
              >
                <Lock className="w-4 h-4" />
                <span>Submit Terkunci</span>
              </button>
            </div>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting || isCompressing}
              className={`py-2 px-6 rounded-xl text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 btn-tactile ${
                hasDamage
                  ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800'
                  : 'bg-red-600 hover:bg-red-700 active:bg-red-800'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Menyimpan...'
                  : hasDamage
                  ? 'Simpan & Buat Tiket Rusak'
                  : 'Simpan Hasil Inspeksi'}
              </span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
