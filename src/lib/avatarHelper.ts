// Avatar Helper Utilities
// Generates clean SVG Data URIs for avatars and handles video canvas frame capture

export function generateSvgAvatar(name: string, bgHex: string = '#4F46E5', fgHex: string = '#FFFFFF'): string {
  const initials = (name || 'MP').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
    <rect width="150" height="150" fill="${bgHex}" rx="32"/>
    <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="${fgHex}" font-family="sans-serif" font-size="54" font-weight="900">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function captureFrameFromVideo(videoEl: HTMLVideoElement | null): string | null {
  if (!videoEl) return null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (ctx && videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
      // Crop center square
      const minDim = Math.min(videoEl.videoWidth, videoEl.videoHeight);
      const startX = (videoEl.videoWidth - minDim) / 2;
      const startY = (videoEl.videoHeight - minDim) / 2;
      ctx.drawImage(videoEl, startX, startY, minDim, minDim, 0, 0, 300, 300);
      return canvas.toDataURL('image/jpeg', 0.85);
    }
  } catch (e) {
    console.warn('Frame capture error:', e);
  }
  return null;
}
