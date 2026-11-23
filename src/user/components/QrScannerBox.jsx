import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useApar } from '../../shared/context/AparContext';
import { showError } from '../../shared/utils/swalHelper';
import {
  Camera,
  AlertTriangle,
  Search,
  ChevronRight,
  RefreshCw,
  XCircle,
  ScanLine,
  Target
} from 'lucide-react';

export default function QrScannerBox() {
  const navigate = useNavigate();
  const { userApars, rawApars, currentUser } = useApar();

  const scannerRef = useRef(null);
  const [scannerStarted, setScannerStarted] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [warningRig, setWarningRig] = useState(null);

  const [manualCode, setManualCode] = useState('');
  const [selectedAparId, setSelectedAparId] = useState('');

  const scannerId = 'html5-qrcode-reader';

  const startScanner = async () => {
    setCameraError('');
    setWarningRig(null);

    try {
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch {
          // ignore
        }
      }

      const html5QrCode = new Html5Qrcode(scannerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128
        ],
        verbose: false
      });
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 230, height: 230 },
        aspectRatio: 1.0
      };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          handleCodeDetected(decodedText);
        },
        () => {
          // scanning frame
        }
      );

      setScannerStarted(true);
    } catch (err) {
      console.warn('Kamera error:', err);
      setCameraError(
        'Kamera tidak aktif atau izin browser ditolak. Silakan gunakan input manual di bawah ini.'
      );
      setScannerStarted(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        console.error('Error stop scanner:', e);
      }
      scannerRef.current = null;
    }
    setScannerStarted(false);
  };

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, []);

  const handleCodeDetected = (code) => {
    const cleanCode = code.trim();

    // Cek APAR di Rig aktif
    const matchedUserApar = userApars.find(
      (a) => a.assetCode.toLowerCase() === cleanCode.toLowerCase() || a.id === cleanCode
    );

    if (matchedUserApar) {
      stopScanner();
      navigate(`/user/inspect/${matchedUserApar.id}`);
      return;
    }

    // Cek apakah milik Rig lain
    const matchedOtherRig = rawApars.find(
      (a) => a.assetCode.toLowerCase() === cleanCode.toLowerCase() || a.id === cleanCode
    );

    if (matchedOtherRig) {
      setWarningRig(matchedOtherRig);
      showError(
        'APAR Milik Rig Lain!',
        `Tabung ${matchedOtherRig.assetCode} terdaftar milik ${matchedOtherRig.rigId}, sedangkan Anda login di ${currentUser?.rigId}.`
      );
    } else {
      setWarningRig({
        assetCode: cleanCode,
        rigId: 'Tidak Terdaftar',
        isNotFound: true
      });
      showError(
        'Kode Aset Tidak Terdaftar',
        `Kode "${cleanCode}" tidak ditemukan di database APAR operasional.`
      );
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleCodeDetected(manualCode.trim());
  };

  const handleSelectSubmit = (e) => {
    e.preventDefault();
    if (!selectedAparId) return;
    stopScanner();
    navigate(`/user/inspect/${selectedAparId}`);
  };

  return (
    <div className="space-y-4">
      {/* Viewfinder HUD Container */}
      <div className="bg-[#0F172A] rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        {/* HUD Top Bar */}
        <div className="px-4 py-3 bg-[#1E293B] border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <ScanLine className="w-4 h-4 text-red-500" />
            <span className="font-mono font-bold tracking-wider text-[11px] text-white">
              HUD OPTICAL SCANNER
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              TARGET: {currentUser?.rigId}
            </span>
            {scannerStarted && (
              <button
                type="button"
                onClick={() => {
                  stopScanner();
                  startScanner();
                }}
                className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                title="Restart Sensor"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Video Frame */}
        <div className="relative bg-black min-h-[300px] flex items-center justify-center overflow-hidden">
          <div id={scannerId} className="w-full h-full max-w-[340px]" />

          {/* Optical Reticle Frame */}
          {scannerStarted && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-56 h-56 border border-white/20 relative shadow-[0_0_0_9999px_rgba(15,23,42,0.65)]">
                {/* 4 Precision Ticks */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-red-500" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-red-500" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-red-500" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-red-500" />

                {/* Center Crosshair */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 border border-white/30 rounded-full flex items-center justify-center">
                  <div className="w-1 h-1 bg-red-500 rounded-full" />
                </div>

                {/* Laser Line */}
                <div className="w-full h-[2px] bg-red-500/90 shadow-[0_0_8px_rgba(239,68,68,0.8)] absolute top-1/2 -translate-y-1/2 animate-pulse" />
              </div>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 bg-[#0F172A]/95 text-white p-6 flex flex-col items-center justify-center text-center">
              <XCircle className="w-10 h-10 text-rose-500 mb-2" />
              <p className="text-xs font-semibold text-rose-200 max-w-xs">{cameraError}</p>
              <button
                type="button"
                onClick={startScanner}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl text-xs font-bold transition-colors btn-tactile"
              >
                Coba Kamera Ulang
              </button>
            </div>
          )}
        </div>

        <div className="px-4 py-2.5 bg-[#1E293B] border-t border-slate-800 text-center font-mono text-[10px] text-slate-400">
          Arahkan barcode/QR tabung ke dalam kotak bidik tengah.
        </div>
      </div>

      {/* Peringatan Unit Rig Lain */}
      {warningRig && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {warningRig.isNotFound ? 'Kode Aset Tidak Terdaftar' : 'Peringatan: APAR Unit Rig Lain!'}
            </span>
          </div>
          <p className="text-amber-800 leading-relaxed font-mono text-[11px]">
            {warningRig.isNotFound ? (
              <>Kode "{warningRig.assetCode}" tidak ditemukan pada database APAR.</>
            ) : (
              <>
                Tabung <strong>{warningRig.assetCode}</strong> terdaftar milik <strong>{warningRig.rigId}</strong>,
                sementara Anda aktif di <strong>{currentUser?.rigId}</strong>.
              </>
            )}
          </p>
          <button
            type="button"
            onClick={() => setWarningRig(null)}
            className="px-3 py-1 bg-amber-200 hover:bg-amber-300 rounded text-amber-900 font-bold text-[11px]"
          >
            Tutup Pesan
          </button>
        </div>
      )}

      {/* Alternatif Input Manual */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
            Pilihan Manual Lapangan
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Gunakan jika stiker barcode pudar, kotor, atau kamera tidak aktif.
          </p>
        </div>

        {/* 1. Ketik Kode Langsung */}
        <form onSubmit={handleManualSubmit} className="space-y-1.5">
          <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
            1. Ketik Kode Aset APAR
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Contoh: APAR-BMS07-001"
                className="w-full px-3 py-2 text-xs font-mono uppercase rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 text-slate-900 font-semibold"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shrink-0 btn-tactile"
            >
              Cari & Buka
            </button>
          </div>
        </form>

        <div className="relative flex items-center py-0.5">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-3 text-[10px] font-mono text-slate-400 uppercase">atau</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {/* 2. Pilih dari Daftar Dropdown */}
        <form onSubmit={handleSelectSubmit} className="space-y-1.5">
          <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
            2. Pilih dari Unit {currentUser?.rigId} ({userApars.length} Tabung)
          </label>
          <div className="flex gap-2">
            <select
              value={selectedAparId}
              onChange={(e) => setSelectedAparId(e.target.value)}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 text-slate-900"
            >
              <option value="">-- Pilih Unit APAR --</option>
              {userApars.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.assetCode} — {a.placement} ({a.typeName})
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!selectedAparId}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-colors shrink-0 btn-tactile flex items-center gap-1"
            >
              <span>Buka</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
