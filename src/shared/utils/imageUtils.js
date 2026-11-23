/**
 * Utilitas Kompresi Gambar Menggunakan HTML5 Canvas
 * Mengubah file gambar menjadi string base64 terkompresi (Max width 800px, JPEG quality 0.7)
 * Tujuannya agar muat disimpan dengan aman di localStorage (< 200KB - 300KB).
 */

export function compressImageFile(file, maxWidth = 800, maxHeight = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('Tidak ada file gambar'));
    }

    // Jika bukan tipe gambar
    if (!file.type.startsWith('image/')) {
      return reject(new Error('File yang diunggah bukan gambar valid'));
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Hitung rasio aspek proporsional
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        // Gambar background putih agar transparan jadi putih
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Kompres ke JPEG dengan kualitas 0.7
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };

      img.onerror = (err) => reject(new Error('Gagal memuat gambar: ' + err.message));
    };

    reader.onerror = (err) => reject(new Error('Gagal membaca file: ' + err.message));
  });
}
