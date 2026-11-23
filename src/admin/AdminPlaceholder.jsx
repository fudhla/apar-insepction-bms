import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowLeft } from 'lucide-react';

export default function AdminPlaceholder() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white max-w-md w-full p-8 rounded-2xl border border-slate-200 shadow-lg text-center space-y-4">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto border border-red-100">
          <Building2 className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Modul Admin Pusat</h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          Folder <code className="text-red-600 font-semibold">src/admin/</code> dialokasikan untuk rekan tim pengembang modul admin. Sistem aktif saat ini sepenuhnya fokus pada modul lapangan <strong>Kru Rig / User</strong>.
        </p>
        <button
          onClick={() => navigate('/user/dashboard')}
          className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Modul Kru Rig</span>
        </button>
      </div>
    </div>
  );
}
