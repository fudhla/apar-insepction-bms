import React, { useState } from 'react';

/**
 * AppLogo - Komponen Logo Resmi Perusahaan BMS
 * Menampilkan /logo-bms.png dalam wadah badge putih bersih agar kontras & tajam di latar belakang gelap.
 * Otomatis beralih ke fallback SVG Perisai K3 + Api bergradasi merah jika berkas gambar gagal dimuat.
 *
 * @param {('sm'|'md'|'lg')} size - Ukuran logo ('sm' untuk header HP, 'md' untuk sidebar desktop, 'lg' untuk halaman Login)
 * @param {string} className - Kelas CSS tambahan
 */
export default function AppLogo({ size = 'md', className = '' }) {
  const [imageError, setImageError] = useState(false);

  // Ukuran wadah badge putih berdasarkan prop size
  const sizeMap = {
    sm: 'w-7 h-7 rounded-lg p-1',
    md: 'w-9 h-9 rounded-xl p-1.5',
    lg: 'w-14 h-14 rounded-2xl p-2'
  };

  const badgeClass = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={`bg-white shadow-sm ring-1 ring-white/20 flex items-center justify-center shrink-0 ${badgeClass} ${className}`}
      title="BMS HSE • APAR Tracking System"
    >
      {!imageError ? (
        <img
          src="/logo-bms.png"
          alt="BMS Logo"
          onError={() => setImageError(true)}
          className="w-full h-full object-contain"
        />
      ) : (
        /* Fallback SVG Perisai K3 + Api (Gradasi Merah #EF4444 -> #B91C1C) */
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xs"
        >
          <defs>
            <linearGradient id="bmsShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#B91C1C" />
            </linearGradient>
          </defs>
          {/* Perisai K3 */}
          <path
            d="M12 2L4 5V11.2C4 16.6 7.4 20.8 12 22C16.6 20.8 20 16.6 20 11.2V5L12 2Z"
            fill="url(#bmsShieldGrad)"
          />
          {/* Lidah Api Putih */}
          <path
            d="M12 6.5C12 6.5 13.5 8.4 13.5 9.8C13.5 10.5 13.1 11.1 12.7 11.5C13.2 11 14.1 10.3 14.4 9.4C15.2 10.6 15.4 12.2 14.9 13.5C14.2 15.3 12.5 16.6 10.7 16.5C9.5 16.4 8.5 15.8 7.9 14.9C7.2 13.9 7.2 12.6 7.7 11.4C8.4 9.8 10.1 8.8 10.6 7.2C10.7 6.9 10.8 6.6 10.8 6.5C11 7.2 11.5 8 12 8.5C12.4 8.1 12.5 7.4 12 6.5Z"
            fill="#FFFFFF"
          />
          {/* Inti Api Kuning */}
          <path
            d="M11.9 12.2C11.9 12.2 12.7 13 12.7 13.9C12.7 14.7 12.1 15.3 11.3 15.3C10.5 15.3 9.9 14.7 9.9 13.9C9.9 13.2 10.6 12.5 11.9 12.2Z"
            fill="#FACC15"
          />
        </svg>
      )}
    </div>
  );
}
