import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApar } from '../context/AparContext';
import { showError, showToast } from '../utils/swalHelper';
import AppLogo from '../components/AppLogo';
import {
  Shield,
  ChevronRight,
  User,
  AlertCircle,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const {
    rigs,
    users,
    rawApars,
    loginHfo,
    isCloudOnline
  } = useApar();

  const [selectedRigId, setSelectedRigId] = useState('BMS-07');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Filter 3 HFO untuk Rig yang dipilih
  const rigHfos = useMemo(() => {
    return users.filter((u) => u.rigId === selectedRigId);
  }, [users, selectedRigId]);

  // Set default HFO pertama jika rig berubah
  useEffect(() => {
    if (rigHfos.length > 0) {
      setSelectedUserId(rigHfos[0].id);
    } else {
      setSelectedUserId('');
    }
  }, [selectedRigId, rigHfos]);

  // Hitung jumlah unit APAR per rig
  const getRigAparCount = (rigId) => {
    return rawApars.filter((a) => a.rigId === rigId).length;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedRigId) {
      showError('Pilih Rig', 'Silakan pilih Rig operasional terlebih dahulu.');
      return;
    }
    if (!selectedUserId) {
      showError('Pilih Nama HFO', 'Silakan pilih nama personel HFO.');
      return;
    }
    if (!password) {
      showError('Password Kosong', 'Silakan masukkan password akun Anda.');
      return;
    }

    try {
      const session = await loginHfo(selectedUserId, password);
      showToast('success', `Selamat bertugas, ${session.name}!`);
      navigate('/user/dashboard');
    } catch (err) {
      setError(err.message || 'Login gagal.');
      showError('Login Gagal', err.message || 'Password yang Anda masukkan salah.');
    }
  };

  const handleQuickPreset = async (rigId, hfoName) => {
    setSelectedRigId(rigId);
    const targetUser = users.find(
      (u) => u.rigId === rigId && u.name.toLowerCase() === hfoName.toLowerCase()
    );
    if (targetUser) {
      setSelectedUserId(targetUser.id);
      setPassword(targetUser.password || '123456');
      try {
        const session = await loginHfo(targetUser.id, targetUser.password || '123456');
        showToast('success', `Masuk sebagai ${session.name} (${session.rigId})`);
        navigate('/user/dashboard');
      } catch (err) {
        setError(err.message);
        showError('Login Gagal', err.message);
      }
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
          <div className="h-1 bg-red-600 absolute top-0 left-0 right-0" />

          <div className="flex items-center justify-between mb-3.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-slate-800/80 border border-slate-600/60 text-[10px] font-mono tracking-widest text-slate-300 uppercase">
              <Shield className="w-3.5 h-3.5 text-red-500" />
              <span>HSE Rig Terminal</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isCloudOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                }`}
              />
              {isCloudOnline ? 'SUPABASE CLOUD' : '48 HFO AUTH'}
            </span>
          </div>

          <div className="pt-1">
            <AppLogo variant="full" />
            <p className="text-[11px] text-slate-400 mt-2 font-mono">
              Portal autentikasi Health & Safety Field Officer (HFO) Rig BMS.
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <form onSubmit={handleLogin} className="space-y-3.5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

              {/* 1. Pilih Rig Operasional */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                  1. Pilih Rig Penempatan
                </label>
                <div className="relative">
                  <select
                    value={selectedRigId}
                    onChange={(e) => {
                      setSelectedRigId(e.target.value);
                      setError('');
                    }}
                    className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all appearance-none"
                    required
                  >
                    {rigs.map((rig) => {
                      const count = getRigAparCount(rig.id);
                      return (
                        <option key={rig.id} value={rig.id}>
                          {rig.name} ({count} APAR)
                        </option>
                      );
                    })}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </div>
                </div>
              </div>

              {/* 2. Pilih Nama HFO (Terfilter 3 HFO Sesuai Rig) */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 uppercase tracking-wider">
                  2. Nama HFO (Health & Safety Officer)
                </label>
                <div className="relative">
                  <select
                    value={selectedUserId}
                    onChange={(e) => {
                      setSelectedUserId(e.target.value);
                      setError('');
                    }}
                    className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all appearance-none"
                    required
                  >
                    {rigHfos.map((hfo) => (
                      <option key={hfo.id} value={hfo.id}>
                        {hfo.name} ({hfo.position})
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block font-mono">
                  1 dari 3 personel HFO resmi penugasan {selectedRigId}
                </span>
              </div>

              {/* 3. Input Password */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 uppercase tracking-wider flex items-center justify-between">
                  <span>3. Password Akun</span>
                  <span className="text-[10px] font-normal text-slate-400 lowercase font-mono">
                    (default: 123456)
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Masukkan password"
                    className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 font-mono text-slate-900 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Tombol Masuk */}
              <button
                type="submit"
                className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 btn-tactile mt-1"
              >
                <span>Masuk Terminal Inspeksi</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Presets Cepat Demo */}
              <div className="pt-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">
                  Preset Cepat Pengujian:
                </span>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('BMS-07', 'APRIADI S')}
                    className="p-2 rounded-lg border border-slate-200 hover:border-slate-400 bg-slate-50 text-left transition-all group"
                  >
                    <span className="font-bold text-[11px] text-slate-900 block truncate group-hover:text-red-600">
                      BMS-07
                    </span>
                    <span className="text-[9px] text-slate-500 truncate block">APRIADI S</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickPreset('BMS-18', 'DONY HANDRI S')}
                    className="p-2 rounded-lg border border-slate-200 hover:border-slate-400 bg-slate-50 text-left transition-all group"
                  >
                    <span className="font-bold text-[11px] text-slate-900 block truncate group-hover:text-red-600">
                      BMS-18
                    </span>
                    <span className="text-[9px] text-rose-600 truncate block font-semibold">DONY (Rusak)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickPreset('BMS-10', 'ARIF ILYAS')}
                    className="p-2 rounded-lg border border-slate-200 hover:border-slate-400 bg-slate-50 text-left transition-all group"
                  >
                    <span className="font-bold text-[11px] text-slate-900 block truncate group-hover:text-red-600">
                      BMS-10
                    </span>
                    <span className="text-[9px] text-slate-500 truncate block">ARIF ILYAS</span>
                  </button>
                </div>
              </div>
            </form>

          {/* Info Footer */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center text-xs text-slate-400">
            <span className="font-mono text-[11px] text-slate-400">
              16 Rig • 48 HFO
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
