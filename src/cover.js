const MAX_DIMENSION = 480;
const JPEG_QUALITY = 0.72;

export function processCoverFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file chosen.'));
      return;
    }
    if (!file.type || !file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file (JPG, PNG, WebP...).'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not read that image file.'));
      img.onload = () => {
        try {
          let w = img.width;
          let h = img.height;
          if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
            const scale = MAX_DIMENSION / Math.max(w, h);
            w = Math.round(w * scale);
            h = Math.round(h * scale);
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
          if (!dataUrl || dataUrl.length < 100) {
            reject(new Error('Could not process the image.'));
            return;
          }
          resolve(dataUrl);
        } catch {
          reject(new Error('Could not process the image.'));
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
