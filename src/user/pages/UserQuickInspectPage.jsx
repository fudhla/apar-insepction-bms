import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApar } from '../../shared/context/AparContext';
import StatusBadge from '../../shared/components/StatusBadge';
import { calculateHydrotest, formatDateDisplay } from '../../shared/utils/hydrotestUtils';
import {
  ClipboardCheck,
  Search,
  X,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Layers,
  ArrowRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export default function UserQuickInspectPage() {
  const navigate = useNavigate();
  const { userApars, currentUser } = useApar();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'uninspected' | 'damaged' | 'inspected'

  const currentMonth = new Date().toISOString().slice(0, 7);

  // Analisis statistik cepat
  const damagedApars = useMemo(
    () => userApars.filter((a) => a.status === 'perlu_perbaikan'),
    [userApars]
  );
  const uninspectedApars = useMemo(
    () => userApars.filter((a) => !a.lastInspectionDate?.startsWith(currentMonth)),
    [userApars, currentMonth]
  );
  const inspectedApars = useMemo(
    () => userApars.filter((a) => a.lastInspectionDate?.startsWith(currentMonth)),
    [userApars, currentMonth]
  );

  // Smart Priority Sorting & Filtering
  const sortedAndFilteredApars = useMemo(() => {
    // 1. Scoring & Tagging
    const scoredList = userApars.map((apar) => {
      const isInspected = apar.lastInspectionDate?.startsWith(currentMonth);
      const isDamaged = apar.status === 'perlu_perbaikan';
      const hydro = calculateHydrotest(apar);

      let score = 0;
      let badgeTag = 'SUDAH DICEK';
      let badgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-300';

      if (isDamaged) {
        score += 100;
        badgeTag = 'PERLU PERBAIKAN';
        badgeStyle = 'bg-rose-100 text-rose-800 border-rose-300';
      } else if (hydro.isExpired) {
        score += 80;
        badgeTag = 'HYDROTEST EXPIRED';
        badgeStyle = 'bg-rose-100 text-rose-800 border-rose-300';
      } else if (!isInspected) {
        score += 50;
        badgeTag = 'BELUM DICEK';
        badgeStyle = 'bg-amber-100 text-amber-800 border-amber-300';
      }

      return {
        apar,
        score,
        badgeTag,
        badgeStyle,
        isInspected,
        isDamaged,
        hydro
      };
    });

    // 2. Sort descending by priority score, then by asset code
    scoredList.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.apar.assetCode.localeCompare(b.apar.assetCode);
    });

    // 3. Tab Filter
    return scoredList.filter(({ apar, isInspected, isDamaged }) => {
      // Filter Search
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        apar.assetCode.toLowerCase().includes(q) ||
        (apar.placement && apar.placement.toLowerCase().includes(q)) ||
        (apar.serialNo && apar.serialNo.toLowerCase().includes(q)) ||
        (apar.typeName && apar.typeName.toLowerCase().includes(q));

      if (!matchQuery) return false;

      // Filter Tab
      if (filterTab === 'uninspected') return !isInspected;
      if (filterTab === 'damaged') return isDamaged;
      if (filterTab === 'inspected') return isInspected;

      return true;
    });
  }, [userApars, currentMonth, searchQuery, filterTab]);

  return (
    <div className="space-y-4 sm:space-y-5 pb-8">
      {/* Header Halaman */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">
                INSPEKSI CEPAT
              </span>
              <span className="text-xs text-slate-500 font-mono font-bold">
                RIG {currentUser?.rigId}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
              Pilih Cepat APAR untuk Diinspeksi
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Unit yang belum dicek bulan ini atau perlu perbaikan otomatis berada di posisi paling atas.
            </p>
          </div>

          {/* Micro Status Summary Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-amber-800 font-semibold">
                <strong>{uninspectedApars.length}</strong> Belum Dicek
              </span>
            </div>
            {damagedApars.length > 0 && (
              <div className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span className="text-rose-800 font-semibold">
                  <strong>{damagedApars.length}</strong> Rusak
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Input Search Cepat */}
        <div className="mt-4 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode aset (misal: APAR-BMS07-001) atau lokasi penempatan..."
            className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tab Filter Prioritas */}
        <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              filterTab === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({userApars.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('uninspected')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              filterTab === 'uninspected'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Belum Dicek ({uninspectedApars.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('damaged')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              filterTab === 'damaged'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Perlu Perbaikan ({damagedApars.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('inspected')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              filterTab === 'inspected'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Sudah Dicek ({inspectedApars.length})
          </button>
        </div>
      </div>

      {/* List APAR Cepat (Urutan Prioritas) */}
      {sortedAndFilteredApars.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 p-6 space-y-3">
          <Layers className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">Tidak ada unit yang sesuai</h3>
          <p className="text-xs text-slate-500">
            Coba ubah kata kunci pencarian atau bersihkan filter tab di atas.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setFilterTab('all');
            }}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
          >
            Tampilkan Semua Unit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sortedAndFilteredApars.map(({ apar, badgeTag, badgeStyle, isInspected, isDamaged, hydro }) => (
            <div
              key={apar.id}
              className={`bg-white rounded-2xl border transition-all p-4 shadow-xs relative overflow-hidden flex flex-col justify-between gap-3 ${
                isDamaged
                  ? 'border-rose-300/80 hover:border-rose-500 ring-1 ring-rose-500/10'
                  : !isInspected
                  ? 'border-amber-300/80 hover:border-amber-500'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Samping Kiri Bar */}
              <div
                className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                  isDamaged ? 'bg-rose-600' : !isInspected ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              />

              {/* Baris Atas */}
              <div className="pl-2">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-base text-slate-900 tracking-tight">
                      {apar.assetCode}
                    </span>
                    {apar.chargeOwner && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {apar.chargeOwner}
                      </span>
                    )}
                  </div>
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${badgeStyle}`}>
                    {badgeTag}
                  </span>
                </div>

                {/* Lokasi & Spesifikasi */}
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

                {/* Info Riwayat Inspeksi Terakhir */}
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1 truncate">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {apar.lastInspectedBy ? (
                      <span className="truncate">
                        HFO: <strong className="text-slate-700">{apar.lastInspectedBy}</strong>{' '}
                        <span className="font-mono text-[10px] text-slate-400">
                          ({formatDateDisplay(apar.lastInspectionDate)})
                        </span>
                      </span>
                    ) : (
                      <span className="italic text-slate-400">Belum pernah diinspeksi</span>
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">
                    S/N: {apar.serialNo || '-'}
                  </span>
                </div>
              </div>

              {/* Tombol Utama 1 Tap: Mulai Inspeksi */}
              <button
                type="button"
                onClick={() => navigate(`/user/inspect/${apar.id}`)}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs btn-tactile ${
                  isDamaged
                    ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white'
                    : !isInspected
                    ? 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 active:bg-black text-white'
                }`}
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>
                  {isDamaged ? 'Inspeksi Ulang Kerusakan' : !isInspected ? 'Mulai Inspeksi Unit Ini' : 'Cek Ulang Unit Ini'}
                </span>
                <ChevronRight className="w-4 h-4 ml-auto" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
