import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApar } from '../../shared/context/AparContext';
import AparCard from '../components/AparCard';
import { calculateHydrotest } from '../../shared/utils/hydrotestUtils';
import {
  ClipboardCheck,
  Layers,
  ShieldCheck,
  AlertOctagon,
  ArrowRight,
  Gauge,
  CheckCircle,
  Clock,
  Compass
} from 'lucide-react';

export default function UserDashboard() {
  const navigate = useNavigate();
  const { currentUser, userApars, rigs } = useApar();

  const currentRig = rigs.find((r) => r.id === currentUser?.rigId) || {
    id: currentUser?.rigId || 'Rig BMS',
    name: currentUser?.rigId || 'Rig BMS',
    location: 'Area Lapangan'
  };

  const currentMonth = new Date().toISOString().slice(0, 7);
  const totalAparCount = userApars.length;

  const inspectedThisMonthCount = userApars.filter((a) =>
    a.lastInspectionDate?.startsWith(currentMonth)
  ).length;

  const inspectionPercentage = totalAparCount
    ? Math.round((inspectedThisMonthCount / totalAparCount) * 100)
    : 0;

  const layakCount = userApars.filter((a) => a.status === 'layak').length;

  const needAttentionApars = userApars.filter((a) => {
    const hydro = calculateHydrotest(a);
    return a.status === 'perlu_perbaikan' || hydro.isExpired || hydro.isDueSoon;
  });
  const needAttentionCount = needAttentionApars.length;

  // Smart Priority Reminders
  const priorityApars = [...userApars]
    .map((apar) => {
      const hydro = calculateHydrotest(apar);
      const isChecked = apar.lastInspectionDate?.startsWith(currentMonth);

      let priorityScore = 0;
      let reasonTag = 'NORMAL';
      let tagStyle = 'bg-slate-100 text-slate-700 border-slate-300';

      if (apar.status === 'perlu_perbaikan') {
        priorityScore += 100;
        reasonTag = 'RUSAK / PERBAIKAN';
        tagStyle = 'bg-rose-100 text-rose-800 border-rose-300';
      }
      if (hydro.isExpired) {
        priorityScore += 80;
        reasonTag = 'HYDROTEST EXPIRED';
        tagStyle = 'bg-rose-100 text-rose-800 border-rose-300';
      } else if (hydro.isDueSoon) {
        priorityScore += 50;
        reasonTag = 'HYDROTEST < 60 HARI';
        tagStyle = 'bg-amber-100 text-amber-800 border-amber-300';
      }
      if (!isChecked) {
        priorityScore += 30;
        if (reasonTag === 'NORMAL') {
          reasonTag = 'BELUM CEK BULAN INI';
          tagStyle = 'bg-slate-200 text-slate-800 border-slate-300';
        }
      }

      return { apar, priorityScore, reasonTag, tagStyle, isChecked, hydro };
    })
    .filter((item) => item.priorityScore > 0)
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Telemetry Readiness Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                RIG CONSOLE
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {currentRig.name} • Lapangan
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Kesiapsiagaan APAR Unit
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspektor aktif: <strong className="text-slate-800">{currentUser?.name}</strong>.
            </p>
          </div>

          {/* Precision Circular Progress Indicator */}
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200/80 p-3 rounded-xl self-start sm:self-auto">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-12 h-12 transform -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="#E2E8F0"
                  strokeWidth="4"
                  fill="transparent"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke={inspectionPercentage === 100 ? '#079455' : '#D92D20'}
                  strokeWidth="4"
                  strokeDasharray={125.6}
                  strokeDashoffset={125.6 - (125.6 * inspectionPercentage) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <span className="absolute font-mono font-bold text-xs text-slate-900">
                {inspectionPercentage}%
              </span>
            </div>
            <div className="text-xs">
              <span className="text-slate-400 text-[10px] font-mono block">PROGRESS INSPEKSI</span>
              <span className="font-bold text-slate-800 font-mono">
                {inspectedThisMonthCount} / {totalAparCount} Unit
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Metric Telemetry Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Tabung */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold tracking-wider">
            Total APAR
          </span>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono tracking-tight text-slate-900">
              {totalAparCount}
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
              Unit di {currentRig.id}
            </span>
          </div>
        </div>

        {/* Dicek Bulan Ini */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold tracking-wider">
            Selesai Dicek
          </span>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono tracking-tight text-emerald-600">
              {inspectedThisMonthCount}
            </div>
            <span className="text-[10px] text-emerald-700/80 font-mono mt-0.5 block">
              Periode {currentMonth}
            </span>
          </div>
        </div>

        {/* Kondisi Layak */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold tracking-wider">
            Status Layak
          </span>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono tracking-tight text-slate-900">
              {layakCount}
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
              Siap dioperasikan
            </span>
          </div>
        </div>

        {/* Perlu Tindakan */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold tracking-wider">
            Perlu Tindakan
          </span>
          <div className="mt-3">
            <div className={`text-2xl font-black font-mono tracking-tight ${needAttentionCount > 0 ? 'text-red-600' : 'text-slate-400'}`}>
              {needAttentionCount}
            </div>
            <span className="text-[10px] text-red-600/80 font-mono mt-0.5 block">
              Kerusakan / Hydrotest
            </span>
          </div>
        </div>
      </div>

      {/* Cockpit Tombol Aksi Cepat */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <button
          type="button"
          onClick={() => navigate('/user/quick-inspect')}
          className="p-4 bg-[#0F172A] hover:bg-slate-900 active:bg-black text-white rounded-xl border border-slate-800 shadow-md flex items-center justify-between group transition-all btn-tactile text-left"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-red-600 flex items-center justify-center text-white shrink-0 shadow-sm">
              <ClipboardCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-red-400 font-bold block">
                AKSI UTAMA
              </span>
              <span className="font-bold text-sm text-white block">Pilih Cepat & Inspeksi</span>
              <span className="text-[11px] text-slate-400">Prioritas unit belum dicek & rusak</span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </button>

        <button
          type="button"
          onClick={() => navigate('/user/apars')}
          className="p-4 bg-white hover:bg-slate-50 text-slate-900 rounded-xl border border-slate-200/90 shadow-sm flex items-center justify-between group transition-all btn-tactile text-left"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0 border border-slate-200">
              <Layers className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block">
                NAVIGASI
              </span>
              <span className="font-bold text-sm text-slate-900 block">Daftar Tabung {currentRig.id}</span>
              <span className="text-[11px] text-slate-500">Cari lokasi & tipe media</span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
        </button>
      </div>

      {/* Radar Pengingat Prioritas (Max 5 Tabung) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-red-600" />
            <h2 className="font-bold text-sm text-slate-900">
              Prioritas Perhatian Lapangan
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Maks 5 Unit Teratas
          </span>
        </div>

        {priorityApars.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-1">
            <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="font-bold text-slate-800">Semua Tabung Aman</p>
            <p className="text-[11px] text-slate-400">Tidak ada kerusakan atau jadwal kadaluarsa aktif.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {priorityApars.map(({ apar, reasonTag, tagStyle }) => (
              <div key={apar.id} className="relative">
                <div className="absolute -top-2 left-3 z-10 flex items-center gap-1.5">
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${tagStyle}`}>
                    {reasonTag}
                  </span>
                  {apar.lastInspectedBy && (
                    <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-900 text-white shadow-xs">
                      HFO: {apar.lastInspectedBy}
                    </span>
                  )}
                </div>
                <div className="pt-1.5">
                  <AparCard apar={apar} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
