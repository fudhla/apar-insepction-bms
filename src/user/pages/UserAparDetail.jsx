import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useApar } from '../../shared/context/AparContext';
import StatusBadge from '../../shared/components/StatusBadge';
import InspectionDetailModal from '../components/InspectionDetailModal';
import { calculateHydrotest, formatDateDisplay } from '../../shared/utils/hydrotestUtils';
import {
  ArrowLeft,
  QrCode,
  Calendar,
  PlayCircle,
  Clock,
  ChevronRight,
  AlertTriangle,
  Tag,
  MapPin
} from 'lucide-react';

export default function UserAparDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userApars, userInspections, aparTypes } = useApar();

  const [selectedInspection, setSelectedInspection] = useState(null);

  const apar = userApars.find((a) => a.id === id);

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

  const aparType = aparTypes.find((t) => t.id === apar.typeId);
  const hydrotest = calculateHydrotest(apar.manufactureDate);
  const aparHistory = userInspections.filter((i) => i.aparId === apar.id);

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
                <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold border mt-1 ${hydrotest.badgeColor}`}>
                  {hydrotest.label}
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Jatuh Tempo: {formatDateDisplay(hydrotest.hydrotestDateStr)}
                </span>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: QR Tag Box (1/3) */}
          <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-5 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-red-600" />
              IDENTITAS QR CODE
            </span>

            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
              <QRCodeSVG
                value={apar.assetCode}
                size={135}
                level="M"
                includeMargin={false}
              />
            </div>

            <span className="font-mono font-bold text-xs text-slate-900 mt-3 block">
              {apar.assetCode}
            </span>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5">
              Siap cetak stiker fisik
            </span>
          </div>
        </div>

        {/* Action Button: Start Inspect */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200/80">
          <button
            type="button"
            onClick={() => navigate(`/user/inspect/${apar.id}`)}
            className="w-full py-3.5 px-6 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all btn-tactile"
          >
            <PlayCircle className="w-5 h-5 text-white" />
            <span>Mulai Form Inspeksi Unit Ini</span>
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
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Inspektor: {item.inspectorName}
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
    </div>
  );
}
