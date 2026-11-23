import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { rigsSeed } from '../data/rigsSeed';
import { aparTypesSeed } from '../data/aparTypesSeed';
import { aparsSeed } from '../data/aparsSeed';
import { inspectionsSeed } from '../data/inspectionsSeed';
import { maintenancesSeed } from '../data/maintenancesSeed';

const STORAGE_KEYS = {
  USER: 'bms_apar_v1_user',
  APARS: 'bms_apar_v1_apars',
  INSPECTIONS: 'bms_apar_v1_inspections',
  MAINTENANCES: 'bms_apar_v1_maintenances'
};

const AparContext = createContext(null);

export function AparProvider({ children }) {
  // Sesi User
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Data APAR
  const [apars, setApars] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.APARS);
      return saved ? JSON.parse(saved) : aparsSeed;
    } catch {
      return aparsSeed;
    }
  });

  // Data Inspeksi
  const [inspections, setInspections] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INSPECTIONS);
      return saved ? JSON.parse(saved) : inspectionsSeed;
    } catch {
      return inspectionsSeed;
    }
  });

  // Data Perbaikan
  const [maintenances, setMaintenances] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MAINTENANCES);
      return saved ? JSON.parse(saved) : maintenancesSeed;
    } catch {
      return maintenancesSeed;
    }
  });

  // Sinkronisasi ke localStorage dengan proteksi error
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    } catch (e) {
      console.error('Gagal menyimpan currentUser ke localStorage', e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.APARS, JSON.stringify(apars));
    } catch (e) {
      console.error('Gagal menyimpan apars ke localStorage', e);
    }
  }, [apars]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(inspections));
    } catch (e) {
      console.error('Gagal menyimpan inspections ke localStorage', e);
    }
  }, [inspections]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MAINTENANCES, JSON.stringify(maintenances));
    } catch (e) {
      console.error('Gagal menyimpan maintenances ke localStorage', e);
    }
  }, [maintenances]);

  // Selector Otomatis Terfilter Rig yang Login
  const userApars = useMemo(() => {
    if (!currentUser?.rigId) return [];
    return apars.filter((a) => a.rigId === currentUser.rigId);
  }, [apars, currentUser]);

  const userInspections = useMemo(() => {
    if (!currentUser?.rigId) return [];
    return inspections
      .filter((i) => i.rigId === currentUser.rigId)
      .sort((a, b) => new Date(b.inspectionDate || 0) - new Date(a.inspectionDate || 0));
  }, [inspections, currentUser]);

  const userMaintenances = useMemo(() => {
    if (!currentUser?.rigId) return [];
    return maintenances
      .filter((m) => m.rigId === currentUser.rigId)
      .sort((a, b) => new Date(b.reportedDate || 0) - new Date(a.reportedDate || 0));
  }, [maintenances, currentUser]);

  // Aksi-aksi Modul User
  const loginAsUser = (inspectorName, rigId) => {
    const userSession = {
      role: 'user',
      name: inspectorName.trim() || 'Kru Rig',
      rigId: rigId
    };
    setCurrentUser(userSession);
    return userSession;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  /**
   * Submit Inspeksi Cerdas
   * Mengatur penguncian N/A untuk CO2, update status APAR, dan auto-create tiket perbaikan jika ada komponen rusak.
   */
  const submitInspection = ({
    aparId,
    inspectionDate = new Date().toISOString().split('T')[0],
    category = 'bulanan',
    thirdPartyVendor = '',
    checklist,
    issueDescription = '',
    findingPhoto = null
  }) => {
    const targetApar = apars.find((a) => a.id === aparId);
    if (!targetApar) {
      throw new Error(`APAR dengan ID ${aparId} tidak ditemukan.`);
    }

    const aparType = aparTypesSeed.find((t) => t.id === targetApar.typeId);
    const sanitizedChecklist = { ...checklist };

    // Aturan Kunci: Jika tipe APAR tidak punya pressure gauge (misal CO2), paksa 'na'
    if (aparType && !aparType.hasPressureGauge) {
      sanitizedChecklist.pressureGauge = 'na';
    }

    // Cek apakah ada komponen yang bernilai 'rusak'
    const hasDamage = Object.entries(sanitizedChecklist).some(
      ([key, val]) => key !== 'pressureGauge' || (aparType && aparType.hasPressureGauge)
        ? val === 'rusak'
        : false
    );

    const overallStatus = hasDamage ? 'tidak_layak' : 'layak';
    const newInspId = `insp-${Date.now()}`;

    const newInspection = {
      id: newInspId,
      aparId,
      assetCode: targetApar.assetCode,
      rigId: targetApar.rigId,
      inspectorName: currentUser?.name || 'Inspektor Lapangan',
      inspectionDate,
      category,
      thirdPartyVendor: category === 'tahunan' ? thirdPartyVendor : '',
      checklist: sanitizedChecklist,
      overallStatus,
      issueDescription: hasDamage ? issueDescription : '',
      findingPhoto: hasDamage ? findingPhoto : null,
      createdAt: new Date().toISOString()
    };

    // 1. Simpan inspeksi baru
    setInspections((prev) => [newInspection, ...prev]);

    // 2. Perbarui status APAR
    setApars((prev) =>
      prev.map((a) =>
        a.id === aparId
          ? {
              ...a,
              status: overallStatus === 'tidak_layak' ? 'perlu_perbaikan' : 'layak',
              lastInspectionDate: inspectionDate,
              lastInspectionStatus: overallStatus
            }
          : a
      )
    );

    // 3. Jika rusak, otomatis buat tiket perbaikan status 'open'
    if (hasDamage) {
      const newMntId = `mnt-${Date.now()}`;
      const newMaintenance = {
        id: newMntId,
        aparId,
        assetCode: targetApar.assetCode,
        rigId: targetApar.rigId,
        inspectorName: currentUser?.name || 'Inspektor Lapangan',
        reportedDate: inspectionDate,
        issueDescription: issueDescription || 'Ditemukan kerusakan pada inspeksi komponen',
        findingPhoto,
        status: 'open',
        repairNotes: '',
        evidencePhoto: null,
        updatedAt: new Date().toISOString().split('T')[0]
      };
      setMaintenances((prev) => [newMaintenance, ...prev]);
    }

    return { inspection: newInspection, overallStatus };
  };

  /**
   * Kru Rig mengunggah bukti perbaikan -> status tiket menjadi 'pending_review'
   */
  const uploadRepairEvidence = (maintenanceId, photoBase64, repairNotes) => {
    setMaintenances((prev) =>
      prev.map((m) => {
        if (m.id === maintenanceId) {
          return {
            ...m,
            status: 'pending_review',
            evidencePhoto: photoBase64,
            repairNotes: repairNotes || 'Telah diperbaiki oleh kru lapangan',
            updatedAt: new Date().toISOString().split('T')[0]
          };
        }
        return m;
      })
    );
  };

  /**
   * Reset seluruh localStorage ke data seed awal
   */
  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.APARS);
    localStorage.removeItem(STORAGE_KEYS.INSPECTIONS);
    localStorage.removeItem(STORAGE_KEYS.MAINTENANCES);

    setCurrentUser(null);
    setApars(aparsSeed);
    setInspections(inspectionsSeed);
    setMaintenances(maintenancesSeed);
  };

  const value = {
    currentUser,
    userApars,
    userInspections,
    userMaintenances,
    aparTypes: aparTypesSeed,
    rigs: rigsSeed,
    rawApars: apars,
    loginAsUser,
    logout,
    submitInspection,
    uploadRepairEvidence,
    resetDemoData
  };

  return <AparContext.Provider value={value}>{children}</AparContext.Provider>;
}

export function useApar() {
  const context = useContext(AparContext);
  if (!context) {
    throw new Error('useApar harus digunakan di dalam AparProvider');
  }
  return context;
}
