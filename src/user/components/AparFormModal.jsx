import React, { useState, useEffect, useMemo } from 'react';
import { useApar } from '../../shared/context/AparContext';
import { calculateHydrotest, formatDateDisplay } from '../../shared/utils/hydrotestUtils';
import { showError, showSuccess } from '../../shared/utils/swalHelper';
import {
  X,
  PlusCircle,
  Save,
  Wrench,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

const COMMON_PLACEMENTS = [
  'Rig Carrier',
  'Fire Box',
  'Mud Pump',
  'Dog House',
  'Engine Area',
  'Workshop Area',
  'Fuel Tank / Storage',
  'Camp Area'
];

export default function AparFormModal({ isOpen, onClose, editData = null, onSuccess }) {
  const { userApars, aparTypes, currentUser, createApar, updateApar } = useApar();

  const isEdit = Boolean(editData);
  const cleanRig = (currentUser?.rigId || 'BMS').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  // Hitung nomor urut aset berikutnya untuk auto-generate kode
  const suggestedAssetCode = useMemo(() => {
    if (!userApars || userApars.length === 0) {
      return `APAR-${cleanRig}-001`;
    }

    const numbers = userApars
      .map((a) => {
        const match = a.assetCode.match(/-(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));

    const nextNum = (numbers.length > 0 ? Math.max(...numbers) : 0) + 1;
    return `APAR-${cleanRig}-${String(nextNum).padStart(3, '0')}`;
  }, [userApars, cleanRig]);

  // Form states
  const [assetCode, setAssetCode] = useState('');
  const [typeId, setTypeId] = useState('');
  const [placement, setPlacement] = useState('');
  const [brandModel, setBrandModel] = useState('BMS Standard');
  const [serialNo, setSerialNo] = useState('-');
  const [chargeOwner, setChargeOwner] = useState('BMS');
  const [manufactureDate, setManufactureDate] = useState('');
  const [status, setStatus] = useState('layak');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inisialisasi data saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setAssetCode(editData.assetCode || '');
        setTypeId(editData.typeId || '');
        setPlacement(editData.placement || editData.location || '');
        setBrandModel(editData.brandModel || editData.brand || 'BMS Standard');
        setSerialNo(editData.serialNo || '-');
        setChargeOwner(editData.chargeOwner || 'BMS');
        setManufactureDate(editData.manufactureDate || '');
        setStatus(editData.status || 'layak');
      } else {
        setAssetCode(suggestedAssetCode);
        setTypeId(aparTypes[0]?.id || 'type_powder_9kg');
        setPlacement('');
        setBrandModel('BMS Standard');
        setSerialNo('-');
        setChargeOwner('BMS');
        setManufactureDate('');
        setStatus('layak');
      }
    }
  }, [isOpen, editData, suggestedAssetCode, aparTypes]);

  // Kalkulasi Hydrotest otomatis saat tanggal produksi berubah
  const hydrotestPreview = useMemo(() => {
    if (!manufactureDate) return null;
    return calculateHydrotest(
      manufactureDate,
      editData?.nextHydrotestDate,
      editData?.lastHydrotestDate,
      editData?.hydrotestVendor
    );
  }, [manufactureDate, editData]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!assetCode.trim()) {
      showError('Validasi Gagal', 'Kode Aset APAR wajib diisi.');
      return;
    }
    if (!typeId) {
      showError('Validasi Gagal', 'Silakan pilih tipe media APAR dari daftar.');
      return;
    }
    if (!placement.trim()) {
      showError('Validasi Gagal', 'Lokasi penempatan fisik tabung wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        assetCode: assetCode.trim().toUpperCase(),
        typeId,
        placement: placement.trim(),
        brandModel: brandModel.trim() || 'BMS Standard',
        serialNo: serialNo.trim() || 'TIDAK TERBACA',
        chargeOwner,
        manufactureDate: manufactureDate || null,
        status
      };

      if (isEdit) {
        await updateApar(editData.id, payload);
        showSuccess('Data Berhasil Diperbarui', `APAR ${payload.assetCode} berhasil diupdate ke Supabase.`);
      } else {
        await createApar(payload);
        showSuccess('APAR Berhasil Ditambahkan', `Unit ${payload.assetCode} tersimpan ke Supabase Rig ${currentUser?.rigId}.`);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      showError('Gagal Menyimpan APAR', err.message || 'Terjadi kesalahan pada koneksi Supabase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="p-4 sm:p-5 bg-[#0F172A] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white font-bold shrink-0">
              {isEdit ? <Wrench className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-red-400 font-bold">
                RIG {currentUser?.rigId} • K3 TABUNG APAR
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {isEdit ? `Edit Detail APAR: ${editData?.assetCode}` : 'Tambah Unit APAR Baru'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          {/* Baris 1: Kode Aset & Tipe Media */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Kode Aset APAR <span className="text-red-500">*</span>
                </label>
                {!isEdit && (
                  <button
                    type="button"
                    onClick={() => setAssetCode(suggestedAssetCode)}
                    className="text-[10px] font-mono text-red-600 hover:underline flex items-center gap-1 font-semibold"
                    title="Generate kode urut otomatis"
                  >
                    <Sparkles className="w-3 h-3" />
                    Auto
                  </button>
                )}
              </div>
              <input
                type="text"
                required
                value={assetCode}
                onChange={(e) => setAssetCode(e.target.value.toUpperCase())}
                placeholder="Contoh: APAR-BMS07-018"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Kode penomoran fisik unik tabung di rig ini.
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                Tipe Media APAR <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={typeId}
                onChange={(e) => setTypeId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
              >
                <option value="">-- Pilih Tipe Media --</option>
                {aparTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name || type.description}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 mt-1 block">
                7 Tipe master standar K3 operasional rig.
              </span>
            </div>
          </div>

          {/* Baris 2: Penempatan / Lokasi Fisik */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
              Lokasi Penempatan Fisik <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <MapPin className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={placement}
                onChange={(e) => setPlacement(e.target.value)}
                placeholder="Misal: Rig Carrier / Mud Pump / Fire Box"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
              />
            </div>
            {/* Quick Placement Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[10px] font-mono text-slate-400 self-center mr-1">Rekomendasi:</span>
              {COMMON_PLACEMENTS.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setPlacement(loc)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors ${
                    placement === loc
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          {/* Baris 3: Merek / Model & Nomor Seri */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                Merek / Model Tabung
              </label>
              <input
                type="text"
                value={brandModel}
                onChange={(e) => setBrandModel(e.target.value)}
                placeholder="Misal: BMS Standard / Yamato"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Nomor Seri (S/N)
                </label>
                <button
                  type="button"
                  onClick={() => setSerialNo('TIDAK TERBACA')}
                  className="text-[10px] font-mono text-slate-500 hover:text-slate-800 underline"
                >
                  Set Tidak Terbaca
                </button>
              </div>
              <input
                type="text"
                value={serialNo}
                onChange={(e) => setSerialNo(e.target.value)}
                placeholder="Nomor seri tabung atau '-'"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
              />
            </div>
          </div>

          {/* Baris 4: Kepemilikan (Charge) & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                Kepemilikan / Charge Tabung
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setChargeOwner('BMS')}
                  className={`py-2 px-3 rounded-xl font-bold font-mono text-center border transition-all ${
                    chargeOwner === 'BMS'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  BMS (Internal)
                </button>
                <button
                  type="button"
                  onClick={() => setChargeOwner('APM')}
                  className={`py-2 px-3 rounded-xl font-bold font-mono text-center border transition-all ${
                    chargeOwner === 'APM'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  APM (Mitra)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                Kondisi Operasional Tabung
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
              >
                <option value="layak">Kondisi Layak (Siap Operasi)</option>
                <option value="perlu_perbaikan">Perlu Perbaikan (Ada Kerusakan)</option>
                <option value="afkir">Afkir (Tidak Layak Pakai)</option>
              </select>
            </div>
          </div>

          {/* Banner Dokumen Hydrotest Khusus Admin HSE (Read-Only untuk User) */}
          {editData?.hydrotestDocUrl && (
            <div className="p-3 rounded-xl bg-blue-50/90 border border-blue-200/90 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <span className="font-bold text-blue-900 block">
                    Tersertifikasi • {editData.hydrotestVendor || 'Vendor Resmi'}
                  </span>
                  <span className="text-[10px] text-blue-700 font-mono">
                    Uji: {formatDateDisplay(editData.lastHydrotestDate)} • Exp: {formatDateDisplay(editData.nextHydrotestDate)}
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
                Wewenang Admin HSE
              </span>
            </div>
          )}

          {/* Baris 5: Tanggal Manufaktur & Auto Hydrotest (+5 Tahun) */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Tanggal Pembuatan Tabung (Manufaktur)
              </label>
              {manufactureDate && (
                <button
                  type="button"
                  onClick={() => setManufactureDate('')}
                  className="text-[10px] text-red-600 hover:underline"
                >
                  Hapus Tanggal
                </button>
              )}
            </div>

            <input
              type="date"
              value={manufactureDate}
              onChange={(e) => setManufactureDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
            />

            {/* Live Hydrotest Calculation Preview */}
            {hydrotestPreview && hydrotestPreview.isValid ? (
              <div className="mt-2 p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-[11px]">
                <div>
                  <span className="text-slate-500 block text-[10px] font-mono">
                    Jadwal Hydrotest Berikutnya (+5 Tahun):
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatDateDisplay(hydrotestPreview.hydrotestDateStr)}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${hydrotestPreview.badgeColor}`}>
                  {hydrotestPreview.shortLabel || hydrotestPreview.label}
                </span>
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 italic">
                * Isi tanggal pembuatan agar masa kadaluarsa hydrotest (+5 tahun) dihitung otomatis oleh sistem.
              </p>
            )}
          </div>

          {/* Footer Tombol Aksi */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-white font-bold transition-all shadow-sm flex items-center gap-2 btn-tactile"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan ke Cloud...' : isEdit ? 'Simpan Perubahan' : 'Tambahkan APAR'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
