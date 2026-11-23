import Swal from 'sweetalert2';

/**
 * Helper Terpusat SweetAlert2 dengan Standar Desain K3 / HSE Lapangan
 * Disesuaikan khusus untuk ergonomi HP (mobile-first) dan desktop:
 * - Ukuran kompak proporsional di layar HP (<640px)
 * - Bebas pergeseran scrollbar (scrollbarPadding: false)
 * - z-index tinggi di atas Bottom Navigation Bar (z-[99999])
 */

const getResponsiveWidth = () => {
  if (typeof window !== 'undefined' && window.innerWidth < 640) {
    return '88vw';
  }
  return '420px';
};

const baseSwal = Swal.mixin({
  customClass: {
    popup: 'hse-swal-popup',
    title: 'hse-swal-title',
    htmlContainer: 'hse-swal-html',
    confirmButton: 'hse-swal-btn hse-swal-confirm',
    cancelButton: 'hse-swal-btn hse-swal-cancel',
    actions: 'hse-swal-actions'
  },
  buttonsStyling: false,
  scrollbarPadding: false,
  allowOutsideClick: false,
  showClass: {
    popup: 'swal2-show animate-in fade-in zoom-in-95 duration-150'
  },
  hideClass: {
    popup: 'swal2-hide animate-out fade-out zoom-out-95 duration-100'
  }
});

/**
 * 1. Popup Sukses
 */
export const showSuccess = (title, text = '', confirmButtonText = 'Oke, Lanjutkan') => {
  return baseSwal.fire({
    icon: 'success',
    title: title,
    text: text,
    width: getResponsiveWidth(),
    confirmButtonText: confirmButtonText,
    iconColor: '#16A34A',
    customClass: {
      popup: 'hse-swal-popup border-emerald-200',
      title: 'hse-swal-title text-emerald-950',
      htmlContainer: 'hse-swal-html text-slate-600',
      confirmButton: 'hse-swal-btn bg-emerald-600 hover:bg-emerald-700 text-white'
    }
  });
};

/**
 * 2. Popup Error / Validasi Gagal
 */
export const showError = (title, text = '', confirmButtonText = 'Saya Mengerti') => {
  return baseSwal.fire({
    icon: 'error',
    title: title,
    text: text,
    width: getResponsiveWidth(),
    confirmButtonText: confirmButtonText,
    iconColor: '#DC2626',
    customClass: {
      popup: 'hse-swal-popup border-rose-200',
      title: 'hse-swal-title text-rose-950',
      htmlContainer: 'hse-swal-html text-slate-700',
      confirmButton: 'hse-swal-btn bg-slate-900 hover:bg-slate-800 text-white'
    }
  });
};

/**
 * 3. Dialog Konfirmasi (Ya / Batal)
 * Mengembalikan Promise<boolean>: true jika Ya, false jika Batal
 */
export const showConfirm = async ({
  title,
  text = '',
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  isDanger = false,
  icon = 'warning'
}) => {
  const result = await baseSwal.fire({
    icon: icon,
    title: title,
    text: text,
    width: getResponsiveWidth(),
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    iconColor: isDanger ? '#DC2626' : '#D97706',
    customClass: {
      popup: `hse-swal-popup ${isDanger ? 'border-rose-200' : 'border-amber-200'}`,
      title: 'hse-swal-title text-slate-900',
      htmlContainer: 'hse-swal-html text-slate-600',
      confirmButton: `hse-swal-btn ${
        isDanger
          ? 'bg-red-600 hover:bg-red-700 text-white'
          : 'bg-slate-900 hover:bg-slate-800 text-white'
      }`,
      cancelButton: 'hse-swal-btn bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
    }
  });

  return result.isConfirmed;
};

/**
 * 4. Toast Ringkas (Pojok Layar / Top Mobile)
 */
export const showToast = (icon = 'success', title = '', timer = 2500) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  const toastMixin = Swal.mixin({
    toast: true,
    position: isMobile ? 'top' : 'top-end',
    showConfirmButton: false,
    timer: timer,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
    customClass: {
      popup: 'hse-swal-toast shadow-lg border border-slate-200/80 bg-white rounded-xl'
    }
  });

  return toastMixin.fire({
    icon: icon,
    title: title
  });
};
