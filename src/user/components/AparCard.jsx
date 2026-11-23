import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../../shared/components/StatusBadge';
import { calculateHydrotest, formatDateDisplay } from '../../shared/utils/hydrotestUtils';
import { MapPin, ChevronRight, CheckCircle2, AlertCircle, AlertTriangle, UserCheck } from 'lucide-react';

export default function AparCard({ apar }) {
  const navigate = useNavigate();

  const hydrotest = calculateHydrotest(apar.manufactureDate);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const isInspectedThisMonth = apar.lastInspectionDate?.startsWith(currentMonth);

  const isDamaged = apar.status === 'perlu_perbaikan';

  return (
    <div
      onClick={() => navigate(`/user/apars/${apar.id}`)}
      className="bg-white rounded-xl border border-slate-200/90 hover:border-slate-400/80 shadow-sm transition-all p-3.5 sm:p-4 cursor-pointer active:scale-[0.99] relative group overflow-hidden"
    >
      {/* Indicator Bar Samping Kiri */}
      <div
        className={`absolute top-0 bottom-0 left-0 w-1 ${
          isDamaged ? 'bg-rose-600' : 'bg-emerald-500'
        }`}
      />

      {/* Baris Atas: Kode Aset & Status */}
      <div className="flex items-center justify-between gap-2 pl-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono font-bold text-sm tracking-tight text-slate-900 group-hover:text-red-600 transition-colors">
            {apar.assetCode}
          </span>
          {apar.chargeOwner && (
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
              {apar.chargeOwner}
            </span>
          )}
        </div>
        <StatusBadge type="apar" status={apar.status} />
      </div>

      {/* Baris Tengah: Penempatan & Spesifikasi */}
      <div className="pl-2 mb-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{apar.placement || 'LOKASI BELUM DITENTUKAN'}</span>
        </div>
        <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-1.5">
          <span>{apar.typeName}</span>
          {apar.brandModel && (
            <span className="text-slate-400 text-[11px] truncate">• {apar.brandModel}</span>
          )}
        </div>
        {apar.serialNo && (
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
            S/N: {apar.serialNo}
          </div>
        )}
      </div>

      {/* Micro-label Pelacakan Nama HFO Penginput */}
      <div className="pl-2 mb-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-600 truncate">
          <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {apar.lastInspectedBy ? (
            <span className="truncate">
              Dicek: <strong className="text-slate-800">{apar.lastInspectedBy}</strong>{' '}
              <span className="text-slate-400 font-mono text-[10px]">({formatDateDisplay(apar.lastInspectionDate)})</span>
            </span>
          ) : (
            <span className="text-slate-400 italic text-[10px]">Belum pernah diinspeksi</span>
          )}
        </div>
      </div>

      {/* Baris Bawah: Status Hydrotest & Status Bulan Ini */}
      <div className="pl-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
        {/* Hydrotest Tag */}
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${hydrotest.badgeColor}`}
        >
          {hydrotest.shortLabel || hydrotest.label}
        </span>

        {/* Indikator Inspeksi Bulan Ini / Temuan Kerusakan */}
        <div className="flex items-center gap-1 text-[11px]">
          {isDamaged ? (
            <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              Ada Temuan Rusak
            </span>
          ) : isInspectedThisMonth ? (
            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Sudah Cek
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-slate-500 font-medium text-[11px]">
              <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
              Belum Cek
            </span>
          )}
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors ml-0.5" />
        </div>
      </div>
    </div>
  );
}
