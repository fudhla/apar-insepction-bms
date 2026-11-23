import React from 'react';
import StatusBadge from '../../shared/components/StatusBadge';
import { formatDateDisplay } from '../../shared/utils/hydrotestUtils';
import { X, CheckCircle2, XCircle, MinusCircle, AlertTriangle, Calendar, User, Building } from 'lucide-react';

const COMPONENT_LABELS = {
  handle: 'Handle / Pegangan',
  hose: 'Hose / Selang',
  nozle: 'Nozzle / Corong',
  pengamanTabung: 'Pengaman Tabung / Belt',
  pinHandle: 'Pin Handle / Segel',
  pressureGauge: 'Pressure Gauge / Jarum Tekanan',
  tabung: 'Bodi Tabung'
};

export default function InspectionDetailModal({ inspection, onClose }) {
  if (!inspection) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-mono">Detail Hasil Pemeriksaan</div>
            <h3 className="font-mono font-bold text-base text-white">
              {inspection.assetCode}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Metadata Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Tanggal Inspeksi
              </span>
              <span className="font-bold text-slate-800">
                {formatDateDisplay(inspection.inspectionDate)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Inspektor
              </span>
              <span className="font-semibold text-slate-800">{inspection.inspectorName}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                Kategori
              </span>
              <span className="font-semibold text-slate-800 capitalize">
                {inspection.category} {inspection.thirdPartyVendor ? `(${inspection.thirdPartyVendor})` : ''}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Hasil Akhir:</span>
              <StatusBadge type="inspection" status={inspection.overallStatus} />
            </div>
          </div>

          {/* 7 Checklist Komponen */}
          <div>
            <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-2">
              Pemeriksaan 7 Komponen Fisik
            </h4>
            <div className="space-y-1.5">
              {Object.entries(COMPONENT_LABELS).map(([key, label]) => {
                const value = inspection.checklist?.[key] || 'bagus';
                const isGood = value === 'bagus';
                const isBad = value === 'rusak';
                const isNA = value === 'na';

                return (
                  <div
                    key={key}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-white hover:bg-slate-50 text-xs"
                  >
                    <span className="font-medium text-slate-700">{label}</span>
                    <div>
                      {isGood && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Bagus
                        </span>
                      )}
                      {isBad && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          Rusak
                        </span>
                      )}
                      {isNA && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          <MinusCircle className="w-3 h-3 text-slate-400" />
                          N/A (CO2)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Catatan Kerusakan & Foto Temuan (Jika Ada) */}
          {inspection.issueDescription && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Catatan Temuan / Hal Perbaikan
              </div>
              <p className="text-xs text-rose-900 leading-relaxed font-medium">
                {inspection.issueDescription}
              </p>

              {inspection.findingPhoto && (
                <div className="mt-2 pt-2 border-t border-rose-200/60">
                  <span className="text-[11px] font-semibold text-rose-800 block mb-1">
                    Foto Temuan Kerusakan:
                  </span>
                  <img
                    src={inspection.findingPhoto}
                    alt="Foto Kerusakan"
                    className="w-full max-h-48 object-cover rounded-lg border border-rose-200"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
