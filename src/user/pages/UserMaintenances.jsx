import React, { useState } from 'react';
import { useApar } from '../../shared/context/AparContext';
import StatusBadge from '../../shared/components/StatusBadge';
import { compressImageFile } from '../../shared/utils/imageUtils';
import { formatDateDisplay } from '../../shared/utils/hydrotestUtils';
import {
  Wrench,
  Upload,
  Camera,
  CheckCircle2,
  X,
  Calendar,
  AlertCircle
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
  const [uploadSuccess, setUploadSuccess] = useState(false);

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
    setUploadSuccess(false);
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
      setErrorMsg('Gagal memproses gambar: ' + err.message);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleEvidenceSubmit = (e) => {
    e.preventDefault();
    if (!repairNotes.trim()) {
      setErrorMsg('Isi catatan perbaikan singkat.');
      return;
    }
    if (!photoBase64) {
      setErrorMsg('Foto fisik bukti perbaikan wajib dilampirkan.');
      return;
    }

    try {
      setIsSubmitting(true);
      uploadRepairEvidence(selectedTicket.id, photoBase64, repairNotes);
      setUploadSuccess(true);
      setTimeout(() => {
        closeUploadModal();
        setIsSubmitting(false);
      }, 1500);
    } catch (err) {
      setErrorMsg('Gagal mengirim bukti: ' + err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400 block mb-0.5">
          WORK ORDER SYSTEM • {currentUser?.rigId}
        </span>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Tindak Lanjut Perbaikan APAR
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Daftar tiket kerusakan tabung yang butuh perbaikan teknis atau penggantian suku cadang.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { key: 'all', label: `Semua (${userMaintenances.length})` },
          {
            key: 'open',
            label: `Open (${userMaintenances.filter((m) => m.status === 'open').length})`
          },
          {
            key: 'in_progress',
            label: `In Progress (${userMaintenances.filter((m) => m.status === 'in_progress').length})`
          },
          {
            key: 'pending_review',
            label: `Pending (${userMaintenances.filter((m) => m.status === 'pending_review').length})`
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
        <div className="space-y-3">
          {filteredTickets.map((ticket) => {
            const canUploadEvidence =
              ticket.status === 'open' || ticket.status === 'in_progress';

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
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                      WO: {ticket.id}
                    </span>
                  </div>
                  <StatusBadge type="maintenance" status={ticket.status} />
                </div>

                {/* Deskripsi Temuan */}
                <div className="text-xs space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-mono block">
                    Deskripsi Kerusakan:
                  </span>
                  <p className="text-slate-900 font-medium bg-rose-50/70 p-2.5 rounded-xl border border-rose-100 text-rose-950 leading-relaxed">
                    {ticket.issueDescription}
                  </p>
                </div>

                {/* Foto Awal */}
                {ticket.findingPhoto && (
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                      Foto Temuan Fisik:
                    </span>
                    <img
                      src={ticket.findingPhoto}
                      alt="Foto Kerusakan"
                      className="w-24 h-24 object-cover rounded-xl border border-slate-200"
                    />
                  </div>
                )}

                {/* Bukti Perbaikan jika ada */}
                {ticket.evidencePhoto && (
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/80 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-blue-950 font-bold">
                      <span>Bukti Perbaikan Diunggah:</span>
                      <span className="text-[10px] font-mono text-blue-600">MENUNGGU VERIFIKASI ADMIN</span>
                    </div>
                    <p className="text-slate-700 font-medium">{ticket.repairNotes}</p>
                    <img
                      src={ticket.evidencePhoto}
                      alt="Bukti"
                      className="w-24 h-24 object-cover rounded-xl border border-blue-300 mt-2"
                    />
                  </div>
                )}

                {/* Card Footer */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs border-t border-slate-100">
                  <div className="flex items-center gap-3 text-slate-400 text-[11px] font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDateDisplay(ticket.reportedDate)}
                    </span>
                    <span>Pelapor: {ticket.inspectorName}</span>
                  </div>

                  {canUploadEvidence && (
                    <button
                      type="button"
                      onClick={() => openUploadModal(ticket)}
                      className="py-2 px-3.5 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors btn-tactile"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-300" />
                      <span>Upload Bukti Selesai</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Upload Bukti */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-700/30 overflow-hidden my-6">
            <div className="p-4 bg-[#0F172A] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Work Order Update
                </span>
                <h3 className="font-mono font-bold text-sm text-white">
                  Bukti Perbaikan: {selectedTicket.assetCode}
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

              {uploadSuccess ? (
                <div className="py-6 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-900">
                    Bukti Berhasil Terkirim
                  </h4>
                  <p className="text-xs text-slate-500 font-mono">
                    Status tiket telah diubah ke <strong>Pending Review</strong>.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      Uraian Tindakan Perbaikan <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      value={repairNotes}
                      onChange={(e) => setRepairNotes(e.target.value)}
                      rows={3}
                      placeholder="Contoh: Hose telah diganti baru, pin segel dipasang ulang..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      Foto Bukti Fisik <span className="text-red-600">*</span>
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
                      {isSubmitting ? 'Mengirim...' : 'Kirim Bukti'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
