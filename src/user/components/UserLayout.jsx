import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useApar } from '../../shared/context/AparContext';
import {
  Home,
  Layers,
  QrCode,
  Wrench,
  History,
  LogOut,
  Shield,
  ChevronRight,
  Flame,
  Radio,
  User
} from 'lucide-react';

export default function UserLayout() {
  const { currentUser, logout, userMaintenances, rigs } = useApar();
  const navigate = useNavigate();

  const currentRig = rigs.find((r) => r.id === currentUser?.rigId) || {
    id: currentUser?.rigId,
    name: currentUser?.rigId || 'Rig BMS',
    location: 'Area Lapangan'
  };

  const activeTicketCount = userMaintenances.filter(
    (m) => m.status === 'open' || m.status === 'in_progress'
  ).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/user/dashboard', label: 'Dashboard', icon: Home },
    { to: '/user/apars', label: 'Unit APAR', icon: Layers },
    { to: '/user/scan', label: 'Scan QR', icon: QrCode, isScan: true },
    {
      to: '/user/maintenances',
      label: 'Perbaikan',
      icon: Wrench,
      badge: activeTicketCount > 0 ? activeTicketCount : null
    },
    { to: '/user/history', label: 'Log Riwayat', icon: History }
  ];

  return (
    <div className="min-h-screen bg-[#F1F4F8] text-slate-900 flex flex-col md:flex-row antialiased">
      {/* ================= DESKTOP SIDEBAR (>= 768px) ================= */}
      <aside className="hidden md:flex md:w-64 bg-[#0F172A] text-slate-200 border-r border-slate-800 flex-col shrink-0 sticky top-0 h-screen z-30">
        {/* Terminal Header */}
        <div className="p-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-sm tracking-widest shadow-sm">
              BMS
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-tight text-white">APAR Rig Console</h2>
              <p className="text-[10px] font-mono text-slate-400">K3 Lapangan • User Modul</p>
            </div>
          </div>
        </div>

        {/* Status Unit Rig Aktif */}
        <NavLink
          to="/user/profile"
          title="Buka Pengaturan Akun HFO"
          className="p-3.5 mx-3 my-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl space-y-1.5 transition-colors block group"
        >
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              HFO LAPANGAN
            </span>
            <span className="font-bold text-white bg-red-600/90 px-1.5 py-0.2 rounded text-[10px]">
              {currentRig.id}
            </span>
          </div>
          <div className="text-xs font-bold text-white truncate group-hover:text-red-400 transition-colors">
            {currentUser?.name}
          </div>
          <div className="text-[10px] text-slate-400 truncate flex items-center justify-between font-mono">
            <span>{currentRig.name}</span>
            <span className="text-red-400 font-semibold group-hover:underline">Akun →</span>
          </div>
        </NavLink>

        {/* Menu Navigasi Desktop */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isScan = item.isScan;

            if (isScan) {
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all my-2.5 ${
                      isActive
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-red-600/10 text-red-400 hover:bg-red-600/20 border border-red-500/20'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>Scan Barcode / QR</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </NavLink>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-rose-500 text-white">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Logout & Profile Desktop */}
        <div className="p-3 border-t border-slate-800 space-y-1.5">
          <NavLink
            to="/user/profile"
            className={({ isActive }) =>
              `w-full flex items-center justify-between py-2 px-3 text-xs font-semibold rounded-xl transition-colors ${
                isActive
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`
            }
          >
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5" />
              <span>Ganti Password / Akun</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </NavLink>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors border border-slate-700/60"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Ganti Rig / Keluar</span>
          </button>
        </div>
      </aside>

      {/* ================= AREA KONTEN UTAMA ================= */}
      <div className="flex-1 flex flex-col min-w-0 pb-24 md:pb-8">
        {/* Mobile Top Bar (< 768px) - High Contrast Field Telemetry */}
        <header className="md:hidden sticky top-0 z-20 bg-[#0F172A] text-white border-b border-slate-800 px-4 h-14 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center text-white font-mono font-black text-xs shrink-0">
              AP
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white truncate tracking-tight">
                  {currentRig.name}
                </span>
                <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700 px-1 rounded">
                  {currentRig.id}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{currentUser?.name}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <NavLink
              to="/user/profile"
              title="Profil & Ganti Password HFO"
              className={({ isActive }) =>
                `p-2 rounded-lg transition-colors flex items-center gap-1 ${
                  isActive
                    ? 'bg-red-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <User className="w-4 h-4" />
            </NavLink>
            <button
              type="button"
              onClick={handleLogout}
              title="Ganti Rig / Keluar"
              className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Konten Halaman */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* ================= MOBILE BOTTOM NAVIGATION (< 768px) ================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0F172A] border-t border-slate-800/80 px-2 h-16 flex items-center justify-around shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isScan = item.isScan;

          // Shutter Scanner Trigger Button (Hardware Scanner Style)
          if (isScan) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="relative -top-3.5 flex flex-col items-center group focus:outline-none"
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={`w-13 h-13 rounded-2xl flex items-center justify-center text-white transition-transform active:scale-90 border-2 ${
                        isActive
                          ? 'bg-red-600 border-white shadow-lg shadow-red-600/40 ring-2 ring-red-500/30'
                          : 'bg-red-600 hover:bg-red-500 border-slate-900 shadow-md shadow-black/40'
                      }`}
                      style={{ width: '52px', height: '52px' }}
                    >
                      <Icon className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold mt-1 tracking-tight ${
                        isActive ? 'text-red-400' : 'text-slate-400'
                      }`}
                    >
                      SCAN QR
                    </span>
                  </>
                )}
              </NavLink>
            );
          }

          // Navigasi Standar
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-14 h-full relative py-1 transition-colors ${
                  isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-red-500 stroke-[2.2]' : 'stroke-[1.8]'}`} />
                    {item.badge && (
                      <span className="absolute -top-1 -right-2 px-1 rounded-full bg-rose-600 text-white text-[9px] font-mono font-bold flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] mt-1 tracking-tight font-medium ${
                      isActive ? 'text-white font-bold' : 'text-slate-400'
                    }`}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
