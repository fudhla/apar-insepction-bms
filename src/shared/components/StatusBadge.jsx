import React from 'react';

export default function StatusBadge({ type = 'apar', status, className = '' }) {
  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = status || '-';

  if (type === 'apar') {
    switch (status) {
      case 'layak':
        badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        label = 'Layak Operasi';
        break;
      case 'perlu_perbaikan':
        badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
        label = 'Perlu Perbaikan';
        break;
      default:
        badgeStyle = 'bg-slate-100 text-slate-600 border-slate-200';
        label = status || 'Belum Diperiksa';
    }
  } else if (type === 'maintenance') {
    switch (status) {
      case 'open':
        badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
        label = 'Open (Menunggu)';
        break;
      case 'in_progress':
        badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
        label = 'In Progress';
        break;
      case 'pending_review':
        badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
        label = 'Pending Review';
        break;
      case 'closed':
        badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        label = 'Closed (Selesai)';
        break;
      default:
        badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
        label = status;
    }
  } else if (type === 'inspection') {
    switch (status) {
      case 'layak':
        badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        label = 'Layak';
        break;
      case 'tidak_layak':
        badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
        label = 'Tidak Layak';
        break;
      default:
        badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
        label = status;
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {label}
    </span>
  );
}
