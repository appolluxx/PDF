import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { loadPdfDocument } from './pdfjs-init';
import {
  convertPdfToWordStructured,
  extractStructuredPdf,
  generateWordDocument,
  type ExtractedPage,
  type ExtractedLine,
  type ExtractedRun,
} from './pdf-to-word';
import type { ImageToPdfOptions, PageNumberOptions, WatermarkOptions } from '../types';

export {
  convertPdfToWordStructured,
  extractStructuredPdf,
  generateWordDocument,
  type ExtractedPage,
  type ExtractedLine,
  type ExtractedRun,
};

/**
 * Merge multiple PDF files into one
 */
export async function mergePdfFiles(
  files: File[],
  onProgress?: (progress: number, status: string) => void
): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  const totalFiles = files.length;

  for (let i = 0; i < totalFiles; i++) {
    const file = files[i];
    if (onProgress) {
      onProgress(
        Math.round((i / totalFiles) * 90),
        `กำลังรวมไฟล์ ${i + 1}/${totalFiles}: ${file.name}`
      );
    }

    const fileBytes = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());

    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  if (onProgress) onProgress(95, 'กำลังสร้างไฟล์ฉบับสมบูรณ์...');
  const mergedPdfBytes = await mergedPdf.save();
  if (onProgress) onProgress(100, 'เสร็จสมบูรณ์!');
  return mergedPdfBytes;
}

/**
 * Split PDF by selected page indices (0-indexed)
 */
export async function splitPdf(
  file: File,
  pageIndices: number[],
  onProgress?: (progress: number, status: string) => void
): Promise<Uint8Array> {
  if (onProgress) onProgress(20, 'กำลังเปิดไฟล์ PDF...');
  const fileBytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(fileBytes);

  const newPdf = await PDFDocument.create();
  if (onProgress) onProgress(50, 'กำลังคัดลอกหน้าที่เลือก...');
  const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);

  copiedPages.forEach((page) => newPdf.addPage(page));

  if (onProgress) onProgress(85, 'กำลังบันทึกไฟล์...');
  const resultBytes = await newPdf.save();
  if (onProgress) onProgress(100, 'เสร็จสมบูรณ์!');
  return resultBytes;
}

/**
 * Extract all pages as separate PDFs
 */
export async function extractAllPagesAsPdfs(
  file: File,
  onProgress?: (progress: number, status: string) => void
): Promise<{ name: string; data: Uint8Array }[]> {
  const fileBytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(fileBytes);
  const totalPages = pdfDoc.getPageCount();
  const results: { name: string; data: Uint8Array }[] = [];
  const baseName = file.name.replace(/\.[^/.]+$/, '');

  for (let i = 0; i < totalPages; i++) {
    if (onProgress) {
      onProgress(
        Math.round(((i + 1) / totalPages) * 100),
        `กำลังแยกหน้า ${i + 1} จาก ${totalPages}...`
      );
    }
    const singlePdf = await PDFDocument.create();
    const [page] = await singlePdf.copyPages(pdfDoc, [i]);
    singlePdf.addPage(page);
    const bytes = await singlePdf.save();
    results.push({
      name: `${baseName}_page_${i + 1}.pdf`,
      data: bytes,
    });
  }

  return results;
}

/**
 * Compress PDF by re-rendering pages with optimized image compression
 */
export async function compressPdf(
  file: File,
  level: 'extreme' | 'recommended' | 'low' = 'recommended',
  onProgress?: (progress: number, status: string) => void
): Promise<Uint8Array> {
  const fileBytes = await file.arrayBuffer();
  const pdfjsDoc = await loadPdfDocument(fileBytes);
  const totalPages = pdfjsDoc.numPages;

  let scale = 1.0;
  let quality = 0.72;

  if (level === 'extreme') {
    scale = 0.85;
    quality = 0.52;
  } else if (level === 'low') {
    scale = 1.35;
    quality = 0.85;
  }

  const compressedPdf = await PDFDocument.create();

  for (let i = 1; i <= totalPages; i++) {
    if (onProgress) {
      onProgress(
        Math.round(((i - 1) / totalPages) * 90),
        `กำลังบีบอัดหน้า ${i}/${totalPages}...`
      );
    }

    const page = await pdfjsDoc.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;

      // Convert to JPEG blob
      const imgDataUrl = canvas.toDataURL('image/jpeg', quality);
      const imgBytes = await fetch(imgDataUrl).then((res) => res.arrayBuffer());
      const embeddedImg = await compressedPdf.embedJpg(imgBytes);

      // Add page with original viewport dimensions
      const originalViewport = page.getViewport({ scale: 1.0 });
      const newPage = compressedPdf.addPage([originalViewport.width, originalViewport.height]);
      newPage.drawImage(embeddedImg, {
        x: 0,
        y: 0,
        width: originalViewport.width,
        height: originalViewport.height,
      });
    }
  }

  if (onProgress) onProgress(95, 'กำลังบันทึกไฟล์ PDF ที่บีบอัด...');
  const resultBytes = await compressedPdf.save({ useObjectStreams: true });
  if (onProgress) onProgress(100, 'บีบอัดเสร็จเรียบร้อย!');
  return resultBytes;
}

