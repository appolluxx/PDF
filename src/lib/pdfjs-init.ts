import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

/**
 * Loads a PDF document from an ArrayBuffer or File
 */
export async function loadPdfDocument(source: ArrayBuffer | Uint8Array | File) {
  let data: ArrayBuffer;
  if (source instanceof File) {
    data = await source.arrayBuffer();
  } else if (source instanceof Uint8Array) {
    data = source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength) as ArrayBuffer;
  } else {
    data = source;
  }

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(data),
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@' + pdfjsLib.version + '/cmaps/',
    cMapPacked: true,
  });

  return await loadingTask.promise;
}

/**
 * Get page count of a PDF
 */
export async function getPdfPageCount(source: ArrayBuffer | Uint8Array | File): Promise<number> {
  const doc = await loadPdfDocument(source);
  return doc.numPages;
}

/**
 * Render a specific PDF page to a Data URL (JPEG / PNG)
 */
export async function renderPdfPageToDataUrl(
  source: ArrayBuffer | Uint8Array | File,
  pageNumber: number,
  scale = 1.0,
  format: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality = 0.85
): Promise<{ dataUrl: string; width: number; height: number }> {
  const doc = await loadPdfDocument(source);
  const page = await doc.getPage(pageNumber);

  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  if (!context) {
    throw new Error('Canvas 2D context not supported');
  }

  // Set white background for transparent PDFs when rendering to JPEG
  if (format === 'image/jpeg') {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  await page.render({
    canvasContext: context,
    viewport: viewport,
    canvas: canvas,
  } as any).promise;

  const dataUrl = canvas.toDataURL(format, quality);
  return {
    dataUrl,
    width: viewport.width,
    height: viewport.height,
  };
}

/**
 * Render thumbnails for all pages of a PDF
 */
export async function renderAllPageThumbnails(
  source: ArrayBuffer | Uint8Array | File,
  maxPages = 50,
  thumbnailWidth = 200
): Promise<string[]> {
  const doc = await loadPdfDocument(source);
  const total = Math.min(doc.numPages, maxPages);
  const thumbnails: string[] = [];

  for (let i = 1; i <= total; i++) {
    const page = await doc.getPage(i);
    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const scale = thumbnailWidth / unscaledViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    if (context) {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: context, viewport, canvas } as any).promise;
      thumbnails.push(canvas.toDataURL('image/jpeg', 0.8));
    }
  }

  return thumbnails;
}

/**
 * Extract text from all pages of a PDF
 */
export async function extractPdfTextWithPages(
  source: ArrayBuffer | Uint8Array | File
): Promise<{ pageNumber: number; text: string }[]> {
  const doc = await loadPdfDocument(source);
  const results: { pageNumber: number; text: string }[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items
      .filter((item): item is { str: string; dir: string; width: number; height: number; transform: number[]; fontName: string; hasEOL: boolean } => 'str' in item)
      .map(item => item.str);
    results.push({
      pageNumber: i,
      text: strings.join(' ').replace(/\s+/g, ' ').trim(),
    });
  }

  return results;
}
