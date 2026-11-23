import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApar } from '../../shared/context/AparContext';
import {
  User,
  Shield,
  Key,
  Users,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  LogOut,
  Building2,
  Lock,
  ArrowLeft
} from 'lucide-react';

export default function UserProfile() {
  const navigate = useNavigate();
  const { currentUser, teamHfos, changeUserPassword, logout, resetDemoData, rigs } = useApar();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resetDone, setResetDone] = useState(false);

  const currentRig = rigs.find((r) => r.id === currentUser?.rigId) || {
    id: currentUser?.rigId,
    name: currentUser?.rigId,
    location: 'Area Operasional Lapangan'
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!oldPassword) {
      setErrorMsg('Masukkan password lama.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('Password baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi password baru tidak cocok.');
      return;
    }

    try {
      changeUserPassword(currentUser.id, oldPassword, newPassword);
      setSuccessMsg('Password berhasil diperbarui! Silakan gunakan password baru pada login berikutnya.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setErrorMsg(err.message || 'Gagal mengubah password.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleResetData = () => {
    if (window.confirm('Reset seluruh data demo ke kondisi awal (termasuk password ke 123456)?')) {
      resetDemoData();
      setResetDone(true);
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    }
  };

  return (
    <div className="max-w-4xl w-full mx-auto space-y-4">
      {/* Tombol Navigasi Kembali */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Halaman Sebelumnya</span>
      </button>

      {/* 1. Kartu Profil Personel HFO */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm">
        <div className="bg-[#0F172A] p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-red-600 flex items-center justify-center text-white font-bold text-lg shadow-sm" style={{ width: '52px', height: '52px' }}>
              <User className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                  HEALTH & SAFETY OFFICER (HFO)
                </span>
                <span className="text-[10px] font-mono bg-red-600/90 text-white px-1.5 py-0.2 rounded font-bold">
                  {currentUser?.rigId}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-0.5">
                {currentUser?.name}
              </h1>
              <p className="text-xs text-slate-400 font-mono">
                ID Personel: {currentUser?.id}
              </p>
            </div>
          </div>

          <div className="self-start sm:self-auto flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              STATUS: AKTIF BERTUGAS
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-b border-slate-200">
          <div className="p-3 bg-white rounded-xl border border-slate-200/80">
            <span className="text-slate-400 text-[10px] font-mono uppercase block">Lokasi Penugasan</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">{currentRig.name}</span>
            <span className="text-slate-500 text-[11px]">{currentRig.location}</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200/80">
            <span className="text-slate-400 text-[10px] font-mono uppercase block">Otoritas Lapangan</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">Inspeksi & Verifikasi Fisik</span>
            <span className="text-slate-500 text-[11px]">NFPA 10 & Standar Keselamatan BMS Rig</span>
          </div>
        </div>

        {/* 2. Daftar 2 Rekan HFO Satu Tim di Rig yang Sama */}
        <div className="p-4 sm:p-5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              Tim HFO {currentUser?.rigId} (Rekan Satu Rig)
            </span>
            <span className="text-[10px] font-mono text-slate-400">Total 3 Personel Rig</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {teamHfos.map((teammate) => (
              <div
                key={teammate.id}
                className="p-3 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 font-bold font-mono text-xs">
                    HFO
                  </div>
                  <div className="truncate">
                    <span className="font-bold text-slate-900 block truncate">
                      {teammate.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Rekan Tim Rig {currentUser?.rigId}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold shrink-0">
                  Aktif
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Form Ganti Password */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Key className="w-4 h-4 text-red-600" />
          <div>
            <h2 className="text-sm font-bold text-slate-900">Ganti Password Akun</h2>
            <p className="text-[11px] text-slate-500">
              Perbarui password akun HFO Anda untuk keamanan akses sistem.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-300 text-rose-900 text-xs rounded-xl flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-xl flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-3 max-w-lg">
          {/* Password Lama */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
              Password Lama
            </label>
            <div className="relative">
              <input
                type={showOld ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Masukkan password saat ini"
                className="w-full px-3 py-2 pr-10 text-xs rounded-xl border border-slate-300 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                required
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Password Baru */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
              Password Baru (Min. 6 Karakter)
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Masukkan password baru"
                className="w-full px-3 py-2 pr-10 text-xs rounded-xl border border-slate-300 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Konfirmasi Password Baru */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">
              Konfirmasi Password Baru
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                className="w-full px-3 py-2 pr-10 text-xs rounded-xl border border-slate-300 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all btn-tactile flex items-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Perbarui Password</span>
            </button>
          </div>
        </form>
      </div>

      {/* 4. Aksi Tambahan: Reset Demo Data & Logout */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <span className="font-bold text-slate-800 block">Pengaturan Sesi & Database</span>
          <span className="text-[11px] text-slate-500">
            Reset data seed awal atau keluar dari sesi aktif di perangkat ini.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetData}
            className="py-2 px-3 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-xl font-semibold transition-colors flex items-center gap-1.5 border border-slate-200"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="py-2 px-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors flex items-center gap-1.5 btn-tactile shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </div>

      {resetDone && (
        <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-medium text-center border border-emerald-200">
          Data demo berhasil direset ke seed awal. Mengarahkan kembali ke halaman login...
        </div>
      )}
    </div>
  );
}
