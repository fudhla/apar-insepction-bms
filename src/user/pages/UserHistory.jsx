import React, { useState, useMemo } from 'react';
import { useApar } from '../../shared/context/AparContext';
import StatusBadge from '../../shared/components/StatusBadge';
import InspectionDetailModal from '../components/InspectionDetailModal';
import { formatDateDisplay } from '../../shared/utils/hydrotestUtils';
import {
  History,
  Calendar,
  Filter,
  ChevronRight,
  User,
  Building,
  CheckCircle2,
  XCircle,
  FileSpreadsheet
} from 'lucide-react';

export default function UserHistory() {
  const { userInspections, currentUser } = useApar();

  const [filterMonthYear, setFilterMonthYear] = useState(''); // YYYY-MM
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'layak' | 'tidak_layak'
  const [selectedInspection, setSelectedInspection] = useState(null);

  // Buat daftar opsi bulan unik yang tersedia di data inspeksi
  const availableMonths = useMemo(() => {
    const set = new Set();
    userInspections.forEach((item) => {
      if (item.inspectionDate) {
        set.add(item.inspectionDate.slice(0, 7)); // YYYY-MM
      }
    });
    return Array.from(set).sort().reverse();
  }, [userInspections]);

  // Filter inspections
  const filteredList = useMemo(() => {
    return userInspections.filter((item) => {
      // Filter Bulan & Tahun
      if (filterMonthYear && !item.inspectionDate?.startsWith(filterMonthYear)) {
        return false;
      }
      // Filter Status
      if (filterStatus !== 'all' && item.overallStatus !== filterStatus) {
        return false;
      }
      return true;
    });
  }, [userInspections, filterMonthYear, filterStatus]);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Riwayat Inspeksi Rig {currentUser?.rigId}
        </h1>
        <p className="text-xs text-slate-500">
          Seluruh log pemeriksaan fisik tabung APAR tercatat secara digital dan teratur.
        </p>
      </div>

      {/* Kontrol Filter Bulan & Status */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Bulan */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={filterMonthYear}
              onChange={(e) => setFilterMonthYear(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
            >
              <option value="">Semua Periode Bulan</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  Periode {m}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
            >
              <option value="all">Semua Status</option>
              <option value="layak">Hanya Layak</option>
              <option value="tidak_layak">Tidak Layak (Ada Kerusakan)</option>
            </select>
          </div>
        </div>

        <span className="text-slate-400 text-[11px]">
          Total <strong>{filteredList.length}</strong> catatan
        </span>
      </div>

      {/* Daftar Kartu Riwayat */}
      {filteredList.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 p-6">
          <History className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">Belum Ada Riwayat Inspeksi</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Tidak ada data pemeriksaan yang cocok dengan filter yang dipilih.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredList.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedInspection(item)}
              className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 p-4 shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-between gap-3 group active:scale-[0.99]"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-slate-900 group-hover:text-red-600 transition-colors">
                    {item.assetCode}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded capitalize">
                    {item.category} {item.thirdPartyVendor ? `• ${item.thirdPartyVendor}` : ''}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-medium text-slate-700 font-mono text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {formatDateDisplay(item.inspectionDate)}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] font-bold border border-slate-200">
                    <User className="w-3 h-3 text-red-600" />
                    Oleh: {item.inspectorName}
                  </span>
                </div>

                {item.issueDescription && (
                  <p className="text-[11px] text-rose-700 line-clamp-1 italic mt-1 font-medium">
                    "{item.issueDescription}"
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <StatusBadge type="inspection" status={item.overallStatus} />
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Detail Checklist 7 Komponen */}
      {selectedInspection && (
        <InspectionDetailModal
          inspection={selectedInspection}
          onClose={() => setSelectedInspection(null)}
        />
      )}
    </div>
  );
}
