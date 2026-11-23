import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApar } from '../context/AparContext';
import { Shield, ChevronRight, RotateCcw, User, HardHat, Check, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { rigs, rawApars, loginAsUser, resetDemoData } = useApar();

  const [activeTab, setActiveTab] = useState('user');
  const [inspectorName, setInspectorName] = useState('Fudhla');
  const [selectedRigId, setSelectedRigId] = useState('BMS-07');
  const [error, setError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Hitung jumlah unit APAR per rig untuk preview cerdas
  const getRigAparCount = (rigId) => {
    return rawApars.filter((a) => a.rigId === rigId).length;
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!inspectorName.trim()) {
      setError('Masukkan nama inspektor lapangan');
      return;
    }
    if (!selectedRigId) {
      setError('Pilih Rig operasional');
      return;
    }
    loginAsUser(inspectorName, selectedRigId);
    navigate('/user/dashboard');
  };

  const handleQuickRigSelect = (name, rigId) => {
    loginAsUser(name, rigId);
    navigate('/user/dashboard');
  };

  const handleReset = () => {
    if (window.confirm('Kembalikan database ke format asli Excel?')) {
      resetDemoData();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Background Grid Pattern Industrial */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }}
      />

      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-700/40 overflow-hidden relative z-10">
        {/* Safety Header Terminal */}
        <div className="bg-[#1E293B] text-white p-5 border-b border-slate-700 relative">
          {/* Subtle Safety Stripe Accent */}
          <div className="h-1 bg-red-600 absolute top-0 left-0 right-0" />

          <div className="flex items-center justify-between mb-3">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-slate-800/80 border border-slate-600/60 text-[10px] font-mono tracking-widest text-slate-300 uppercase">
              <Shield className="w-3.5 h-3.5 text-red-500" />
              <span>HSE Inspection Unit</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">REV. 2026.11</span>
          </div>

          <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            APAR Tracking System
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 font-normal leading-relaxed">
            Portal inspeksi proteksi kebakaran operasional Rig BMS.
          </p>
        </div>

        {/* Tab Switcher Minimalis */}
        <div className="flex bg-slate-100 p-1 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('user')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'user'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Kru Rig (User)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'admin'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Admin Pusat
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {activeTab === 'admin' ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto text-slate-500">
                <HardHat className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Modul Admin Pusat</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-[280px] mx-auto leading-relaxed">
                  Modul admin dialokasikan untuk sinkronisasi inventori pusat. Silakan lanjutkan ke modul Kru Rig.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('user')}
                className="mt-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Kembali ke Kru Rig
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Input Nama Inspektor */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Nama Inspektor
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={inspectorName}
                    onChange={(e) => {
                      setInspectorName(e.target.value);
                      setError('');
                    }}
                    placeholder="Nama kru lapangan"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 font-medium text-slate-900 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Dropdown Rig Aktif */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Rig Operasional Aktif
                </label>
                <select
                  value={selectedRigId}
                  onChange={(e) => {
                    setSelectedRigId(e.target.value);
                    setError('');
                  }}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all"
                  required
                >
                  {rigs.map((rig) => {
                    const count = getRigAparCount(rig.id);
                    return (
                      <option key={rig.id} value={rig.id}>
                        {rig.name} ({count} APAR terdaftar)
                      </option>
                    );
                  })}
                </select>
                <span className="text-[11px] text-slate-500 mt-1 block font-mono">
                  Data otomatis difilter khusus unit {selectedRigId}.
                </span>
              </div>

              {/* Tombol Masuk */}
              <button
                type="submit"
                className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 btn-tactile mt-2"
              >
                <span>Masuk Terminal Rig</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Presets Cepat Rig */}
              <div className="pt-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-2">
                  Preset Cepat Pengetesan:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleQuickRigSelect('Fudhla', 'BMS-07')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-400 bg-slate-50/50 text-left transition-all group"
                  >
                    <span className="font-bold text-slate-900 block group-hover:text-red-600">
                      Rig BMS-07
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">12 Unit Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickRigSelect('Fudhla', 'BMS-18')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-400 bg-slate-50/50 text-left transition-all group"
                  >
                    <span className="font-bold text-slate-900 block group-hover:text-red-600">
                      Rig BMS-18
                    </span>
                    <span className="text-[10px] text-red-600 font-mono font-semibold">
                      Ada Rusak (0254)
                    </span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Reset Demo Data & Info Footer */}
          <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-red-600 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Data Demo</span>
            </button>
            <span className="font-mono text-[10px]">v1.0 • Fudhla</span>
          </div>

          {resetSuccess && (
            <div className="mt-2 p-2 bg-emerald-50 text-emerald-800 text-xs rounded-lg text-center font-medium border border-emerald-200 flex items-center justify-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Database seed berhasil direstorasi</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
