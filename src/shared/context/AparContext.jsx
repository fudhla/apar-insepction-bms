import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { rigsSeed } from '../data/rigsSeed';
import { aparTypesSeed } from '../data/aparTypesSeed';
import { aparsSeed } from '../data/aparsSeed';
import { inspectionsSeed } from '../data/inspectionsSeed';
import { maintenancesSeed } from '../data/maintenancesSeed';
import { hfoUsersSeed } from '../data/hfoUsersSeed';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import {
  fromSupabaseRig,
  toSupabaseRig,
  fromSupabaseAparType,
  toSupabaseAparType,
  fromSupabaseHfoUser,
  toSupabaseHfoUser,
  fromSupabaseApar,
  toSupabaseApar,
  fromSupabaseInspection,
  toSupabaseInspection,
  fromSupabaseMaintenance,
  toSupabaseMaintenance
} from '../lib/supabaseMappers';
import { showSuccess, showError, showToast } from '../utils/swalHelper';

const STORAGE_KEYS = {
  USER: 'bms_apar_v1_user'
};

const AparContext = createContext(null);

export function AparProvider({ children }) {
  // Sesi User Aktif (Satu-satunya data yang disimpan di localStorage)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Master Rigs
  const [rigs, setRigs] = useState(rigsSeed);

  // Master Apar Types
  const [aparTypes, setAparTypes] = useState(aparTypesSeed);

  // Data Akun HFO (In-memory fallback seed, data transaksi murni via Supabase)
  const [users, setUsers] = useState(hfoUsersSeed);

  // Data APAR (In-memory fallback seed, data transaksi murni via Supabase)
  const [apars, setApars] = useState(aparsSeed);

  // Data Inspeksi (In-memory fallback seed, data transaksi murni via Supabase)
  const [inspections, setInspections] = useState(inspectionsSeed);

  // Data Perbaikan (In-memory fallback seed, data transaksi murni via Supabase)
  const [maintenances, setMaintenances] = useState(maintenancesSeed);

  // Status Sinkronisasi Supabase
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCloudOnline, setIsCloudOnline] = useState(isSupabaseConfigured);

  // Sesi Login disimpan ke localStorage
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

  // =========================================================================
  // SUPABASE: LOAD DATA AWAL DARI 6 TABEL RESMI
  // =========================================================================
  const loadDataFromSupabase = async (options = { silent: false }) => {
    if (!supabase) {
      setIsCloudOnline(false);
      return false;
    }

    try {
      setIsSyncing(true);

      // 1. Fetch rigs
      const { data: rigsData, error: rErr } = await supabase.from('rigs').select('*').order('id');
      if (rErr) throw rErr;

      // Jika tabel rigs kosong di Supabase
      if (!rigsData || rigsData.length === 0) {
        console.warn('[Supabase] Tabel rigs masih kosong di Supabase.');
        setIsCloudOnline(true);
        return 'EMPTY';
      }

      // 2. Fetch apar_types
      const { data: typesData, error: tErr } = await supabase.from('apar_types').select('*').order('id');
      if (tErr) throw tErr;

      // 3. Fetch hfo_users
      const { data: usersData, error: uErr } = await supabase.from('hfo_users').select('*').order('name');
      if (uErr) throw uErr;

      // 4. Fetch apars
      const { data: aparsData, error: aErr } = await supabase.from('apars').select('*').order('asset_code');
      if (aErr) throw aErr;

      // 5. Fetch inspections
      const { data: inspData, error: iErr } = await supabase.from('inspections').select('*').order('inspection_date', { ascending: false });
      if (iErr) throw iErr;

      // 6. Fetch maintenances
      const { data: mntData, error: mErr } = await supabase.from('maintenances').select('*').order('created_at', { ascending: false });
      if (mErr) throw mErr;

      // Map Supabase rows ke Frontend camelCase
      const mappedRigs = rigsData.map(fromSupabaseRig);
      const mappedTypes = typesData.map(fromSupabaseAparType);
      const mappedUsers = usersData.map(fromSupabaseHfoUser);
      const mappedApars = aparsData.map((row) => fromSupabaseApar(row, mappedTypes));
      const mappedInspections = inspData.map((row) => fromSupabaseInspection(row, mappedApars));
      const mappedMaintenances = mntData.map((row) => fromSupabaseMaintenance(row, mappedApars));

      if (mappedRigs.length > 0) setRigs(mappedRigs);
      if (mappedTypes.length > 0) setAparTypes(mappedTypes);
      if (mappedUsers.length > 0) setUsers(mappedUsers);
      if (mappedApars.length > 0) setApars(mappedApars);
      if (mappedInspections.length > 0) setInspections(mappedInspections);
      if (mappedMaintenances.length > 0) setMaintenances(mappedMaintenances);

      setIsCloudOnline(true);
      if (!options.silent) {
        showToast('success', 'Data tersinkronisasi dengan Supabase Cloud');
      }
      return true;
    } catch (err) {
      console.warn('[Supabase] Koneksi offline atau error:', err.message);
      setIsCloudOnline(false);
      if (!options.silent) {
        showError('Gagal Sinkronisasi Cloud', err.message || 'Menggunakan data lokal di HP.');
      }
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Muat data dari Supabase saat pertama kali aplikasi dibuka
  useEffect(() => {
    loadDataFromSupabase({ silent: true });
  }, []);

  // =========================================================================
  // SUPABASE: SEED DATA AWAL (16 RIG, 7 TIPE, 48 HFO, 224 APAR)
  // =========================================================================
  const seedInitialDataToSupabase = async () => {
    if (!supabase) {
      showError(
        'Supabase Belum Aktif',
        'Silakan masukkan VITE_SUPABASE_ANON_KEY di environment (.env atau Vercel).'
      );
      return false;
    }

    try {
      setIsSyncing(true);
      showToast('info', 'Mengunggah data awal ke Supabase...');

      // 1. Rigs
      const mappedRigs = rigsSeed.map(toSupabaseRig);
      const { error: rErr } = await supabase.from('rigs').upsert(mappedRigs, { onConflict: 'id' });
      if (rErr) throw rErr;

      // 2. Apar Types
      const mappedTypes = aparTypesSeed.map(toSupabaseAparType);
      const { error: tErr } = await supabase.from('apar_types').upsert(mappedTypes, { onConflict: 'id' });
      if (tErr) throw tErr;

      // 3. Hfo Users (48 HFO)
      const mappedUsers = hfoUsersSeed.map(toSupabaseHfoUser);
      const { error: uErr } = await supabase.from('hfo_users').upsert(mappedUsers, { onConflict: 'id' });
      if (uErr) throw uErr;

      // 4. Apars (224 Tabung)
      const mappedApars = aparsSeed.map(toSupabaseApar);
      const { error: aErr } = await supabase.from('apars').upsert(mappedApars, { onConflict: 'id' });
      if (aErr) throw aErr;

      // 5. Inspections
      const mappedInspections = inspectionsSeed.map(toSupabaseInspection);
      const { error: iErr } = await supabase.from('inspections').upsert(mappedInspections, { onConflict: 'id' });
      if (iErr) throw iErr;

      // 6. Maintenances
      const mappedMaintenances = maintenancesSeed.map(toSupabaseMaintenance);
      const { error: mErr } = await supabase.from('maintenances').upsert(mappedMaintenances, { onConflict: 'id' });
      if (mErr) throw mErr;

      setIsCloudOnline(true);
      showSuccess(
        'Sinkronisasi Awal Berhasil',
        '16 Rig, 7 Tipe APAR, 48 Akun HFO, 224 Tabung, dan Riwayat berhasil diunggah ke Supabase.'
      );
      await loadDataFromSupabase({ silent: true });
      return true;
    } catch (err) {
      console.error('[Supabase] Gagal seed:', err);
      showError('Gagal Mengisi Supabase', err.message || 'Periksa koneksi dan izin tabel Supabase Anda.');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // =========================================================================
  // SUPABASE REALTIME SUBSCRIPTION (channel: apar-sync)
  // Mendengarkan perubahan apars, inspections, dan maintenances secara live
  // agar setiap tindakan dari proyek Admin langsung otomatis refresh di User
  // =========================================================================
  const aparTypesRef = useRef(aparTypes);
  aparTypesRef.current = aparTypes;
  const aparsRef = useRef(apars);
  aparsRef.current = apars;

  useEffect(() => {
    if (!supabase) {
      setIsCloudOnline(false);
      return;
    }

    const channel = supabase
      .channel('apar-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'apars' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const mapped = fromSupabaseApar(payload.new, aparTypesRef.current);
            setApars((prev) =>
              prev.map((a) => (a.id === mapped.id ? { ...a, ...mapped } : a))
            );
          } else if (payload.eventType === 'INSERT') {
            const mapped = fromSupabaseApar(payload.new, aparTypesRef.current);
            setApars((prev) => [mapped, ...prev.filter((a) => a.id !== mapped.id)]);
          } else if (payload.eventType === 'DELETE') {
            setApars((prev) => prev.filter((a) => a.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inspections' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const mapped = fromSupabaseInspection(payload.new, aparsRef.current);
            setInspections((prev) => [mapped, ...prev.filter((i) => i.id !== mapped.id)]);
          } else if (payload.eventType === 'UPDATE') {
            const mapped = fromSupabaseInspection(payload.new, aparsRef.current);
            setInspections((prev) =>
              prev.map((i) => (i.id === mapped.id ? { ...i, ...mapped } : i))
            );
          } else if (payload.eventType === 'DELETE') {
            setInspections((prev) => prev.filter((i) => i.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'maintenances' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const mapped = fromSupabaseMaintenance(payload.new, aparsRef.current);
            setMaintenances((prev) =>
              prev.map((m) => (m.id === mapped.id ? { ...m, ...mapped } : m))
            );

            // Feedback Realtime User Notification
            if (payload.new.status === 'closed') {
              showToast('success', `Tiket ${mapped.assetCode} disetujui & diselesaikan Admin`);
            } else if (payload.new.status === 'in_progress') {
              showToast('info', `Tiket ${mapped.assetCode} sedang diproses Admin (${payload.new.action_type || 'Perbaikan'})`);
            }
          } else if (payload.eventType === 'INSERT') {
            const mapped = fromSupabaseMaintenance(payload.new, aparsRef.current);
            setMaintenances((prev) => [mapped, ...prev.filter((m) => m.id !== mapped.id)]);
          } else if (payload.eventType === 'DELETE') {
            setMaintenances((prev) => prev.filter((m) => m.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsCloudOnline(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsCloudOnline(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
      .sort((a, b) => new Date(b.reportedDate || b.createdAt || 0) - new Date(a.reportedDate || a.createdAt || 0));
  }, [maintenances, currentUser]);

  // Rekan HFO satu Rig
  const teamHfos = useMemo(() => {
    if (!currentUser?.rigId) return [];
    return users.filter((u) => u.rigId === currentUser.rigId && u.id !== currentUser.id);
  }, [users, currentUser]);

  /**
   * Login HFO dengan verifikasi terhadap hfo_users
   */
  const loginHfo = async (userId, password) => {
    let user = users.find((u) => u.id === userId);

    // Coba verifikasi langsung ke tabel hfo_users di Supabase
    if (supabase) {
      try {
        const { data: dbUser, error: uErr } = await supabase
          .from('hfo_users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (!uErr && dbUser) {
          user = fromSupabaseHfoUser(dbUser);
        }
      } catch (e) {
        console.warn('[Supabase] Gagal check user, fallback lokal:', e);
      }
    }

    if (!user) {
      throw new Error('Akun HFO tidak ditemukan di sistem.');
    }
    if (user.password !== password) {
      throw new Error('Password salah. Password standar demo: 123456');
    }

    const session = {
      id: user.id,
      name: user.name,
      rigId: user.rigId,
      role: 'user',
      position: user.position || 'HFO'
    };
    setCurrentUser(session);
    return session;
  };

  /**
   * Login Sederhana (Preset Demo)
   */
  const loginAsUser = (inspectorName, rigId) => {
    const matchedUser = users.find(
      (u) => u.rigId === rigId && u.name.toLowerCase() === inspectorName.toLowerCase()
    );

    const userSession = {
      id: matchedUser ? matchedUser.id : `hfo-${Date.now()}`,
      role: 'user',
      name: matchedUser ? matchedUser.name : inspectorName.trim(),
      rigId: rigId,
      position: 'HFO'
    };
    setCurrentUser(userSession);
    return userSession;
  };

  /**
   * Ganti Password HFO & Update ke Supabase hfo_users
   */
  const changeUserPassword = async (userId, oldPassword, newPassword) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) {
      throw new Error('Pengguna tidak ditemukan.');
    }
    if (targetUser.password !== oldPassword) {
      throw new Error('Password lama tidak cocok.');
    }
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password baru minimal 6 karakter.');
    }

    // 1. Update state lokal & cache
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, password: newPassword } : u))
    );

    // 2. Update kolom password di Supabase hfo_users
    if (supabase) {
      try {
        const { error: upErr } = await supabase
          .from('hfo_users')
          .update({ password: newPassword })
          .eq('id', userId);

        if (upErr) {
          console.error('[Supabase] Gagal update password:', upErr);
          showToast('warning', 'Password tersimpan lokal di HP (belum terupdate di cloud).');
        } else {
          showToast('success', 'Password berhasil diperbarui di Supabase Cloud');
        }
      } catch (err) {
        console.error('[Supabase] Error update password:', err);
      }
    }
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  /**
   * Submit Inspeksi Cerdas & Simpan ke Supabase (inspections + update apars + insert maintenances)
   */
  const submitInspection = async ({
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

    const aparType = aparTypes.find((t) => t.id === targetApar.typeId);
    const sanitizedChecklist = { ...checklist };

    if (aparType && !aparType.hasPressureGauge) {
      sanitizedChecklist.pressureGauge = 'na';
    }

    const hasDamage = Object.entries(sanitizedChecklist).some(
      ([key, val]) =>
        key !== 'pressureGauge' || (aparType && aparType.hasPressureGauge)
          ? val === 'rusak'
          : false
    );

    const overallStatus = hasDamage ? 'tidak_layak' : 'layak';
    const newInspId = `insp-${Date.now()}`;
    const inspectorHfo = currentUser?.name || 'HFO Lapangan';

    const newInspection = {
      id: newInspId,
      aparId,
      assetCode: targetApar.assetCode,
      rigId: targetApar.rigId,
      inspectorName: inspectorHfo,
      inspectionDate,
      category,
      thirdPartyVendor: category === 'tahunan' ? thirdPartyVendor : '',
      checklist: sanitizedChecklist,
      overallStatus,
      issueDescription: hasDamage ? issueDescription : '',
      findingPhoto: hasDamage ? findingPhoto : null,
      createdAt: new Date().toISOString()
    };

    // 1. Simpan inspeksi baru lokal
    setInspections((prev) => [newInspection, ...prev]);

    // 2. Perbarui status APAR lokal
    const newAparStatus = overallStatus === 'tidak_layak' ? 'perlu_perbaikan' : 'layak';
    setApars((prev) =>
      prev.map((a) =>
        a.id === aparId
          ? {
              ...a,
              status: newAparStatus,
              lastInspectionDate: inspectionDate,
              lastInspectionStatus: overallStatus,
              lastInspectedBy: inspectorHfo
            }
          : a
      )
    );

    // 3. Jika rusak, otomatis buat tiket perbaikan status 'open' lokal
    let newMaintenance = null;
    if (hasDamage) {
      const newMntId = `mnt-${Date.now()}`;
      newMaintenance = {
        id: newMntId,
        aparId,
        assetCode: targetApar.assetCode,
        rigId: targetApar.rigId,
        inspectionId: newInspId,
        inspectorName: inspectorHfo,
        reportedBy: inspectorHfo,
        reportedDate: inspectionDate,
        issueDescription: issueDescription || 'Ditemukan kerusakan pada inspeksi komponen',
        actionType: 'perbaikan',
        status: 'open',
        vendorName: '',
        findingPhoto,
        evidencePhoto: null,
        evidenceUploadedBy: null,
        repairNotes: '',
        adminNotes: '',
        createdAt: new Date().toISOString(),
        updatedAt: inspectionDate
      };
      setMaintenances((prev) => [newMaintenance, ...prev]);
    }

    // 4. Sinkronisasi Asinkron ke Supabase Cloud
    if (supabase) {
      try {
        // A. Insert ke inspections
        const supInspection = toSupabaseInspection(newInspection);
        let { error: iErr } = await supabase.from('inspections').insert(supInspection);
        if (iErr && iErr.code === 'PGRST204' && iErr.message?.includes('inspection_photo')) {
          const { inspection_photo, ...safeInsp } = supInspection;
          const retry = await supabase.from('inspections').insert(safeInsp);
          iErr = retry.error;
        }
        if (iErr) console.warn('[Supabase] Inspections insert error:', iErr);

        // B. Update status di apars
        const { error: aErr } = await supabase
          .from('apars')
          .update({ status: newAparStatus })
          .eq('id', aparId);
        if (aErr) console.warn('[Supabase] Apars status update error:', aErr);

        // C. Insert ke maintenances jika rusak
        if (hasDamage && newMaintenance) {
          const supMaintenance = toSupabaseMaintenance(newMaintenance);
          let { error: mErr } = await supabase.from('maintenances').insert(supMaintenance);
          if (mErr && mErr.code === 'PGRST204' && mErr.message?.includes('finding_photo')) {
            const { finding_photo, ...safeMnt } = supMaintenance;
            const retry = await supabase.from('maintenances').insert(safeMnt);
            mErr = retry.error;
          }
          if (mErr) console.warn('[Supabase] Maintenances insert error:', mErr);
        }

        showToast('success', 'Inspeksi tersimpan & disinkronkan ke Supabase');
      } catch (cloudErr) {
        console.warn('[Supabase] Error sync submit:', cloudErr);
        showToast('warning', 'Tersimpan di HP (Cloud sedang offline)');
      }
    }

    return { inspection: newInspection, overallStatus };
  };

  /**
   * Kru / HFO mengunggah bukti perbaikan & sync ke Supabase
   */
  const uploadRepairEvidence = async (maintenanceId, photoBase64, repairNotes) => {
    const uploaderName = currentUser?.name || 'HFO Lapangan';
    const today = new Date().toISOString().split('T')[0];

    // 1. Update lokal
    setMaintenances((prev) =>
      prev.map((m) => {
        if (m.id === maintenanceId) {
          return {
            ...m,
            status: 'pending_review',
            evidencePhoto: photoBase64,
            evidenceUploadedBy: uploaderName,
            repairNotes: repairNotes || 'Telah diperbaiki oleh tim HFO lapangan',
            updatedAt: today
          };
        }
        return m;
      })
    );

    // 2. Update baris di Supabase maintenances
    if (supabase) {
      try {
        const { error: upErr } = await supabase
          .from('maintenances')
          .update({
            evidence_photo: photoBase64,
            repair_notes: repairNotes || 'Telah diperbaiki oleh tim HFO lapangan',
            evidence_uploaded_by: uploaderName,
            status: 'pending_review'
          })
          .eq('id', maintenanceId);

        if (upErr) {
          console.error('[Supabase] Error update bukti:', upErr);
          showToast('warning', 'Bukti tersimpan di HP (Gagal sync ke cloud: ' + upErr.message + ')');
        } else {
          showToast('success', 'Bukti berhasil diunggah ke Supabase Cloud');
        }
      } catch (err) {
        console.error('[Supabase] Error:', err);
      }
    }
  };

  /**
   * Reset sesi aktif & bersihkan cache legacy
   */
  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem('bms_apar_v1_users');
    localStorage.removeItem('bms_apar_v1_apars');
    localStorage.removeItem('bms_apar_v1_inspections');
    localStorage.removeItem('bms_apar_v1_maintenances');

    setCurrentUser(null);
    setUsers(hfoUsersSeed);
    setApars(aparsSeed);
    setInspections(inspectionsSeed);
    setMaintenances(maintenancesSeed);
  };

  const value = {
    currentUser,
    users,
    hfoUsers: users,
    teamHfos,
    userApars,
    userInspections,
    userMaintenances,
    aparTypes,
    rigs,
    rawApars: apars,
    isSyncing,
    isCloudOnline,
    isSupabaseConfigured,
    loadDataFromSupabase,
    seedInitialDataToSupabase,
    loginHfo,
    loginAsUser,
    changeUserPassword,
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
