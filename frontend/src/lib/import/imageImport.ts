/** Read a local file as a data URL (base64) for Yjs persistence */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function loadImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('Failed to decode image'));
    img.src = src;
  });
}

const MAX_DISPLAY_WIDTH = 480;

export function fitImageDisplaySize(
  naturalWidth: number,
  naturalHeight: number,
  maxWidth = MAX_DISPLAY_WIDTH,
): { width: number; height: number } {
  if (naturalWidth <= 0 || naturalHeight <= 0) {
    return { width: maxWidth, height: maxWidth * 0.75 };
  }
  const scale = Math.min(1, maxWidth / naturalWidth);
  return {
    width: Math.round(naturalWidth * scale),
    height: Math.round(naturalHeight * scale),
  };
}
