import React, { useState, useMemo } from 'react';
import { useApar } from '../../shared/context/AparContext';
import AparCard from '../components/AparCard';
import AparFormModal from '../components/AparFormModal';
import { showConfirm, showSuccess, showError } from '../../shared/utils/swalHelper';
import { Search, Filter, Layers, X, PlusCircle } from 'lucide-react';

export default function UserAparList() {
  const { userApars, aparTypes, currentUser, deleteApar, userInspections } = useApar();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all' | 'layak' | 'perlu_perbaikan' | 'belum_dicek'

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApar, setEditingApar] = useState(null);

  const currentMonth = new Date().toISOString().slice(0, 7);

  const handleDeleteApar = async (apar) => {
    const hasHistory = userInspections.some((i) => i.aparId === apar.id);
    let warningText = `Apakah Anda yakin ingin menghapus unit APAR ${apar.assetCode}? Tindakan ini akan menghapus data tabung dari Supabase Cloud.`;
    if (hasHistory) {
      warningText = `PERINGATAN AUDIT K3: Unit APAR ${apar.assetCode} sudah memiliki riwayat log inspeksi fisik. Menghapus tabung ini akan menghapus seluruh data inspeksi dan tiket perbaikan terkait. Jika tabung sudah rusak permanen, Anda dapat mengubah statusnya menjadi "Afkir" melalui menu Edit. Tetap ingin menghapus permanen?`;
    }

    const confirmed = await showConfirm({
      title: `Hapus Unit ${apar.assetCode}?`,
      text: warningText,
      confirmText: 'Ya, Hapus Permanen',
      cancelText: 'Batal',
      isDanger: true,
      icon: 'warning'
    });

    if (confirmed) {
      try {
        await deleteApar(apar.id);
        showSuccess('APAR Dihapus', `Unit ${apar.assetCode} berhasil dihapus dari sistem.`);
      } catch (err) {
        showError('Gagal Menghapus', err.message || 'Terjadi kesalahan sistem.');
      }
    }
  };

  // Filter & Search Logic
  const filteredApars = useMemo(() => {
    return userApars.filter((apar) => {
      // 1. Search Query
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        apar.assetCode.toLowerCase().includes(q) ||
        (apar.serialNo && apar.serialNo.toLowerCase().includes(q)) ||
        (apar.placement && apar.placement.toLowerCase().includes(q)) ||
        (apar.brandModel && apar.brandModel.toLowerCase().includes(q)) ||
        (apar.lastInspectedBy && apar.lastInspectedBy.toLowerCase().includes(q));

      // 2. Type Filter
      const matchType = selectedType === 'all' || apar.typeId === selectedType;

      // 3. Status Filter
      let matchStatus = true;
      if (selectedStatus === 'layak') {
        matchStatus = apar.status === 'layak';
      } else if (selectedStatus === 'perlu_perbaikan') {
        matchStatus = apar.status === 'perlu_perbaikan';
      } else if (selectedStatus === 'belum_dicek') {
        matchStatus = !apar.lastInspectionDate?.startsWith(currentMonth);
      }

      return matchSearch && matchType && matchStatus;
    });
  }, [userApars, searchQuery, selectedType, selectedStatus, currentMonth]);

  const hasActiveFilters = searchQuery || selectedType !== 'all' || selectedStatus !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedStatus('all');
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Daftar APAR {currentUser?.rigId}
          </h1>
          <p className="text-xs text-slate-500">
            Total {userApars.length} tabung terdaftar di area operasional Rig ini.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingApar(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all btn-tactile shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Tambah APAR</span>
        </button>
      </div>

      {/* Kontrol Pencarian & Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        {/* Input Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode aset (APAR-...), serial number, atau lokasi..."
            className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Baris Filter: Tipe APAR & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {/* Filter Tipe APAR */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Tipe APAR:
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
            >
              <option value="all">Semua Tipe APAR ({userApars.length})</option>
              {aparTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Status Tabung:
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
            >
              <option value="all">Semua Status</option>
              <option value="layak">Kondisi Layak Operasi</option>
              <option value="perlu_perbaikan">Perlu Perbaikan</option>
              <option value="belum_dicek">Belum Dicek Bulan Ini</option>
            </select>
          </div>
        </div>

        {/* Status Filter Aktif */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Menampilkan <strong>{filteredApars.length}</strong> dari {userApars.length} APAR
            </span>
            <button
              onClick={resetFilters}
              className="text-red-600 font-semibold hover:underline flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Grid Kartu APAR */}
      {filteredApars.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 p-6">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">Tidak ada APAR yang cocok</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Tidak ditemukan tabung yang sesuai dengan kata kunci atau filter yang Anda pilih.
          </p>
          <button
            onClick={resetFilters}
            className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Bersihkan Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredApars.map((apar) => (
            <AparCard
              key={apar.id}
              apar={apar}
              onEdit={(target) => {
                setEditingApar(target);
                setIsModalOpen(true);
              }}
              onDelete={(target) => handleDeleteApar(target)}
            />
          ))}
        </div>
      )}

      {/* Modal CRUD Tambah & Edit APAR */}
      <AparFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingApar(null);
        }}
        editData={editingApar}
      />
    </div>
  );
}
