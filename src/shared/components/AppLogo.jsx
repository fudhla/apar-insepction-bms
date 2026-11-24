import React from 'react';

/**
 * BmsEmblemIcon
 * Logo Vektor SVG resmi PT Besmindo Materi Sewatama dipadukan dengan aksen K3/HSE APAR.
 * Vektor murni 100% tanpa gambar bitmap (tidak akan pecah/buram di resolusi apa pun).
 */
export function BmsEmblemIcon({ className = 'w-full h-full' }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Logo PT Besmindo Materi Sewatama"
    >
      <defs>
        {/* Gradasi Biru Korporat Besmindo */}
        <linearGradient id="bmsBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#004B87" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>

        {/* Gradasi Merah Keselamatan K3 / APAR */}
        <linearGradient id="hseFlameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#B91C1C" />
        </linearGradient>

        {/* Bayangan Halus Elegan */}
        <filter id="badgeShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Wadah Badge Putih Bersih Sudut Chamfered (Bentuk Resmi Besmindo) */}
      <path
        d="M26 6 H94 V74 L74 94 H6 V26 Z"
        fill="#FFFFFF"
        filter="url(#badgeShadow)"
      />

      {/* Bingkai Luar Sudut Miring (Chamfered Outer Frame) */}
      <path
        d="M26 6 H94 V74 L74 94 H6 V26 Z"
        fill="none"
        stroke="url(#bmsBlueGrad)"
        strokeWidth="7"
        strokeLinejoin="miter"
      />

      {/* Garis Aksen Sudut Kiri-Atas (Parallel Chamfer Line) */}
      <line
        x1="33"
        y1="18"
        x2="18"
        y2="33"
        stroke="url(#bmsBlueGrad)"
        strokeWidth="4.5"
        strokeLinecap="square"
      />

      {/* Monogram Geometris 'B' (PT Besmindo Inspired) */}
      {/* Loop Atas */}
      <path
        d="M26 26 H72 V48 H26"
        fill="none"
        stroke="url(#bmsBlueGrad)"
        strokeWidth="6.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />

      {/* Loop Bawah dengan Sudut Kanan-Bawah Miring */}
      <path
        d="M26 48 H72 V66 L62 76 H26 Z"
        fill="none"
        stroke="url(#bmsBlueGrad)"
        strokeWidth="6.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />

      {/* Titik Blok Geometris Tengah Bawah */}
      <rect
        x="42"
        y="55"
        width="12"
        height="12"
        fill="url(#bmsBlueGrad)"
        rx="1.5"
      />

      {/* Aksen Nyala Api K3 / APAR Safety di Ruang Atas */}
      <path
        d="M49 17 C49 17 56 22 56 27 C56 31 53 34 49 34 C45 34 42 31 42 27 C42 24 45 20 49 17 Z"
        fill="url(#hseFlameGrad)"
      />
      {/* Inti Api Kuning Keemasan */}
      <circle cx="49" cy="28" r="2.2" fill="#FACC15" />
    </svg>
  );
}

/**
 * AppLogo
 * Komponen resmi logo PT Besmindo Materi Sewatama — HSE APAR.
 *
 * @param {('icon'|'full')} variant - 'icon' untuk badge kotak saja, 'full' untuk emblem + nama perusahaan & subjudul HSE.
 * @param {('sm'|'md'|'lg')} size - Ukuran badge ('sm', 'md', 'lg').
 * @param {string} className - Kelas CSS kustom untuk pembungkus.
 * @param {string} textTheme - 'dark' (teks putih untuk background gelap) atau 'light' (teks gelap).
 */
export default function AppLogo({
  variant = 'icon',
  size = 'md',
  className = '',
  textTheme = 'dark'
}) {
  const sizeMap = {
    sm: 'w-8 h-8 sm:w-9 sm:h-9',
    md: 'w-10 h-10',
    lg: 'w-13 h-13 sm:w-14 sm:h-14'
  };

  const badgeSizeClass = sizeMap[size] || sizeMap.md;

  if (variant === 'full') {
    const isDark = textTheme === 'dark';
    return (
      <div className={`flex items-center gap-3.5 ${className}`}>
        {/* Emblem Vektor Badge */}
        <div className={`${badgeSizeClass} shrink-0 drop-shadow-sm`}>
          <BmsEmblemIcon />
        </div>

        {/* Teks Identitas Perusahaan & Sistem K3 */}
        <div className="min-w-0 text-left">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`font-black tracking-tight uppercase leading-tight font-sans text-sm sm:text-base ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              PT. BESMINDO MATERI SEWATAMA
            </span>
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] font-mono font-bold text-red-500 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              HSE • APAR Inspection System
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono text-slate-400">
              • Rig Services
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Variant "icon" (Emblem saja untuk Sidebar Desktop & Header HP)
  return (
    <div className={`${badgeSizeClass} shrink-0 drop-shadow-sm ${className}`} title="PT Besmindo Materi Sewatama — HSE APAR">
      <BmsEmblemIcon />
    </div>
  );
}
