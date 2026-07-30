/**
 * Utility kompresi gambar otomatis client-side untuk Naskara Academic Studio.
 * Jika ukuran berkas melebihi 2MB, gambar di-resize proporsional (max 2400px)
 * dan di-kompresi dengan canvas (quality ~0.88) tanpa mengurangi kualitas visual.
 */
export async function compressImageIfExceeds2MB(file: File, maxSizeBytes = 2 * 1024 * 1024): Promise<File> {
  // Hanya proses jika file adalah gambar dan ukurannya > 2MB
  if (!file.type.startsWith('image/') || file.size <= maxSizeBytes) {
    return file
  }

  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let { width, height } = img

      // Batasi dimensi maksimum 2400px (Sangat cukup & tajam untuk cetak A4 300 DPI)
      const MAX_DIMENSION = 2400
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width)
          width = MAX_DIMENSION
        } else {
          width = Math.round((width * MAX_DIMENSION) / height)
          height = MAX_DIMENSION
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(file)
        return
      }

      // Smooth scaling filter
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, width, height)

      // Pertahankan PNG jika transparan, atau ubah ke JPEG 0.88 untuk foto
      const outputMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      const quality = 0.88

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            // Jika hasil kompresi ternyata lebih besar, kembalikan file asli
            resolve(file)
            return
          }

          // Buat File baru dengan nama asli
          const compressedFile = new File([blob], file.name, {
            type: blob.type,
            lastModified: Date.now(),
          })
          resolve(compressedFile)
        },
        outputMime,
        quality,
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      // Jika gagal memuat image, fallback ke file asli
      resolve(file)
    }

    img.src = objectUrl
  })
}
