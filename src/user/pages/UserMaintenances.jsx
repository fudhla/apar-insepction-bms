import React, { useState } from 'react';
import { useApar } from '../../shared/context/AparContext';
import StatusBadge from '../../shared/components/StatusBadge';
import { compressImageFile } from '../../shared/utils/imageUtils';
import { formatDateDisplay } from '../../shared/utils/hydrotestUtils';
import { showSuccess, showError } from '../../shared/utils/swalHelper';
import {
  Wrench,
  Upload,
  Camera,
  CheckCircle2,
  X,
  Calendar,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building,
  User,
  ArrowRight
} from 'lucide-react';

export default function UserMaintenances() {
  const { userMaintenances, uploadRepairEvidence, currentUser } = useApar();

  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [repairNotes, setRepairNotes] = useState('');
  const [photoBase64, setPhotoBase64] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPhotoModal, setSelectedPhotoModal] = useState(null);

  const filteredTickets = userMaintenances.filter((item) => {
    if (filterStatus === 'all') return true;
    return item.status === filterStatus;
  });

  const openUploadModal = (ticket) => {
    setSelectedTicket(ticket);
    setRepairNotes(ticket.repairNotes || '');
    setPhotoBase64(ticket.evidencePhoto || null);
    setPreviewPhoto(ticket.evidencePhoto || null);
    setErrorMsg('');
  };

  const closeUploadModal = () => {
    setSelectedTicket(null);
    setRepairNotes('');
    setPhotoBase64(null);
    setPreviewPhoto(null);
    setErrorMsg('');
  };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      setErrorMsg('');
      const compressed = await compressImageFile(file, 800, 800, 0.7);
      setPhotoBase64(compressed);
      setPreviewPhoto(compressed);
    } catch (err) {
      showError('Gagal Memproses Gambar', err.message || 'Format gambar tidak didukung.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleEvidenceSubmit = async (e) => {
    e.preventDefault();
    if (!repairNotes.trim()) {
      showError('Catatan Tindakan Kosong', 'Harap isi uraian tindakan perbaikan singkat sebelum mengirim.');
      return;
    }
    if (!photoBase64) {
      showError('Foto Fisik Wajib Diunggah', 'Harap lampirkan foto fisik tabung yang sudah selesai diperbaiki (After).');
      return;
    }

    try {
      setIsSubmitting(true);
      await uploadRepairEvidence(selectedTicket.id, photoBase64, repairNotes);
      const ticketAsset = selectedTicket.assetCode;
      closeUploadModal();
      await showSuccess(
        'Bukti Perbaikan Terkirim!',
        `Tiket ${ticketAsset} berhasil diperbarui. Status tiket kini menjadi Pending Review dan menunggu verifikasi Admin.`
      );
    } catch (err) {
      showError('Gagal Mengirim Bukti', err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400 block mb-0.5">
          WORK ORDER SYSTEM • RIG {currentUser?.rigId}
        </span>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Tindak Lanjut Perbaikan APAR
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Daftar tiket kerusakan tabung real-time dari Supabase Cloud untuk siklus perbaikan hingga verifikasi Admin.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { key: 'all', label: `Semua (${userMaintenances.length})` },
          {
            key: 'open',
            label: `Menunggu (${userMaintenances.filter((m) => m.status === 'open').length})`
          },
          {
            key: 'in_progress',
            label: `Diproses (${userMaintenances.filter((m) => m.status === 'in_progress').length})`
          },
          {
            key: 'pending_review',
            label: `Verifikasi (${userMaintenances.filter((m) => m.status === 'pending_review').length})`
          },
          {
            key: 'closed',
            label: `Selesai (${userMaintenances.filter((m) => m.status === 'closed').length})`
          }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilterStatus(tab.key)}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border ${
              filterStatus === tab.key
                ? 'bg-[#0F172A] text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200/90 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List Work Order Cards */}
      {filteredTickets.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 p-6 space-y-1">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">Tidak Ada Tiket Terbuka</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Semua tabung di Rig {currentUser?.rigId} beroperasi normal tanpa temuan kerusakan aktif.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => {
            const isClosed = ticket.status === 'closed';
            const isPending = ticket.status === 'pending_review';
            const isInProgress = ticket.status === 'in_progress';
            const isOpen = ticket.status === 'open';

            return (
              <div
                key={ticket.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm space-y-3"
              >
                {/* Header Card */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-slate-900">
                      {ticket.assetCode}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      WO: {ticket.id}
                    </span>
                  </div>
                  <StatusBadge type="maintenance" status={ticket.status} />
                </div>

                {/* Deskripsi Temuan Kerusakan */}
                <div className="text-xs space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-mono font-bold block">
                    Uraian Temuan Kerusakan:
                  </span>
                  <p className="text-slate-900 font-medium bg-rose-50/70 p-2.5 rounded-xl border border-rose-100 text-rose-950 leading-relaxed">
                    {ticket.issueDescription}
                  </p>
                </div>

                {/* 1. STATUS: OPEN (Menunggu Tindakan Admin) */}
                {isOpen && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center gap-2 text-slate-700 font-bold">
                      <Clock className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>Status: Menunggu Respon & Arahan Admin Pusat</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Laporan kerusakan telah masuk ke antrean Admin HSE Pusat. Menunggu penentuan jenis tindakan (Perbaikan / Pergantian Suku Cadang / Isi Ulang / Hydrotest).
                    </p>

                    {ticket.findingPhoto && (
                      <div>
                        <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                          Foto Temuan Kerusakan Awal:
                        </span>
                        <img
                          src={ticket.findingPhoto}
                          alt="Foto Kerusakan"
                          onClick={() => setSelectedPhotoModal({ title: `Foto Kerusakan Awal (Before) — ${ticket.assetCode}`, src: ticket.findingPhoto })}
                          className="w-24 h-24 object-cover rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* 2. STATUS: IN_PROGRESS (Sedang Diproses Admin) */}
                {isInProgress && (
                  <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-xs space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-bold text-amber-950">
                        <Wrench className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Instruksi Tindakan Admin:</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono bg-amber-200/70 text-amber-900 border border-amber-300 uppercase">
                        {ticket.actionType || 'Perbaikan Teknis'}
                      </span>
                    </div>

                    {ticket.vendorName && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-700 font-medium">
                        <Building className="w-3.5 h-3.5 text-slate-500" />
                        <span>Vendor Ditugaskan: <strong className="text-slate-900 font-bold">{ticket.vendorName}</strong></span>
                      </div>
                    )}

                    {/* Kotak Peringatan Catatan / Feedback Penolakan dari Admin */}
                    {ticket.adminNotes && (
                      <div className="p-2.5 bg-amber-100/70 border border-amber-300 rounded-lg text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-amber-900">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span>Catatan / Evaluasi Admin Pusat:</span>
                        </div>
                        <p className="text-amber-950 leading-relaxed font-medium pl-5 text-[11px]">
                          {ticket.adminNotes}
                        </p>
                      </div>
                    )}

                    {ticket.findingPhoto && (
                      <div>
                        <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                          Foto Kerusakan Awal (Before):
                        </span>
                        <img
                          src={ticket.findingPhoto}
                          alt="Foto Kerusakan"
                          onClick={() => setSelectedPhotoModal({ title: `Foto Kerusakan Awal (Before) — ${ticket.assetCode}`, src: ticket.findingPhoto })}
                          className="w-24 h-24 object-cover rounded-xl border border-amber-200 shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* 3. STATUS: PENDING_REVIEW (Menunggu Verifikasi Admin) */}
                {isPending && (
                  <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-xs space-y-2.5">
                    <div className="flex items-center justify-between text-blue-950 font-bold">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>Bukti Perbaikan Berhasil Dikirim</span>
                      </div>
                      <span className="text-[10px] font-mono text-blue-700 bg-blue-100 px-2 py-0.5 rounded-lg border border-blue-200 font-bold">
                        MENUNGGU VERIFIKASI ADMIN
                      </span>
                    </div>

                    {ticket.repairNotes && (
                      <p className="text-slate-800 font-medium bg-white/80 p-2.5 rounded-lg border border-blue-100 text-[11px] leading-relaxed">
                        <strong className="text-blue-900 block font-mono text-[10px] uppercase mb-0.5">Catatan Tindakan HFO:</strong>
                        "{ticket.repairNotes}"
                      </p>
                    )}

                    {ticket.evidenceUploadedBy && (
                      <span className="text-[11px] text-blue-900 font-medium block">
                        Diunggah oleh: <strong className="font-bold text-slate-900">{ticket.evidenceUploadedBy}</strong>
                      </span>
                    )}

                    {/* Foto Komparasi Before & After Saat Menunggu Verifikasi */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {ticket.findingPhoto && (
                        <div>
                          <span className="text-[10px] uppercase font-mono text-slate-500 block mb-1 font-semibold">
                            Foto Sebelum (Before):
                          </span>
                          <img
                            src={ticket.findingPhoto}
                            alt="Temuan Awal (Before)"
                            onClick={() => setSelectedPhotoModal({ title: `Foto Temuan Awal (Before) — ${ticket.assetCode}`, src: ticket.findingPhoto })}
                            className="w-full h-24 object-cover rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:opacity-90 transition-opacity"
                          />
                        </div>
                      )}
                      {ticket.evidencePhoto && (
                        <div>
                          <span className="text-[10px] uppercase font-mono text-blue-600 block mb-1 font-bold">
                            Foto Sesudah (After):
                          </span>
                          <img
                            src={ticket.evidencePhoto}
                            alt="Bukti Selesai (After)"
                            onClick={() => setSelectedPhotoModal({ title: `Foto Bukti Perbaikan (After) — ${ticket.assetCode}`, src: ticket.evidencePhoto })}
                            className="w-full h-24 object-cover rounded-xl border border-blue-300 shadow-xs cursor-pointer hover:opacity-90 transition-opacity"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. STATUS: CLOSED (Selesai & Disetujui Admin) */}
                {isClosed && (
                  <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs space-y-2.5">
                    <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Tiket Telah Selesai & Disetujui Admin Pusat</span>
                    </div>

                    {/* Foto Komparasi Before & After */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {ticket.findingPhoto && (
                        <div>
                          <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                            Foto Sebelum (Before):
                          </span>
                          <img
                            src={ticket.findingPhoto}
                            alt="Before"
                            onClick={() => setSelectedPhotoModal({ title: `Foto Sebelum (Before) — ${ticket.assetCode}`, src: ticket.findingPhoto })}
                            className="w-full h-24 object-cover rounded-xl border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                          />
                        </div>
                      )}
                      {ticket.evidencePhoto && (
                        <div>
                          <span className="text-[10px] uppercase font-mono text-emerald-600 block mb-1 font-bold">
                            Foto Sesudah (After):
                          </span>
                          <img
                            src={ticket.evidencePhoto}
                            alt="After"
                            onClick={() => setSelectedPhotoModal({ title: `Foto Sesudah (After) — ${ticket.assetCode}`, src: ticket.evidencePhoto })}
                            className="w-full h-24 object-cover rounded-xl border border-emerald-300 cursor-pointer hover:opacity-90 transition-opacity"
                          />
                        </div>
                      )}
                    </div>

                    {ticket.adminNotes && (
                      <div className="p-2 bg-white/80 rounded-lg border border-emerald-200 text-[11px] text-slate-700">
                        <strong className="text-emerald-900">Catatan Penutupan Admin:</strong> {ticket.adminNotes}
                      </div>
                    )}

                    <div className="text-[11px] text-emerald-800 font-medium">
                      Status tabung otomatis pulih menjadi <strong>Layak Operasi</strong>.
                    </div>
                  </div>
                )}

                {/* Card Footer */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-3 text-slate-500 text-[11px] font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDateDisplay(ticket.reportedDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Pelapor: <strong className="text-slate-800">{ticket.reportedBy || ticket.inspectorName}</strong>
                    </span>
                  </div>

                  {/* Tombol Upload Bukti Perbaikan */}
                  {(isOpen || isInProgress || isPending) && (
                    <button
                      type="button"
                      onClick={() => openUploadModal(ticket)}
                      className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors btn-tactile shadow-sm ${
                        isInProgress
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : isPending
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-slate-900 hover:bg-black text-white'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5 text-white" />
                      <span>
                        {isInProgress
                          ? 'Upload Bukti Perbaikan (After)'
                          : isPending
                          ? 'Perbarui Bukti Perbaikan'
                          : 'Upload Bukti Perbaikan'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Upload Bukti Perbaikan */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-700/30 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-[#0F172A] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Work Order Perbaikan APAR
                </span>
                <h3 className="font-mono font-bold text-sm text-white">
                  Unggah Bukti: {selectedTicket.assetCode}
                </h3>
              </div>
              <button
                onClick={closeUploadModal}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEvidenceSubmit} className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Uraian Tindakan Perbaikan <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={repairNotes}
                  onChange={(e) => setRepairNotes(e.target.value)}
                  rows={3}
                  placeholder="Contoh: Hose telah diganti baru, pin segel dipasang ulang, tabung dibersihkan..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Foto Fisik Selesai Perbaikan (After) <span className="text-red-600">*</span>
                </label>
                <label className="w-full px-4 py-3 bg-slate-50 border border-dashed border-slate-300 hover:border-slate-400 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 cursor-pointer text-slate-600 transition-colors">
                  <Camera className="w-5 h-5 text-slate-500" />
                  <span>Ambil Foto Tabung Siap Operasi</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Dikompresi otomatis (&lt;300KB)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>

                {isCompressing && (
                  <span className="text-[11px] text-red-600 font-mono animate-pulse mt-1 block">
                    Mengompres gambar...
                  </span>
                )}

                {previewPhoto && (
                  <div className="mt-3 relative inline-block">
                    <img
                      src={previewPhoto}
                      alt="Preview"
                      className="w-28 h-28 object-cover rounded-xl border border-slate-300 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewPhoto(null);
                        setPhotoBase64(null);
                      }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold shadow"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={closeUploadModal}
                  className="flex-1 py-2.5 px-4 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isCompressing}
                  className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm btn-tactile"
                >
                  {isSubmitting ? 'Mengirim...' : 'Kirim Bukti Perbaikan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal Pratinjau Foto (Before / After) */}
      {selectedPhotoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedPhotoModal(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-slate-200 truncate pr-2">
                {selectedPhotoModal.title}
              </span>
              <button
                type="button"
                onClick={() => setSelectedPhotoModal(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 bg-black/90 flex items-center justify-center max-h-[75vh] overflow-hidden">
              <img
                src={selectedPhotoModal.src}
                alt={selectedPhotoModal.title}
                className="max-h-[70vh] w-auto object-contain rounded-lg shadow-md"
              />
            </div>
            <div className="p-2.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                Ketuk di luar atau tombol tutup untuk kembali
              </span>
              <button
                type="button"
                onClick={() => setSelectedPhotoModal(null)}
                className="text-xs text-slate-300 hover:text-white font-mono py-1 px-3 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
