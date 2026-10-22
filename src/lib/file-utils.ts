import saveAs from 'file-saver';
import JSZip from 'jszip';

/**
 * Format bytes to human readable format (KB, MB, GB)
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Trigger browser file download
 */
export function downloadBlob(blob: Blob, filename: string) {
  saveAs(blob, filename);
}

/**
 * Trigger download from Uint8Array
 */
export function downloadUint8Array(data: Uint8Array, filename: string, mimeType = 'application/pdf') {
  const blob = new Blob([data.buffer as ArrayBuffer], { type: mimeType });
  saveAs(blob, filename);
}

/**
 * Trigger download from base64/data URL
 */
export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Bundle multiple files into a ZIP archive and trigger download
 */
export async function downloadZip(
  files: { name: string; data: Blob | Uint8Array | string }[],
  zipFilename: string,
  onProgress?: (percent: number) => void
) {
  const zip = new JSZip();

  files.forEach((f) => {
    zip.file(f.name, f.data);
  });

  const content = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      if (onProgress) {
        onProgress(Math.round(metadata.percent));
      }
    }
  );

  saveAs(content, zipFilename);
}

/**
 * Parse page ranges string like "1-3, 5, 7-10" into 0-indexed page number array
 */
export function parsePageRange(rangeStr: string, totalPages: number): number[] {
  const cleaned = rangeStr.trim();
  if (!cleaned) return Array.from({ length: totalPages }, (_, i) => i);

  const pages = new Set<number>();
  const parts = cleaned.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const from = Math.max(1, Math.min(start, end));
        const to = Math.min(totalPages, Math.max(start, end));
        for (let i = from; i <= to; i++) {
          pages.add(i - 1);
        }
      }
    } else {
      const page = parseInt(trimmed, 10);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        pages.add(page - 1);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

/**
 * Strip file extension
 */
export function getBaseFilename(filename: string): string {
  return filename.replace(/\.[^/.]+$/, '');
}