/**
 * Convert images to a single PDF
 */
export async function convertImagesToPdf(
  imageFiles: File[],
  options: ImageToPdfOptions,
  onProgress?: (progress: number, status: string) => void
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const total = imageFiles.length;

  // A4 dimensions in points (72 points = 1 inch)
  const A4_WIDTH = 595.28;
  const A4_HEIGHT = 841.89;
  const LETTER_WIDTH = 612.0;
  const LETTER_HEIGHT = 792.0;

  for (let i = 0; i < total; i++) {
    const file = imageFiles[i];
    if (onProgress) {
      onProgress(
        Math.round(((i + 1) / total) * 90),
        `กำลังประมวลผลรูปภาพ ${i + 1}/${total}: ${file.name}`
      );
    }

    const imgBytes = await file.arrayBuffer();
    let embeddedImg;

    if (file.type === 'image/jpeg' || file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')) {
      embeddedImg = await pdfDoc.embedJpg(imgBytes);
    } else if (file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')) {
      embeddedImg = await pdfDoc.embedPng(imgBytes);
    } else {
      // Fallback for WebP, GIF or other formats via canvas
      const img = new Image();
      const url = URL.createObjectURL(file);
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        const convertedBytes = await fetch(dataUrl).then((r) => r.arrayBuffer());
        embeddedImg = await pdfDoc.embedJpg(convertedBytes);
      } else {
        continue;
      }
    }

    const imgWidth = embeddedImg.width;
    const imgHeight = embeddedImg.height;

    let margin = 0;
    if (options.margin === 'small') margin = 20;
    if (options.margin === 'large') margin = 40;

    let pageWidth = A4_WIDTH;
    let pageHeight = A4_HEIGHT;

    if (options.pageSize === 'letter') {
      pageWidth = LETTER_WIDTH;
      pageHeight = LETTER_HEIGHT;
    } else if (options.pageSize === 'fit') {
      pageWidth = imgWidth + margin * 2;
      pageHeight = imgHeight + margin * 2;
    }

    // Handle Orientation
    if (options.orientation === 'landscape' && pageWidth < pageHeight) {
      const temp = pageWidth;
      pageWidth = pageHeight;
      pageHeight = temp;
    } else if (options.orientation === 'auto' && imgWidth > imgHeight && pageWidth < pageHeight) {
      const temp = pageWidth;
      pageWidth = pageHeight;
      pageHeight = temp;
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Scale image to fit within page margins
    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2;
    const scaleFactor = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);

    const drawWidth = imgWidth * scaleFactor;
    const drawHeight = imgHeight * scaleFactor;
    const x = margin + (availableWidth - drawWidth) / 2;
    const y = margin + (availableHeight - drawHeight) / 2;

    page.drawImage(embeddedImg, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
    });
  }

  if (onProgress) onProgress(95, 'กำลังสร้างไฟล์ PDF...');
  const resultBytes = await pdfDoc.save();
  if (onProgress) onProgress(100, 'เสร็จสมบูรณ์!');
  return resultBytes;
}

/**
 * Rotate PDF pages
 */
export async function rotatePdfPages(
  file: File,
  rotations: { [pageIndex: number]: number },
  onProgress?: (progress: number, status: string) => void
): Promise<Uint8Array> {
  if (onProgress) onProgress(20, 'กำลังเปิดไฟล์ PDF...');
  const fileBytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(fileBytes);
  const pages = pdfDoc.getPages();

  if (onProgress) onProgress(60, 'กำลังหมุนหน้ากระดาษ...');
  pages.forEach((page, index) => {
    const additionalRotation = rotations[index] || 0;
    if (additionalRotation !== 0) {
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + additionalRotation) % 360));
    }
  });

  if (onProgress) onProgress(90, 'กำลังบันทึกเอกสาร...');
  const resultBytes = await pdfDoc.save();
  if (onProgress) onProgress(100, 'หมุนหน้าเสร็จสมบูรณ์!');
  return resultBytes;
}

/**
 * Reorder and delete pages
 */
export async function organizePdfPages(
  file: File,
  pageOrder: { originalIndex: number; rotation: number }[],
  onProgress?: (progress: number, status: string) => void
): Promise<Uint8Array> {
  if (onProgress) onProgress(20, 'กำลังอ่านไฟล์ PDF...');
  const fileBytes = await file.arrayBuffer();
  const sourcePdf = await PDFDocument.load(fileBytes);
  const newPdf = await PDFDocument.create();

  if (onProgress) onProgress(50, 'กำลังจัดเรียงหน้าตามต้องการ...');
  for (let i = 0; i < pageOrder.length; i++) {
    const item = pageOrder[i];
    const [copiedPage] = await newPdf.copyPages(sourcePdf, [item.originalIndex]);
    if (item.rotation) {
      const curr = copiedPage.getRotation().angle;
      copiedPage.setRotation(degrees((curr + item.rotation) % 360));
    }
    newPdf.addPage(copiedPage);
  }

  if (onProgress) onProgress(90, 'กำลังส่งออกเอกสาร...');
  const resultBytes = await newPdf.save();
  if (onProgress) onProgress(100, 'จัดเรียงเสร็จสมบูรณ์!');
  return resultBytes;
}

