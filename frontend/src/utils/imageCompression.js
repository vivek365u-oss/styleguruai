/**
 * Image Compression Utility
 * Compresses images to 300KB-700KB range with good quality
 * Max width: 1024px, JPEG quality: 70-80%
 */

export const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Resize if larger than 1024px
        if (width > 1024) {
          height = (height * 1024) / width;
          width = 1024;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress with quality 75
        canvas.toBlob(
          (blob) => {
            // Check if size is in target range (300KB - 700KB)
            let finalBlob = blob;
            let quality = 0.75;
            
            // If blob is still too large, reduce quality
            if (blob.size > 700 * 1024) {
              // Recursively compress with lower quality
              canvas.toBlob((smallerBlob) => {
                resolve(new File([smallerBlob], file.name, { type: 'image/jpeg' }));
              }, 'image/jpeg', 0.65);
            } else if (blob.size < 300 * 1024) {
              // If too small, increase quality slightly
              canvas.toBlob((largerBlob) => {
                resolve(new File([largerBlob], file.name, { type: 'image/jpeg' }));
              }, 'image/jpeg', 0.82);
            } else {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Get compressed image size in KB
 */
export const getImageSizeKB = (file) => {
  return (file.size / 1024).toFixed(2);
};

/**
 * Validate image file
 */
export const validateImageFile = (file) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload JPEG, PNG, or WebP image.');
  }
  if (file.size > 50 * 1024 * 1024) {
    // Max before compression: 50MB
    throw new Error('Image file is too large. Maximum size: 50MB.');
  }
  return true;
};
