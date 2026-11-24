import React from 'react';

/**
 * AppLogo
 * Menampilkan murni berkas gambar logo resmi PT Besmindo Materi Sewatama.
 * Menggunakan tag <img> asli dari public/logo-bms.png dan public/logo-bms-full.png
 * tanpa gambar ulang SVG maupun dekorasi tambahan.
 *
 * @param {('icon'|'full')} variant - 'icon' untuk badge lambang (Sidebar/Header), 'full' untuk logo panjang resmi (Login).
 * @param {string} className - Kelas CSS tambahan untuk wadah pembungkus putih.
 * @param {string} alt - Teks alternatif untuk pembaca layar.
 */
export default function AppLogo({
  variant = 'icon',
  className = '',
  alt = 'PT Besmindo Materi Sewatama'
}) {
  if (variant === 'full') {
    return (
      <div
        className={`bg-white rounded-xl px-3 py-2 shadow-sm inline-flex items-center justify-center shrink-0 ${className}`}
      >
        <img
          src="/logo-bms-full.png"
          alt={alt}
          onError={(e) => {
            // Fallback ke logo-bms.png jika logo-bms-full.png belum tersedia
            if (e.currentTarget.src !== window.location.origin + '/logo-bms.png') {
              e.currentTarget.src = '/logo-bms.png';
            }
          }}
          className="h-10 sm:h-12 w-auto object-contain"
        />
      </div>
    );
  }

  // Variant "icon" (Sidebar Desktop & Header Mobile)
  return (
    <div
      className={`bg-white rounded-xl p-1.5 shadow-sm flex items-center justify-center shrink-0 w-10 h-10 ${className}`}
    >
      <img
        src="/logo-bms.png"
        alt={alt}
        className="w-full h-full object-contain"
      />
    </div>
  );
}
