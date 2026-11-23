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
import { calculateHydrotest } from '../utils/hydrotestUtils';

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
  // =========================================================================
  // SUPABASE: LOAD / FETCH ALL DATA (6 TABEL SECARA PARALEL)
  // =========================================================================
  const fetchAllData = async (options = { silent: true }) => {
    if (!supabase) {
      setIsCloudOnline(false);
      return false;
    }

    try {
      setIsSyncing(true);

      // Ambil 6 tabel serentak secara paralel
      const [
        { data: rigsData, error: rErr },
        { data: typesData, error: tErr },
        { data: usersData, error: uErr },
        { data: aparsData, error: aErr },
        { data: inspData, error: iErr },
        { data: mntData, error: mErr }
      ] = await Promise.all([
        supabase.from('rigs').select('*').order('id'),
        supabase.from('apar_types').select('*').order('id'),
        supabase.from('hfo_users').select('*').order('name'),
        supabase.from('apars').select('*').order('asset_code'),
        supabase.from('inspections').select('*').order('inspection_date', { ascending: false }),
        supabase.from('maintenances').select('*').order('created_at', { ascending: false })
      ]);

      if (rErr) throw rErr;
      if (tErr) throw tErr;
      if (uErr) throw uErr;
      if (aErr) throw aErr;
      if (iErr) throw iErr;
      if (mErr) throw mErr;

      // Map Supabase rows ke Frontend camelCase
      const mappedRigs = (rigsData || []).map(fromSupabaseRig);
      const mappedTypes = (typesData || []).map(fromSupabaseAparType);
      const mappedUsers = (usersData || []).map(fromSupabaseHfoUser);
      const mappedApars = (aparsData || []).map((row) => fromSupabaseApar(row, mappedTypes));
      const mappedInspections = (inspData || []).map((row) => fromSupabaseInspection(row, mappedApars));
      const mappedMaintenances = (mntData || []).map((row) => fromSupabaseMaintenance(row, mappedApars));

      // Selaraskan info inspeksi fisik terakhir ke setiap unit APAR
      const aparsWithInspection = mappedApars.map((apar) => {
        const latest = mappedInspections.find((i) => i.aparId === apar.id);
        return {
          ...apar,
          lastInspectionDate: latest ? latest.inspectionDate : apar.lastInspectionDate,
          lastInspectionStatus: latest ? latest.overallStatus : apar.lastInspectionStatus,
          lastInspectedBy: latest ? latest.inspectorName : apar.lastInspectedBy
        };
      });

      if (mappedRigs.length > 0) setRigs(mappedRigs);
      if (mappedTypes.length > 0) setAparTypes(mappedTypes);
      if (mappedUsers.length > 0) setUsers(mappedUsers);
      if (aparsWithInspection.length > 0) setApars(aparsWithInspection);
      setInspections(mappedInspections);
      setMaintenances(mappedMaintenances);

      setIsCloudOnline(true);
      if (!options.silent) {
        showToast('success', 'Data tersinkronisasi dengan Supabase Cloud');
      }
      return true;
    } catch (err) {
      console.warn('[Supabase] Gagal mengambil data cloud:', err.message);
      setIsCloudOnline(false);
      if (!options.silent) {
        showError('Gagal Sinkronisasi Cloud', err.message);
      }
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const loadDataFromSupabase = fetchAllData;

  // Muat data dari Supabase saat pertama kali aplikasi dibuka
  useEffect(() => {
    fetchAllData({ silent: true });
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
      await fetchAllData({ silent: true });
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
  // SUPABASE REALTIME SUBSCRIPTION (channel: apar-realtime-all-tables)
  // Mendengarkan perubahan SEMUA 6 TABEL secara live dengan FILTER KETAT ISOLASI RIG:
  // User (HFO) HANYA menerima notifikasi dan trigger sinkronisasi untuk Rig tempatnya login (currentUser.rigId)
  // =========================================================================
  const currentUserRef = useRef(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const aparsRef = useRef(apars);
  useEffect(() => {
    aparsRef.current = apars;
  }, [apars]);

  const inspectionsRef = useRef(inspections);
  useEffect(() => {
    inspectionsRef.current = inspections;
  }, [inspections]);

  const maintenancesRef = useRef(maintenances);
  useEffect(() => {
    maintenancesRef.current = maintenances;
  }, [maintenances]);

  /**
   * Filter ketat isolasi Rig:
   * Mengembalikan true HANYA jika payload perubahan ditujukan untuk rig yang sedang login.
   * Mengembalikan false jika perubahan berasal dari Rig lain (diabaikan sepenuhnya).
   */
  const isRigEventForCurrentUser = (table, payload) => {
    const user = currentUserRef.current;
    if (!user) return false;

    // Jika bukan role user (misal admin), terima seluruh data
    if (user.role !== 'user') return true;

    const record =
      payload?.new && Object.keys(payload.new).length > 0
        ? payload.new
        : payload?.old && Object.keys(payload.old).length > 0
        ? payload.old
        : null;

    if (!record) return false;

    // 1. Dapatkan rig_id langsung dari record
    let recordRigId = record.rig_id || record.rigId;

    // 2. Jika tidak ada di record, cari lewat relasi apar_id
    if (!recordRigId && record.apar_id) {
      const matchApar = aparsRef.current.find(
        (a) => a.id === record.apar_id || a.assetCode === record.apar_id
      );
      if (matchApar) {
        recordRigId = matchApar.rigId;
      }
    }

    // 3. Fallback pada event DELETE jika payload hanya berisi { id }
    if (!recordRigId && record.id) {
      if (table === 'apars') {
        recordRigId = aparsRef.current.find((a) => a.id === record.id)?.rigId;
      } else if (table === 'inspections') {
        recordRigId = inspectionsRef.current.find((i) => i.id === record.id)?.rigId;
      } else if (table === 'maintenances') {
        recordRigId = maintenancesRef.current.find((m) => m.id === record.id)?.rigId;
      }
    }

    // Jika rig_id tidak sama dengan rig user aktif: abaikan sepenuhnya!
    if (!recordRigId || recordRigId !== user.rigId) {
      return false;
    }

    return true;
  };

  useEffect(() => {
    if (!supabase) {
      setIsCloudOnline(false);
      return;
    }

    const channel = supabase
      .channel('apar-realtime-all-tables')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rigs' }, () => {
        fetchAllData({ silent: true });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'apar_types' }, () => {
        fetchAllData({ silent: true });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hfo_users' }, (payload) => {
        const user = currentUserRef.current;
        if (user?.role === 'user') {
          const record = payload.new || payload.old;
          const userRigId = record?.rig_id || record?.rigId;
          const isSelf = record?.id === user.id;
          // Abaikan perubahan user dari Rig lain
          if (!isSelf && userRigId !== user.rigId) {
            return;
          }
        }
        fetchAllData({ silent: true });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'apars' }, (payload) => {
        // Filter ketat: Hanya refresh jika APAR milik Rig yang sedang login
        if (!isRigEventForCurrentUser('apars', payload)) return;
        fetchAllData({ silent: true });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inspections' }, (payload) => {
        // Filter ketat: Hanya proses jika inspeksi milik Rig yang sedang login
        if (!isRigEventForCurrentUser('inspections', payload)) return;
        fetchAllData({ silent: true });

        // Tampilkan notifikasi hanya untuk aktivitas di Rig sendiri (dari rekan HFO)
        const user = currentUserRef.current;
        const record = payload?.new;
        if (
          payload?.eventType === 'INSERT' &&
          record?.inspector_name &&
          record.inspector_name !== user?.name
        ) {
          showToast('info', `Rekan HFO (${record.inspector_name}) baru saja menginspeksi APAR di Rig ${user?.rigId}`);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenances' }, (payload) => {
        // Filter ketat: Hanya proses jika tiket perbaikan milik Rig yang sedang login
        if (!isRigEventForCurrentUser('maintenances', payload)) return;
        fetchAllData({ silent: true });

        // Tampilkan notifikasi hanya untuk tiket di Rig sendiri
        if (payload?.new?.status === 'closed') {
          showToast('success', 'Tiket perbaikan telah disetujui & diselesaikan Admin');
        } else if (payload?.new?.status === 'in_progress') {
          showToast('info', `Tiket perbaikan sedang diproses Admin (${payload?.new?.action_type || 'Perbaikan'})`);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsCloudOnline(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsCloudOnline(false);
        }
      });

    // Fallback Auto-Sync: Saat tab / browser HP kembali aktif
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAllData({ silent: true });
      }
    };
    const handleFocus = () => {
      fetchAllData({ silent: true });
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Polling Interval ringan setiap 15 detik
    const intervalId = setInterval(() => {
      fetchAllData({ silent: true });
    }, 15000);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
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
   * Ganti Password HFO & Update Langsung ke Supabase hfo_users
   * (Wajib AWAIT & Lempar Error agar ditangkap SweetAlert2 di UI)
   */
  const changeUserPassword = async (userId, oldPassword, newPassword) => {
    if (!supabase) {
      throw new Error('Koneksi Supabase belum aktif. Periksa koneksi internet Anda.');
    }

    // Ambil data user dari Supabase untuk verifikasi password lama yang akurat
    const { data: dbUser, error: checkErr } = await supabase
      .from('hfo_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (checkErr || !dbUser) {
      throw new Error('Akun pengguna tidak ditemukan di Supabase.');
    }

    if (dbUser.password !== oldPassword) {
      throw new Error('Password lama tidak cocok.');
    }
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password baru minimal 6 karakter.');
    }

    // Update langsung ke Supabase hfo_users
    const { error: upErr } = await supabase
      .from('hfo_users')
      .update({ password: newPassword })
      .eq('id', userId);

    if (upErr) {
      throw new Error(`Gagal memperbarui password di Supabase: ${upErr.message}`);
    }

    // Update state lokal setelah Supabase 100% SUKSES
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, password: newPassword } : u))
    );

    showToast('success', 'Password berhasil diperbarui di Supabase Cloud');
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  /**
   * Submit Inspeksi (Layak / Rusak) 100% Langsung ke Supabase
   * (Wajib AWAIT seluruh query & Lempar Error jika gagal ke Supabase)
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
    if (!supabase) {
      throw new Error('Koneksi Supabase belum aktif. Periksa koneksi internet Anda.');
    }

    const targetApar = apars.find((a) => a.id === aparId);
    if (!targetApar) {
      throw new Error(`APAR dengan ID ${aparId} tidak ditemukan.`);
    }

    // Isolasi Rig: Cegah inspeksi ke APAR Rig lain
    if (currentUser?.role === 'user' && currentUser?.rigId && targetApar.rigId !== currentUser.rigId) {
      throw new Error(`Akses ditolak: Anda tidak memiliki izin menginspeksi APAR di Rig ${targetApar.rigId}.`);
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
      issueDescription: hasDamage ? issueDescription : (issueDescription || ''),
      notes: hasDamage ? issueDescription : (issueDescription || ''),
      findingPhoto: findingPhoto || null,
      createdAt: new Date().toISOString()
    };

    const newAparStatus = overallStatus === 'tidak_layak' ? 'perlu_perbaikan' : 'layak';

    // 1. Insert ke Supabase inspections (WAJIB AWAIT & CHECK ERROR)
    const supInspection = toSupabaseInspection(newInspection);
    let { error: iErr } = await supabase.from('inspections').insert(supInspection);
    if (iErr && iErr.code === 'PGRST204' && iErr.message?.includes('inspection_photo')) {
      const { inspection_photo, ...safeInsp } = supInspection;
      const retry = await supabase.from('inspections').insert(safeInsp);
      iErr = retry.error;
    }
    if (iErr) {
      throw new Error(`Gagal menyimpan data inspeksi ke Supabase: ${iErr.message}`);
    }

    // 2. Update status ke Supabase apars (WAJIB AWAIT & CHECK ERROR)
    const { error: aErr } = await supabase
      .from('apars')
      .update({ status: newAparStatus })
      .eq('id', aparId);
    if (aErr) {
      throw new Error(`Gagal memperbarui status APAR di Supabase: ${aErr.message}`);
    }

    // 3. Jika rusak, otomatis terbitkan tiket baru ke Supabase maintenances (WAJIB AWAIT & CHECK ERROR)
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

      const supMaintenance = toSupabaseMaintenance(newMaintenance);
      let { error: mErr } = await supabase.from('maintenances').insert(supMaintenance);
      if (mErr && mErr.code === 'PGRST204' && mErr.message?.includes('finding_photo')) {
        const { finding_photo, ...safeMnt } = supMaintenance;
        const retry = await supabase.from('maintenances').insert(safeMnt);
        mErr = retry.error;
      }
      if (mErr) {
        throw new Error(`Gagal menerbitkan tiket perbaikan ke Supabase: ${mErr.message}`);
      }
    }

    // 4. Update state lokal setelah Supabase 100% SUKSES
    setInspections((prev) => [newInspection, ...prev]);
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
    if (newMaintenance) {
      setMaintenances((prev) => [newMaintenance, ...prev]);
    }

    showToast('success', 'Inspeksi 100% tersimpan ke Supabase Cloud');
    fetchAllData({ silent: true }).catch(() => {});

    return { inspection: newInspection, overallStatus };
  };

  /**
   * Kru / HFO mengunggah bukti perbaikan 100% Langsung ke Supabase
   * (Wajib AWAIT & Lempar Error agar ditangkap SweetAlert2 di UI)
   */
  const uploadRepairEvidence = async (maintenanceId, photoBase64, repairNotes) => {
    if (!supabase) {
      throw new Error('Koneksi Supabase belum aktif. Periksa koneksi internet Anda.');
    }

    // Isolasi Rig: Cegah upload bukti perbaikan untuk tiket Rig lain
    const targetMnt = maintenances.find((m) => m.id === maintenanceId);
    if (currentUser?.role === 'user' && currentUser?.rigId && targetMnt && targetMnt.rigId !== currentUser.rigId) {
      throw new Error(`Akses ditolak: Tiket perbaikan ini bukan milik Rig ${currentUser.rigId}.`);
    }

    const uploaderName = currentUser?.name || 'HFO Lapangan';
    const today = new Date().toISOString().split('T')[0];

    // 1. Update ke Supabase maintenances (WAJIB AWAIT & CHECK ERROR)
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
      throw new Error(`Gagal mengunggah bukti ke Supabase: ${upErr.message}`);
    }

    // 2. Update state lokal setelah Supabase 100% SUKSES
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

    showToast('success', 'Bukti perbaikan 100% tersimpan ke Supabase Cloud');
    fetchAllData({ silent: true }).catch(() => {});
  };

  /**
   * CREATE APAR (Khusus Rig aktif)
   * Menyimpan langsung ke tabel apars di Supabase dan menyelaraskan ke state lokal
   */
  const createApar = async (newAparData) => {
    if (!supabase) {
      throw new Error('Koneksi Supabase belum aktif. Periksa koneksi internet Anda.');
    }
    if (!currentUser?.rigId) {
      throw new Error('Sesi login tidak valid. Silakan login ulang.');
    }

    const assetCode = (newAparData.assetCode || '').trim().toUpperCase();
    if (!assetCode) {
      throw new Error('Kode Aset APAR wajib diisi.');
    }
    if (!newAparData.typeId) {
      throw new Error('Tipe Media APAR wajib dipilih dari master.');
    }
    if (!newAparData.placement?.trim()) {
      throw new Error('Lokasi penempatan APAR wajib diisi.');
    }

    // Cek duplikasi kode aset
    const isDuplicate = apars.some((a) => a.assetCode.toLowerCase() === assetCode.toLowerCase());
    if (isDuplicate) {
      throw new Error(`Kode Aset "${assetCode}" sudah digunakan di sistem.`);
    }

    // Hitung tanggal next_hydrotest_date (+5 tahun jika manufactureDate diisi)
    let nextHydrotestDate = null;
    if (newAparData.manufactureDate) {
      const hydro = calculateHydrotest(newAparData.manufactureDate);
      if (hydro.isValid && hydro.hydrotestDateStr !== '-') {
        nextHydrotestDate = hydro.hydrotestDateStr;
      }
    }

    const aparId = `apar-${currentUser.rigId.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString().slice(-6)}`;

    const row = {
      id: aparId,
      asset_code: assetCode,
      rig_id: currentUser.rigId,
      apar_type_id: newAparData.typeId,
      brand_model: newAparData.brandModel?.trim() || 'BMS Standard',
      serial_no: newAparData.serialNo?.trim() || 'TIDAK TERBACA',
      placement: newAparData.placement.trim(),
      charge_owner: newAparData.chargeOwner === 'APM' ? 'APM' : 'BMS',
      manufacture_date: newAparData.manufactureDate || null,
      last_hydrotest_date: newAparData.lastHydrotestDate || null,
      next_hydrotest_date: nextHydrotestDate,
      status: 'layak',
      created_at: new Date().toISOString()
    };

    const { error: insErr } = await supabase.from('apars').insert(row);
    if (insErr) {
      throw new Error(`Gagal menyimpan APAR ke Supabase: ${insErr.message}`);
    }

    const mapped = fromSupabaseApar(row, aparTypes);
    setApars((prev) => [mapped, ...prev]);

    showToast('success', `APAR ${assetCode} berhasil ditambahkan ke Rig ${currentUser.rigId}`);
    fetchAllData({ silent: true }).catch(() => {});
    return mapped;
  };

  /**
   * UPDATE APAR (Khusus Rig aktif)
   * Memperbarui detail APAR di Supabase & menghitung ulang hydrotest (+5 tahun)
   */
  const updateApar = async (aparId, updateData) => {
    if (!supabase) {
      throw new Error('Koneksi Supabase belum aktif. Periksa koneksi internet Anda.');
    }
    const targetApar = apars.find((a) => a.id === aparId);
    if (!targetApar) {
      throw new Error('Unit APAR tidak ditemukan.');
    }
    if (currentUser?.role === 'user' && targetApar.rigId !== currentUser.rigId) {
      throw new Error(`Akses ditolak: APAR ini bukan milik Rig Anda (${currentUser.rigId}).`);
    }

    const assetCode = (updateData.assetCode || targetApar.assetCode).trim().toUpperCase();
    if (!assetCode) {
      throw new Error('Kode Aset APAR tidak boleh kosong.');
    }

    // Cek duplikasi jika assetCode diubah
    if (assetCode.toLowerCase() !== targetApar.assetCode.toLowerCase()) {
      const isDuplicate = apars.some(
        (a) => a.id !== aparId && a.assetCode.toLowerCase() === assetCode.toLowerCase()
      );
      if (isDuplicate) {
        throw new Error(`Kode Aset "${assetCode}" sudah digunakan tabung lain.`);
      }
    }

    // Hitung ulang next_hydrotest_date jika manufactureDate diperbarui
    let nextHydrotestDate = targetApar.nextHydrotestDate;
    if (updateData.manufactureDate !== undefined) {
      if (updateData.manufactureDate) {
        const hydro = calculateHydrotest(updateData.manufactureDate);
        nextHydrotestDate = hydro.isValid && hydro.hydrotestDateStr !== '-' ? hydro.hydrotestDateStr : null;
      } else {
        nextHydrotestDate = null;
      }
    }

    const updateRow = {
      asset_code: assetCode,
      apar_type_id: updateData.typeId || targetApar.typeId,
      brand_model: updateData.brandModel !== undefined ? updateData.brandModel.trim() : targetApar.brandModel,
      serial_no: updateData.serialNo !== undefined ? updateData.serialNo.trim() : targetApar.serialNo,
      placement: updateData.placement !== undefined ? updateData.placement.trim() : targetApar.placement,
      charge_owner: updateData.chargeOwner || targetApar.chargeOwner,
      manufacture_date: updateData.manufactureDate !== undefined ? updateData.manufactureDate : targetApar.manufactureDate,
      next_hydrotest_date: nextHydrotestDate,
      status: updateData.status || targetApar.status
    };

    const { error: upErr } = await supabase.from('apars').update(updateRow).eq('id', aparId);
    if (upErr) {
      throw new Error(`Gagal memperbarui APAR di Supabase: ${upErr.message}`);
    }

    // Update state lokal
    setApars((prev) =>
      prev.map((a) => {
        if (a.id === aparId) {
          const matchedType = aparTypes.find((t) => t.id === updateRow.apar_type_id);
          const typeName =
            matchedType?.description ||
            (matchedType ? `${matchedType.media} ${matchedType.capacityLabel || ''}`.trim() : a.typeName);
          return {
            ...a,
            assetCode: updateRow.asset_code,
            typeId: updateRow.apar_type_id,
            typeName,
            brandModel: updateRow.brand_model,
            brand: updateRow.brand_model,
            serialNo: updateRow.serial_no,
            placement: updateRow.placement,
            location: updateRow.placement,
            chargeOwner: updateRow.charge_owner,
            manufactureDate: updateRow.manufacture_date,
            nextHydrotestDate: updateRow.next_hydrotest_date,
            status: updateRow.status
          };
        }
        return a;
      })
    );

    showToast('success', `Data APAR ${assetCode} berhasil diperbarui di Supabase`);
    fetchAllData({ silent: true }).catch(() => {});
    return true;
  };

  /**
   * DELETE APAR (Khusus Rig aktif)
   * Menghapus unit APAR beserta riwayat transaksi terkait dari Supabase
   */
  const deleteApar = async (aparId) => {
    if (!supabase) {
      throw new Error('Koneksi Supabase belum aktif. Periksa koneksi internet Anda.');
    }
    const targetApar = apars.find((a) => a.id === aparId);
    if (!targetApar) {
      throw new Error('Unit APAR tidak ditemukan.');
    }
    if (currentUser?.role === 'user' && targetApar.rigId !== currentUser.rigId) {
      throw new Error(`Akses ditolak: APAR ini bukan milik Rig Anda (${currentUser.rigId}).`);
    }

    // 1. Bersihkan transaksi terkait terlebih dahulu
    await supabase.from('maintenances').delete().eq('apar_id', aparId);
    await supabase.from('inspections').delete().eq('apar_id', aparId);

    // 2. Hapus baris APAR dari Supabase
    const { error: delErr } = await supabase.from('apars').delete().eq('id', aparId);
    if (delErr) {
      throw new Error(`Gagal menghapus APAR dari Supabase: ${delErr.message}`);
    }

    // 3. Sinkronkan state lokal
    setApars((prev) => prev.filter((a) => a.id !== aparId));
    setInspections((prev) => prev.filter((i) => i.aparId !== aparId));
    setMaintenances((prev) => prev.filter((m) => m.aparId !== aparId));

    showToast('success', `APAR ${targetApar.assetCode} berhasil dihapus`);
    fetchAllData({ silent: true }).catch(() => {});
    return true;
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
    fetchAllData,
    loadDataFromSupabase: fetchAllData,
    seedInitialDataToSupabase,
    loginHfo,
    loginAsUser,
    changeUserPassword,
    logout,
    submitInspection,
    uploadRepairEvidence,
    createApar,
    updateApar,
    deleteApar,
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
