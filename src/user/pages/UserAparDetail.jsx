import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApar } from '../../shared/context/AparContext';
import StatusBadge from '../../shared/components/StatusBadge';
import InspectionDetailModal from '../components/InspectionDetailModal';
import AparFormModal from '../components/AparFormModal';
import { calculateHydrotest, formatDateDisplay } from '../../shared/utils/hydrotestUtils';
import { showError, showConfirm, showSuccess } from '../../shared/utils/swalHelper';
import {
  ArrowLeft,
  Calendar,
  PlayCircle,
  Clock,
  ChevronRight,
  AlertTriangle,
  Tag,
  MapPin,
  Edit3,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  FileText,
  FileCheck,
  Download,
  X
} from 'lucide-react';

export default function UserAparDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userApars, rawApars, userInspections, aparTypes, currentUser, deleteApar } = useApar();

  const [selectedInspection, setSelectedInspection] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHydrotestDocModalOpen, setIsHydrotestDocModalOpen] = useState(false);

  const apar = userApars.find((a) => a.id === id) || rawApars?.find((a) => a.id === id);

  // Validasi Isolasi Rig: Cegah akses detail ke APAR milik Rig lain
  useEffect(() => {
    if (apar && currentUser?.rigId && apar.rigId !== currentUser.rigId) {
      showError(
        'Akses Dibatasi',
        `APAR ini (${apar.assetCode}) bukan milik Rig Anda (${currentUser.rigId}). Terdaftar pada Rig ${apar.rigId}.`
      );
      navigate('/user/apars', { replace: true });
    }
  }, [apar, currentUser, navigate]);

  if (!apar) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h2 className="text-sm font-bold text-slate-800">Unit Tidak Terdaftar</h2>
        <button
          onClick={() => navigate('/user/apars')}
          className="mt-3 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
        >
          Kembali ke Daftar
        </button>
      </div>
    );
  }

  // Jika APAR milik Rig lain, jangan render spesifikasi (akan dialihkan oleh useEffect)
  if (currentUser?.rigId && apar.rigId !== currentUser.rigId) {
    return null;
  }

  const aparType = aparTypes.find((t) => t.id === apar.typeId);
  const hydrotest = calculateHydrotest(apar);
  const aparHistory = userInspections.filter((i) => i.aparId === apar.id);

  const handleDelete = async () => {
    const hasHistory = aparHistory.length > 0;
    let warningText = `Apakah Anda yakin ingin menghapus unit APAR ${apar.assetCode}? Data tabung akan dihapus permanen dari Supabase.`;
    if (hasHistory) {
      warningText = `PERINGATAN AUDIT: Unit APAR ${apar.assetCode} memiliki ${aparHistory.length} catatan riwayat inspeksi. Menghapus tabung ini akan menghapus seluruh data inspeksi dan tiket perbaikan terkait. Jika tabung rusak/tidak dipakai, disarankan mengganti status menjadi "Afkir". Tetap ingin menghapus?`;
    }

    const confirmed = await showConfirm({
      title: `Hapus Unit ${apar.assetCode}?`,
      text: warningText,
      confirmText: 'Ya, Hapus Unit',
      cancelText: 'Batal',
      isDanger: true,
      icon: 'warning'
    });

    if (confirmed) {
      try {
        await deleteApar(apar.id);
        showSuccess('Unit Dihapus', `APAR ${apar.assetCode} berhasil dihapus.`);
        navigate('/user/apars');
      } catch (err) {
        showError('Gagal Menghapus', err.message || 'Terjadi kesalahan sistem.');
      }
    }
  };

  return (
    <div className="space-y-5">
      {/* Tombol Kembali */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali</span>
      </button>

      {/* Main Spec Sheet Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm">
        {/* Dark Industrial Plate Header */}
        <div className="p-4 sm:p-5 bg-[#0F172A] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                RIG {apar.rigId} • APAR UNIT TAG
              </span>
              {apar.chargeOwner && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-300">
                  {apar.chargeOwner}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-mono font-black tracking-tight text-white">
              {apar.assetCode}
            </h1>
          </div>
          <StatusBadge type="apar" status={apar.status} />
        </div>

        {/* Spec Grid & QR Presentation */}
        <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Kolom Kiri: Tabel Spesifikasi Fisik (2/3) */}
          <div className="md:col-span-2 space-y-4">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 block border-b border-slate-100 pb-2">
              Spesifikasi Tabung APAR
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Tipe Media</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {apar.typeName}
                </span>
                <span className="text-[11px] text-slate-500">
                  {aparType?.hasPressureGauge ? 'Dilengkapi Manometer' : 'Non-Manometer (Bobot Bersih)'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Penempatan Fisik</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block uppercase">
                  {apar.placement || '-'}
                </span>
                <span className="text-[11px] text-slate-500">Area Operasional Rig</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Merek / Seri Tabung</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {apar.brandModel || 'Standard'}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  S/N: {apar.serialNo || 'Tidak Terbaca'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] uppercase font-mono">Status Hydrotest (+5 Thn)</span>
                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                  <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${hydrotest.badgeColor}`}>
                    {hydrotest.label}
                  </span>
                  {apar.hydrotestVendor && (
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {apar.hydrotestVendor}
                    </span>
                  )}
                </div>
                <div className="mt-1.5 space-y-0.5 text-[10px] text-slate-500 font-mono">
                  {apar.lastHydrotestDate && (
                    <div className="flex justify-between">
                      <span>Uji Terakhir:</span>
                      <strong className="text-slate-700">{formatDateDisplay(apar.lastHydrotestDate)}</strong>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Jatuh Tempo:</span>
                    <strong className="text-slate-700">{formatDateDisplay(hydrotest.hydrotestDateStr)}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* HSE Certified Hydrotest Document Card */}
            {apar.hydrotestDocUrl && (
              <div className="p-3.5 bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-slate-50 rounded-xl border border-blue-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-800 bg-blue-100/90 border border-blue-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <FileCheck className="w-3 h-3 text-blue-700" />
                        Tersertifikasi • {apar.hydrotestVendor || 'Vendor Resmi'}
                      </span>
                      {apar.lastHydrotestDate && (
                        <span className="text-[10px] font-mono text-slate-500">
                          Uji: {formatDateDisplay(apar.lastHydrotestDate)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 mt-1 font-medium">
                      Dokumen hasil uji tekan resmi diunggah dan divalidasi oleh Administrator HSE (Read-Only).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsHydrotestDocModalOpen(true)}
                    className="py-2 px-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm btn-tactile"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Lihat Dokumen Hydrotest</span>
                  </button>
                </div>
              </div>
            )}

            {/* Micro-panel Info Inspeksi Terakhir Oleh HFO */}
            <div className="p-3 bg-red-50/60 rounded-xl border border-red-200/70 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-mono uppercase text-red-700 font-bold block">
                  Inspeksi Terakhir:
                </span>
                <span className="text-slate-900 font-bold mt-0.5 block">
                  {apar.lastInspectedBy ? apar.lastInspectedBy : 'Belum Pernah Diinspeksi'}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {apar.lastInspectionDate ? formatDateDisplay(apar.lastInspectionDate) : '-'}
                </span>
              </div>
              <span className="px-2 py-1 rounded bg-white text-slate-700 font-mono text-[10px] font-bold border border-red-200">
                HFO {apar.rigId}
              </span>
            </div>
          </div>

          {/* Kolom Kanan: HSE Unit Management Plate (1/3) */}
          <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-5 flex flex-col justify-between text-center space-y-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
                STATUS KESIAPAN K3
              </span>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2 text-left">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-mono">Kode Tag:</span>
                  <span className="font-mono font-bold text-slate-900">{apar.assetCode}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-mono">Rig Operasional:</span>
                  <span className="font-mono font-bold text-slate-900">{apar.rigId}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-mono">Charge:</span>
                  <span className="font-mono font-bold text-slate-900">{apar.chargeOwner || 'BMS'}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-mono">Status Tabung:</span>
                  <StatusBadge type="apar" status={apar.status} />
                </div>
              </div>
            </div>

            {/* Quick Actions Edit & Hapus */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="py-2 px-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="py-2 px-3 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Button: Start Inspect */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={() => navigate(`/user/inspect/${apar.id}`)}
            className="flex-1 py-3 px-6 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all btn-tactile"
          >
            <PlayCircle className="w-5 h-5 text-white" />
            <span>Mulai Form Inspeksi Unit Ini</span>
          </button>
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="py-3 px-5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Data APAR</span>
          </button>
        </div>
      </div>

      {/* Riwayat Inspeksi Unit */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h2 className="font-bold text-xs font-mono uppercase tracking-wider text-slate-500">
            Log Pemeriksaan ({aparHistory.length})
          </h2>
          <span className="text-[11px] text-slate-400 font-mono">Urut dari terbaru</span>
        </div>

        {aparHistory.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            Belum ada catatan inspeksi digital untuk tabung ini.
          </div>
        ) : (
          <div className="space-y-2">
            {aparHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedInspection(item)}
                className="p-3 rounded-xl border border-slate-200/70 hover:border-slate-300 bg-white hover:bg-slate-50/70 transition-colors flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {formatDateDisplay(item.inspectionDate)}
                    </span>
                    <span className="text-[10px] uppercase font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                      {item.category} {item.thirdPartyVendor ? `(${item.thirdPartyVendor})` : ''}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-1.5">
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-1 py-0.2 rounded font-bold">HFO</span>
                    <strong className="text-slate-800">{item.inspectorName}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge type="inspection" status={item.overallStatus} />
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedInspection && (
        <InspectionDetailModal
          inspection={selectedInspection}
          onClose={() => setSelectedInspection(null)}
        />
      )}

      {/* Modal Edit APAR */}
      <AparFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        editData={apar}
      />

      {/* Modal Dokumen Sertifikasi Hydrotest (Read-Only) */}
      {isHydrotestDocModalOpen && apar.hydrotestDocUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsHydrotestDocModalOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                    Sertifikasi Resmi Hydrotest (Read-Only)
                  </span>
                </div>
                <h3 className="text-sm font-mono font-bold text-white mt-0.5">
                  Dokumen Uji Tekan — {apar.assetCode}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHydrotestDocModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Info Bar */}
            <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
              <span className="text-slate-300">
                Vendor: <strong className="text-white">{apar.hydrotestVendor || 'Pihak Ketiga'}</strong>
              </span>
              <span className="text-slate-300">
                Uji: <strong className="text-white">{formatDateDisplay(apar.lastHydrotestDate)}</strong>
              </span>
              <span className="text-slate-300">
                Exp: <strong className="text-emerald-400">{formatDateDisplay(hydrotest.hydrotestDateStr)}</strong>
              </span>
            </div>

            {/* Document Preview Content */}
            <div className="p-3 bg-black/95 flex items-center justify-center max-h-[70vh] overflow-y-auto">
              {apar.hydrotestDocUrl.startsWith('data:application/pdf') || apar.hydrotestDocUrl.toLowerCase().includes('.pdf') ? (
                <div className="w-full h-[65vh] flex flex-col items-center justify-center text-center p-4">
                  <FileText className="w-16 h-16 text-blue-400 mb-3" />
                  <span className="text-sm font-bold text-white mb-1">
                    Dokumen Sertifikat Format PDF
                  </span>
                  <span className="text-xs text-slate-400 mb-4 max-w-sm">
                    Dokumen hasil uji tekan tabung {apar.assetCode} tersimpan dalam format berkas PDF resmi.
                  </span>
                  <a
                    href={apar.hydrotestDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={`Sertifikat-Hydrotest-${apar.assetCode}.pdf`}
                    className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Buka / Unduh Dokumen PDF</span>
                  </a>
                </div>
              ) : (
                <img
                  src={apar.hydrotestDocUrl}
                  alt={`Sertifikat Hydrotest ${apar.assetCode}`}
                  className="max-h-[68vh] w-auto object-contain rounded-lg shadow-md"
                />
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400 font-mono">
                * Dokumen diunggah khusus oleh Administrator HSE. Personel Rig hanya memiliki wewenang lihat (Read-Only).
              </span>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                {apar.hydrotestDocUrl && (
                  <a
                    href={apar.hydrotestDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={`Hydrotest-${apar.assetCode}`}
                    className="text-xs text-blue-400 hover:text-blue-300 font-mono py-1.5 px-3 rounded-lg border border-blue-900/60 hover:bg-blue-950/50 transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setIsHydrotestDocModalOpen(false)}
                  className="text-xs text-slate-300 hover:text-white font-mono py-1.5 px-3 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