/**
 * Add Watermark to PDF
 */
export async function addWatermarkToPdf(
  file: File,
  options: WatermarkOptions,
  onProgress?: (progress: number, status: string) => void
): Promise<Uint8Array> {
  if (onProgress) onProgress(20, 'กำลังเปิดไฟล์...');
  const fileBytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(fileBytes);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  let colorRgb = rgb(0.8, 0.2, 0.2); // default red
  if (options.color === 'gray') colorRgb = rgb(0.5, 0.5, 0.5);
  if (options.color === 'blue') colorRgb = rgb(0.1, 0.3, 0.8);
  if (options.color === 'black') colorRgb = rgb(0, 0, 0);

  const total = pages.length;
  for (let i = 0; i < total; i++) {
    if (onProgress) {
      onProgress(Math.round(((i + 1) / total) * 80), `กำลังใส่ลายน้ำหน้าที่ ${i + 1}/${total}...`);
    }
    const page = pages[i];
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(options.text, options.fontSize);
    const textHeight = font.heightAtSize(options.fontSize);

    let x = (width - textWidth) / 2;
    let y = (height - textHeight) / 2;
    let rot = degrees(options.rotation);

    if (options.position === 'diagonal') {
      rot = degrees(45);
      x = (width - textWidth) / 2;
      y = (height - textHeight) / 2;
    } else if (options.position === 'bottom-right') {
      x = width - textWidth - 30;
      y = 30;
      rot = degrees(0);
    } else if (options.position === 'bottom-left') {
      x = 30;
      y = 30;
      rot = degrees(0);
    } else if (options.position === 'top-right') {
      x = width - textWidth - 30;
      y = height - textHeight - 30;
      rot = degrees(0);
    } else if (options.position === 'top-left') {
      x = 30;
      y = height - textHeight - 30;
      rot = degrees(0);
    }

    page.drawText(options.text, {
      x,
      y,
      size: options.fontSize,
      font,
      color: colorRgb,
      opacity: options.opacity,
      rotate: rot,
    });
  }

  if (onProgress) onProgress(95, 'กำลังบันทึกไฟล์...');
  const resultBytes = await pdfDoc.save();
  if (onProgress) onProgress(100, 'เสร็จสมบูรณ์!');
  return resultBytes;
}

/**
 * Add Page Numbers to PDF
 */
export async function addPageNumbersToPdf(
  file: File,
  options: PageNumberOptions,
  onProgress?: (progress: number, status: string) => void
): Promise<Uint8Array> {
  if (onProgress) onProgress(20, 'กำลังเปิดไฟล์...');
  const fileBytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(fileBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  const total = pages.length;

  for (let i = 0; i < total; i++) {
    if (onProgress) {
      onProgress(Math.round(((i + 1) / total) * 80), `กำลังใส่เลขหน้าที่ ${i + 1}/${total}...`);
    }
    const page = pages[i];
    const { width, height } = page.getSize();

    let text = `${i + 1}`;
    if (options.format === 'page-x-of-y') {
      text = `Page ${i + 1} of ${total}`;
    } else if (options.format === 'thai-page-x-of-y') {
      text = `หน้า ${i + 1} จาก ${total}`;
    }

    const textWidth = font.widthOfTextAtSize(text, options.fontSize);
    let x = (width - textWidth) / 2;
    let y = options.margin;

    if (options.position === 'bottom-left') {
      x = options.margin;
      y = options.margin;
    } else if (options.position === 'bottom-right') {
      x = width - textWidth - options.margin;
      y = options.margin;
    } else if (options.position === 'bottom-center') {
      x = (width - textWidth) / 2;
      y = options.margin;
    } else if (options.position === 'top-center') {
      x = (width - textWidth) / 2;
      y = height - options.margin - options.fontSize;
    } else if (options.position === 'top-right') {
      x = width - textWidth - options.margin;
      y = height - options.margin - options.fontSize;
    }

    page.drawText(text, {
      x,
      y,
      size: options.fontSize,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
  }

  if (onProgress) onProgress(95, 'กำลังบันทึกไฟล์...');
  const resultBytes = await pdfDoc.save();
  if (onProgress) onProgress(100, 'เสร็จเรียบร้อย!');
  return resultBytes;
}

/**
 * Convert PDF to structured Word .docx file with exact fonts, sizes, and layout preservation
 */
export async function convertPdfToWord(
  file: File,
  onProgress?: (progress: number, status: string) => void
): Promise<Blob> {
  const result = await convertPdfToWordStructured(file, onProgress);
  return result.blob;
}
