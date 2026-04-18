/**
 * imageCompressor.js — Client-side image compression utility
 * Resizes to max 1024px + JPEG quality 0.82 → target < 800KB
 * Maintains aspect ratio, preserves accuracy for skin tone detection
 */

const MAX_DIMENSION = 1024; // px (longest side)
const QUALITY = 0.82;       // JPEG quality — good balance
const MAX_SIZE_KB = 800;    // target max file size

/**
 * Compress an image File/Blob before upload.
 * @param {File} file - original image file
 * @returns {Promise<File>} compressed file (same name/type)
 */
export async function compressImage(file) {
  if (!file || !file.type.startsWith('image/')) return file;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;

          // Scale down only if needed
          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            if (width > height) {
              height = Math.round((height / width) * MAX_DIMENSION);
              width = MAX_DIMENSION;
            } else {
              width = Math.round((width / height) * MAX_DIMENSION);
              height = MAX_DIMENSION;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          // White background for transparency handling
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Progressive quality reduction if still too large
          let quality = QUALITY;
          const tryCompress = () => {
            canvas.toBlob((blob) => {
              if (!blob) { resolve(file); return; }

              const sizeKB = blob.size / 1024;
              if (sizeKB > MAX_SIZE_KB && quality > 0.5) {
                quality -= 0.1;
                tryCompress();
                return;
              }

              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });

              const savings = Math.round((1 - compressedFile.size / file.size) * 100);
              console.log(
                `[ImageCompressor] ${(file.size / 1024).toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB (${savings}% saved, ${width}×${height}px)`
              );

              resolve(compressedFile);
            }, 'image/jpeg', quality);
          };

          tryCompress();
        } catch (err) {
          console.warn('[ImageCompressor] Failed, using original:', err);
          resolve(file); // fallback to original
        }
      };
      img.onerror = () => resolve(file);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

/**
 * Get human-readable file size
 * @param {number} bytes
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
