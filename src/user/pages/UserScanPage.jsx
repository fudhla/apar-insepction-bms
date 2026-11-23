import React from 'react';
import QrScannerBox from '../components/QrScannerBox';
import { useApar } from '../../shared/context/AparContext';
import { ShieldCheck, Info } from 'lucide-react';

export default function UserScanPage() {
  const { currentUser } = useApar();

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-red-600 mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Area Kerja {currentUser?.rigId}</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Scan QR Tabung APAR
        </h1>
        <p className="text-xs text-slate-500">
          Arahkan kamera ke label barcode/QR pada tabung untuk otomatis membuka form checklist.
        </p>
      </div>

      {/* Komponen Scanner Kamera + Manual Fallback */}
      <QrScannerBox />

      {/* Petunjuk Lapangan */}
      <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="font-bold text-slate-800 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-slate-500" />
          Tips Inspeksi Cepat Lapangan:
        </div>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 pl-1">
          <li>Pastikan lensa kamera bersih dari debu atau lumpur rig.</li>
          <li>Jaga jarak tabung sekitar 15–25 cm hingga QR Code berada di dalam kotak merah.</li>
          <li>Jika tabung tidak memiliki barcode terbaca, gunakan <strong>Pilihan Manual</strong> di atas.</li>
        </ul>
      </div>
    </div>
  );
}
