/**
 * Utilitas Perhitungan Hydrotest & Validasi Tanggal Manufaktur
 * Standar: Hydrotest dilakukan setiap 5 tahun (+5 tahun dari tanggal pembuatan tabung).
 */

// Kamus bulan untuk normalisasi format teks dari Excel lama
const MONTH_MAP = {
  jan: '01', januari: '01', janurari: '01',
  feb: '02', februari: '02', febb: '02', februarii: '02',
  mar: '03', maret: '03',
  apr: '04', april: '04',
  mei: '05', may: '05', mai: '05',
  jun: '06', juni: '06', junni: '06',
  jul: '07', juli: '07', july: '07', julyy: '07',
  agu: '08', agustus: '08', aug: '08', august: '08',
  sep: '09', september: '09', sept: '09',
  okt: '10', oktober: '10', oct: '10',
  nov: '11', november: '11',
  des: '12', desember: '12', dec: '12'
};

/**
 * Parsing tanggal dari berbagai variasi teks Excel (misal: "2023-09-01", "1 Sept-2023", "julyy-2022", "Oktober-20224")
 */
export function parseManufactureDate(rawDate) {
  if (!rawDate) return null;
  const str = String(rawDate).trim();
  if (!str || /tidak\s*(terbaca|ada)/i.test(str)) {
    return null;
  }

  // Jika sudah format ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return str;
  }

  // Penanganan typo seperti "Oktober-20224" -> "2024-10-01"
  const typoYearMatch = str.match(/([a-zA-Z]+)[-_ ]*(\d{4,5})/i);
  if (typoYearMatch) {
    const monthWord = typoYearMatch[1].toLowerCase();
    let year = typoYearMatch[2];
    if (year === '20224') year = '2024'; // kasus nyata Excel
    else if (year.length > 4) year = year.slice(0, 4);

    const monthNum = findMonthNumber(monthWord) || '01';
    return `${year}-${monthNum}-01`;
  }

  // Format seperti "1 Sept-2023" atau "3 November--2021"
  const dayMonthYearMatch = str.match(/(\d{1,2})\s*[-_ ]*([a-zA-Z]+)\s*[-_ ]*(\d{2,4})/);
  if (dayMonthYearMatch) {
    let day = dayMonthYearMatch[1].padStart(2, '0');
    let monthWord = dayMonthYearMatch[2].toLowerCase();
    let year = dayMonthYearMatch[3];
    if (year.length === 2) year = '20' + year;
    const monthNum = findMonthNumber(monthWord) || '01';
    return `${year}-${monthNum}-${day}`;
  }

  // Format seperti "May-2022" atau "August-24"
  const monthYearMatch = str.match(/([a-zA-Z]+)[-_ ]*(\d{2,4})/);
  if (monthYearMatch) {
    let monthWord = monthYearMatch[1].toLowerCase();
    let year = monthYearMatch[2];
    if (year.length === 2) year = '20' + year;
    const monthNum = findMonthNumber(monthWord) || '01';
    return `${year}-${monthNum}-01`;
  }

  // Hanya tahun angka 4 digit, misal "2022"
  if (/^\d{4}$/.test(str)) {
    return `${str}-01-01`;
  }

  return null;
}

function findMonthNumber(word) {
  for (const [key, num] of Object.entries(MONTH_MAP)) {
    if (word.startsWith(key) || key.startsWith(word)) {
      return num;
    }
  }
  return null;
}

/**
 * Menghitung tanggal & status Hydrotest (+5 tahun)
 */
export function calculateHydrotest(rawManufactureDate) {
  const parsedDate = parseManufactureDate(rawManufactureDate);

  if (!parsedDate) {
    return {
      isValid: false,
      parsedManufactureDate: null,
      hydrotestDate: null,
      hydrotestDateStr: '-',
      status: 'perlu_cek_fisik',
      label: 'Perlu Cek Fisik',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
      daysRemaining: null,
      isExpired: false,
      isDueSoon: false
    };
  }

  const mDate = new Date(parsedDate);
  // Tambahkan tepat 5 tahun
  const hDate = new Date(mDate);
  hDate.setFullYear(hDate.getFullYear() + 5);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = hDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const hydrotestDateStr = hDate.toISOString().split('T')[0];

  if (daysRemaining < 0) {
    return {
      isValid: true,
      parsedManufactureDate: parsedDate,
      hydrotestDate: hDate,
      hydrotestDateStr,
      status: 'kadaluarsa',
      label: `Kadaluarsa (${Math.abs(daysRemaining)} hari lalu)`,
      shortLabel: `Kadaluarsa • Exp ${hDate.getFullYear()}`,
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
      daysRemaining,
      isExpired: true,
      isDueSoon: false
    };
  }

  if (daysRemaining <= 60) {
    return {
      isValid: true,
      parsedManufactureDate: parsedDate,
      hydrotestDate: hDate,
      hydrotestDateStr,
      status: 'segera',
      label: `Segera Hydrotest (< ${daysRemaining} hari)`,
      shortLabel: `Segera • ${daysRemaining} hr lagi`,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      daysRemaining,
      isExpired: false,
      isDueSoon: true
    };
  }

  return {
    isValid: true,
    parsedManufactureDate: parsedDate,
    hydrotestDate: hDate,
    hydrotestDateStr,
    status: 'aman',
    label: `Aman (Exp ${hDate.getFullYear()})`,
    shortLabel: `Aman • Exp ${hDate.getFullYear()}`,
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    daysRemaining,
    isExpired: false,
    isDueSoon: false
  };
}

/**
 * Format tanggal Indonesia yang ramah pembaca
 */
export function formatDateDisplay(dateStr) {
  if (!dateStr || dateStr === '-') return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}
