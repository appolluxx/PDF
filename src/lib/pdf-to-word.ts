import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  TabStopType,
  ImageRun,
  Packer,
} from 'docx';
import { loadPdfDocument } from './pdfjs-init';

export type AlignmentTypeValue = (typeof AlignmentType)[keyof typeof AlignmentType];
export type TabStopTypeValue = (typeof TabStopType)[keyof typeof TabStopType];

export interface ExtractedRun {
  text: string;
  fontSize: number; // in points (pt)
  fontFamily: string;
  isBold: boolean;
  isItalic: boolean;
  color?: string;
}

export interface ExtractedLine {
  runs: ExtractedRun[];
  text: string;
  minX: number;
  maxX: number;
  baseY: number;
  maxFontSize: number;
  alignment: AlignmentTypeValue;
  indentPt: number;
  spaceAfterPt: number;
  tabStops?: { type: TabStopTypeValue; position: number }[];
}

export interface ExtractedImage {
  id: string;
  x: number;
  topY: number;
  width: number;
  height: number;
  dataUrl: string;
  bytes: Uint8Array;
  alignment: AlignmentTypeValue;
  indentPt: number;
}

export type PageBlock =
  | { type: 'line'; line: ExtractedLine; y: number }
  | { type: 'image'; image: ExtractedImage; y: number };

export interface ExtractedPage {
  pageNumber: number;
  width: number;
  height: number;
  blocks: PageBlock[];
  lines: ExtractedLine[];
  images: ExtractedImage[];
  isScanned?: boolean;
  previewImageUrl?: string;
}

export interface StructuredDocumentResult {
  pages: ExtractedPage[];
  primaryFontFamily: string;
  fontSizesUsed: number[];
  blob: Blob;
}

/**
 * Clean and normalize font family names for cross-platform Word compatibility
 */
export function resolveFontFamily(rawName: string, sampleText: string): string {
  const clean = (rawName || '').replace(/^[A-Z]{6}\+/, '').trim();
  const lower = clean.toLowerCase();

  // Thai font detection
  if (lower.includes('sarabun')) return 'TH Sarabun New';
  if (lower.includes('angsana')) return 'Angsana New';
  if (lower.includes('cordia')) return 'Cordia New';
  if (lower.includes('browallia')) return 'Browallia New';
  if (lower.includes('prompt')) return 'Prompt';
  if (lower.includes('kanit')) return 'Kanit';
  if (lower.includes('mitr')) return 'Mitr';
  if (lower.includes('chakra')) return 'Chakra Petch';
  if (lower.includes('tahoma')) return 'Tahoma';

  // Common international fonts
  if (lower.includes('times')) return 'Times New Roman';
  if (lower.includes('helvetica') || lower.includes('arial')) return 'Arial';
  if (lower.includes('courier')) return 'Courier New';
  if (lower.includes('georgia')) return 'Georgia';
  if (lower.includes('verdana')) return 'Verdana';
  if (lower.includes('calibri')) return 'Calibri';
  if (lower.includes('cambria')) return 'Cambria';
  if (lower.includes('garamond')) return 'Garamond';

  // If text contains Thai characters and font is generic
  if (/[\u0E00-\u0E7F]/.test(sampleText)) {
    return 'TH Sarabun New';
  }

  return clean && clean !== 'sans-serif' && clean !== 'serif' && clean !== 'monospace'
    ? clean
    : 'Calibri';
}

const isThaiCombining = (ch: string) => /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/.test(ch);
const isPunctuation = (ch: string) => /[.,:;!?\)\]\}]/.test(ch);

interface RawTextItem {
  str: string;
  x: number;
  y: number; // top-down
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  isBold: boolean;
  isItalic: boolean;
}

/**
 * Multiply 2D affine transform matrices [a, b, c, d, e, f]
 */
function multiplyMatrix(m1: number[], m2: number[]): number[] {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ];
}

/**
 * Convert PDF.js image object to PNG data URL and raw bytes
 */
function convertPdfImageToData(imgObj: any): { dataUrl: string; bytes: Uint8Array } | null {
  try {
    if (!imgObj) return null;
    const width = imgObj.width;
    const height = imgObj.height;
    if (!width || !height || width < 4 || height < 4) return null;

    if (typeof document === 'undefined') return null;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (typeof ImageBitmap !== 'undefined' && imgObj instanceof ImageBitmap) {
      ctx.drawImage(imgObj, 0, 0);
    } else if (imgObj.data) {
      const imgData = ctx.createImageData(width, height);
      const dest = imgData.data;
      const src = imgObj.data;

      if (imgObj.kind === 3 || imgObj.kind === undefined) {
        // RGBA
        if (src.length === width * height * 4) {
          dest.set(src);
        } else {
          for (let i = 0, j = 0; i < src.length && j < dest.length; i += 4, j += 4) {
            dest[j] = src[i];
            dest[j + 1] = src[i + 1];
            dest[j + 2] = src[i + 2];
            dest[j + 3] = src[i + 3];
          }
        }
      } else if (imgObj.kind === 2) {
        // RGB -> RGBA
        for (let i = 0, j = 0; i < src.length && j < dest.length; i += 3, j += 4) {
          dest[j] = src[i];
          dest[j + 1] = src[i + 1];
          dest[j + 2] = src[i + 2];
          dest[j + 3] = 255;
        }
      } else if (imgObj.kind === 1) {
        // Grayscale -> RGBA
        for (let i = 0, j = 0; i < src.length && j < dest.length; i++, j += 4) {
          const gray = src[i];
          dest[j] = gray;
          dest[j + 1] = gray;
          dest[j + 2] = gray;
          dest[j + 3] = 255;
        }
      } else {
        dest.set(src.subarray(0, dest.length));
      }

      ctx.putImageData(imgData, 0, 0);
    } else {
      return null;
    }

    const dataUrl = canvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];
    if (!base64) return null;

    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return { dataUrl, bytes };
  } catch (err) {
    console.warn('Failed to convert PDF image object:', err);
    return null;
  }
}

/**
 * Merge raw items on the same horizontal line into styled TextRuns and TabStops
 */
function mergeLineItems(items: RawTextItem[]) {
  const runs: ExtractedRun[] = [];
  const tabStops: { type: TabStopTypeValue; position: number }[] = [];
  let currentRun: ExtractedRun | null = null;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    let sep = '';

    if (i > 0) {
      const prev = items[i - 1];
      const gap = item.x - (prev.x + prev.width);
      const isCombining = isThaiCombining(item.str[0]);
      const isPunct = isPunctuation(item.str[0]);
      const prevEndedSpace = prev.str.endsWith(' ');
      const currStartedSpace = item.str.startsWith(' ');

      // Large horizontal gap indicates intentional column / table alignment
      if (gap > item.fontSize * 2.2) {
        sep = '\t';
        tabStops.push({
          type: TabStopType.LEFT,
          position: Math.min(Math.round(item.x * 20), 18000),
        });
      } else if (!isCombining && !isPunct && !prevEndedSpace && !currStartedSpace && gap > item.fontSize * 0.22) {
        sep = ' ';
      }
    }

    const canMerge =
      currentRun !== null &&
      sep !== '\t' &&
      Math.abs(currentRun.fontSize - item.fontSize) < 0.5 &&
      currentRun.fontFamily === item.fontFamily &&
      currentRun.isBold === item.isBold &&
      currentRun.isItalic === item.isItalic;

    if (canMerge && currentRun) {
      currentRun.text += sep + item.str;
    } else {
      currentRun = {
        text: (sep === '\t' ? '\t' : '') + item.str,
        fontSize: item.fontSize,
        fontFamily: item.fontFamily,
        isBold: item.isBold,
        isItalic: item.isItalic,
      };
      runs.push(currentRun);
    }
  }

  return { runs, tabStops };
}

/**
 * Extract vector logos, emblems (such as Thai Garuda 'ตราครุฑ'), letterheads, and stamps
 * directly from the rendered high-resolution canvas by masking out all text bounding boxes.
 */
function detectCanvasGraphics(
  renderCanvas: HTMLCanvasElement,
  scale: number,
  rawItems: RawTextItem[],
  pageWidth: number,
  _pageHeight: number,
  existingImages: ExtractedImage[],
  pageNum: number
): ExtractedImage[] {
  const newImages: ExtractedImage[] = [];
  try {
    const w = renderCanvas.width;
    const h = renderCanvas.height;
    const pageCenter = pageWidth / 2;

    // 1. Create a mask canvas to erase all text regions
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = w;
    maskCanvas.height = h;
    const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
    if (!maskCtx) return newImages;

    maskCtx.drawImage(renderCanvas, 0, 0);

    // Erase all text areas by painting pure white with a small safety margin
    maskCtx.fillStyle = '#ffffff';
    for (const item of rawItems) {
      const tx = Math.max(0, Math.floor((item.x - 3) * scale));
      const ty = Math.max(0, Math.floor((item.y - item.height - 3) * scale));
      const tw = Math.ceil((item.width + 6) * scale);
      const th = Math.ceil((item.height + 6) * scale);
      maskCtx.fillRect(tx, ty, tw, th);
    }

    const imgData = maskCtx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // Check if pixel is non-white (graphic or logo color)
    const isNonWhite = (idx: number) => {
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];
      return a > 60 && (r < 235 || g < 235 || b < 235);
    };

    // 2. Scan rows for graphic bands
    const rowCounts = new Int32Array(h);
    for (let y = 0; y < h; y++) {
      let count = 0;
      const rowOffset = y * w * 4;
      for (let x = 0; x < w; x += 2) {
        if (isNonWhite(rowOffset + (x << 2))) {
          count++;
        }
      }
      rowCounts[y] = count;
    }

    // 3. Identify contiguous vertical bands with graphics
    // Minimum band height of 10pt (20px at 2x) automatically excludes thin horizontal divider lines
    const minBandHeight = Math.round(10 * scale);
    let inBand = false;
    let bandStartY = 0;
    const bands: { minY: number; maxY: number }[] = [];

    for (let y = 0; y < h; y++) {
      if (rowCounts[y] >= 3) {
        if (!inBand) {
          inBand = true;
          bandStartY = y;
        }
      } else {
        if (inBand) {
          inBand = false;
          if (y - bandStartY >= minBandHeight) {
            bands.push({ minY: bandStartY, maxY: y });
          }
        }
      }
    }
    if (inBand && h - bandStartY >= minBandHeight) {
      bands.push({ minY: bandStartY, maxY: h });
    }

    // 4. For each graphic band, determine horizontal bounds and crop
    for (const band of bands) {
      let minX = w;
      let maxX = 0;
      let totalCount = 0;

      for (let y = band.minY; y <= band.maxY; y++) {
        const rowOffset = y * w * 4;
        for (let x = 0; x < w; x++) {
          if (isNonWhite(rowOffset + (x << 2))) {
            totalCount++;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
          }
        }
      }

      const bandW = maxX - minX;
      const bandH = band.maxY - band.minY;
      const density = totalCount / (Math.max(1, (bandW * bandH) / 4));

      // Filter:
      // - Must have substantial graphic pixels (totalCount > 50)
      // - Minimum dimension >= 12pt (24px at 2x)
      // - Not full-page background/border (bandW <= w * 0.96)
      // - Density >= 0.03 to avoid empty rectangle frames
      if (
        totalCount > 50 &&
        bandW >= 12 * scale &&
        bandH >= 12 * scale &&
        bandW <= w * 0.96 &&
        density >= 0.03
      ) {
        const pdfX = minX / scale;
        const pdfY = band.minY / scale;
        const pdfW = bandW / scale;
        const pdfH = bandH / scale;

        // Check if already captured by raster image from operator list
        const alreadyCovered = existingImages.some(
          (img) =>
            Math.abs(img.topY - pdfY) < 30 &&
            Math.abs(img.x - pdfX) < 40 &&
            Math.abs(img.width - pdfW) < 40
        );

        if (!alreadyCovered) {
          const pad = Math.round(2 * scale);
          const cropX = Math.max(0, minX - pad);
          const cropY = Math.max(0, band.minY - pad);
          const cropW = Math.min(w - cropX, bandW + pad * 2);
          const cropH = Math.min(h - cropY, bandH + pad * 2);

          const cropCanvas = document.createElement('canvas');
          cropCanvas.width = cropW;
          cropCanvas.height = cropH;
          const cropCtx = cropCanvas.getContext('2d');
          if (cropCtx) {
            // Draw from original high-res canvas (with all vector details and crisp colors)
            cropCtx.drawImage(
              renderCanvas,
              cropX, cropY, cropW, cropH,
              0, 0, cropW, cropH
            );

            const dataUrl = cropCanvas.toDataURL('image/png');
            const base64 = dataUrl.split(',')[1];
            if (base64) {
              const binaryString = atob(base64);
              const bytes = new Uint8Array(binaryString.length);
              for (let k = 0; k < binaryString.length; k++) {
                bytes[k] = binaryString.charCodeAt(k);
              }

              const imgCenter = pdfX + pdfW / 2;
              let alignment: AlignmentTypeValue = AlignmentType.LEFT;
              let indentPt = 0;

              if (Math.abs(imgCenter - pageCenter) < 45 && pdfW < pageWidth * 0.8) {
                alignment = AlignmentType.CENTER;
              } else if (pageWidth - (pdfX + pdfW) < 70 && pdfX > pageWidth * 0.35) {
                alignment = AlignmentType.RIGHT;
              } else {
                alignment = AlignmentType.LEFT;
                if (pdfX > 50) indentPt = Math.max(0, pdfX - 54);
              }

              newImages.push({
                id: `logo_graphic_${pageNum}_${Math.round(pdfY)}`,
                x: pdfX,
                topY: pdfY,
                width: pdfW,
                height: pdfH,
                dataUrl,
                bytes,
                alignment,
                indentPt,
              });
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('Canvas graphic detection encountered an issue:', err);
  }

  return newImages;
}

/**
 * Extract structured layout, fonts, sizes, alignments, and embedded logos/images from PDF pages
 */
export async function extractStructuredPdf(
  source: ArrayBuffer | Uint8Array | File,
  onProgress?: (progress: number, status: string) => void
): Promise<ExtractedPage[]> {
  const doc = await loadPdfDocument(source);
  const totalPages = doc.numPages;
  const extractedPages: ExtractedPage[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    if (onProgress) {
      onProgress(
        Math.round(((pageNum - 1) / totalPages) * 60),
        `กำลังวิเคราะห์ข้อความและรูปภาพ/โลโก้ หน้า ${pageNum}/${totalPages}...`
      );
    }

    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const pageWidth = viewport.width;
    const pageHeight = viewport.height;
    const pageCenter = pageWidth / 2;

    // High-resolution page rendering (scale: 2.0 = 144 DPI)
    // Resolves all images in page.objs and renders all vector curves (Garuda emblem, logos, lines)
    const renderScale = 2.0;
    const renderViewport = page.getViewport({ scale: renderScale });
    const renderCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    let renderCtx: CanvasRenderingContext2D | null = null;
    if (renderCanvas) {
      renderCanvas.width = renderViewport.width;
      renderCanvas.height = renderViewport.height;
      renderCtx = renderCanvas.getContext('2d', { willReadFrequently: true });
      if (renderCtx) {
        renderCtx.fillStyle = '#ffffff';
        renderCtx.fillRect(0, 0, renderCanvas.width, renderCanvas.height);
        try {
          await page.render({
            canvasContext: renderCtx,
            viewport: renderViewport,
            canvas: renderCanvas,
          } as any).promise;
        } catch (e) {
          console.warn('Canvas render warning for page', pageNum, e);
        }
      }
    }

    // 1. Extract Embedded Images / Logos using Operator List & Matrix Tracking
    const extractedImages: ExtractedImage[] = [];
    try {
      const ops = await page.getOperatorList();
      let currentMatrix = [1, 0, 0, 1, 0, 0];
      const matrixStack: number[][] = [];

      for (let i = 0; i < ops.fnArray.length; i++) {
        const fn = ops.fnArray[i];
        const args = ops.argsArray[i];

        // 10 = save, 11 = restore, 12 = transform, 85 = paintImageXObject, 86 = paintInlineImageXObject
        if (fn === 10) {
          matrixStack.push([...currentMatrix]);
        } else if (fn === 11) {
          if (matrixStack.length > 0) currentMatrix = matrixStack.pop()!;
        } else if (fn === 12 && Array.isArray(args)) {
          currentMatrix = multiplyMatrix(currentMatrix, args);
        } else if (fn === 85 || fn === 86) {
          const imgId = args[0];
          const x = currentMatrix[4];
          const y = currentMatrix[5];
          const width = Math.hypot(currentMatrix[0], currentMatrix[1]);
          const height = Math.hypot(currentMatrix[2], currentMatrix[3]);
          const topY = pageHeight - (y + height);

          // Filter out tiny 1x1 dummy pixels or out-of-bounds artefacts
          if (width >= 8 && height >= 8 && width <= pageWidth * 1.2 && height <= pageHeight * 1.2) {
            let imgObj: any = null;
            try {
              if ((page as any).objs?.has?.(imgId)) {
                imgObj = (page as any).objs.get(imgId);
              } else {
                imgObj = await new Promise<any>((resolve) => {
                  let done = false;
                  (page as any).objs.get(imgId, (res: any) => {
                    if (!done) {
                      done = true;
                      resolve(res);
                    }
                  });
                  setTimeout(() => {
                    if (!done) {
                      done = true;
                      resolve(null);
                    }
                  }, 400);
                });
              }
            } catch (err) {
              console.warn('Could not get image object:', imgId, err);
            }

            if (imgObj) {
              const converted = convertPdfImageToData(imgObj);
              if (converted) {
                const imgCenter = x + width / 2;
                let alignment: AlignmentTypeValue = AlignmentType.LEFT;
                let indentPt = 0;

                if (Math.abs(imgCenter - pageCenter) < 35 && width < pageWidth * 0.8) {
                  alignment = AlignmentType.CENTER;
                } else if (pageWidth - (x + width) < 60 && x > pageWidth * 0.4) {
                  alignment = AlignmentType.RIGHT;
                } else {
                  alignment = AlignmentType.LEFT;
                  if (x > 50) indentPt = Math.max(0, x - 50);
                }

                extractedImages.push({
                  id: imgId,
                  x,
                  topY: Math.max(0, topY),
                  width,
                  height,
                  dataUrl: converted.dataUrl,
                  bytes: converted.bytes,
                  alignment,
                  indentPt,
                });
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('Could not extract images from operator list:', e);
    }

    // 2. Extract Text Items
    const textContent = await page.getTextContent();
    const rawItems: RawTextItem[] = [];

    for (const item of textContent.items) {
      if (!('str' in item) || !item.str || item.str.trim() === '') continue;

      const fontSize = Math.hypot(item.transform[0], item.transform[1]) || item.height || 12;
      const x = item.transform[4];
      const y = pageHeight - item.transform[5]; // Top-down coordinate

      const fontObj = (page as any).commonObjs?.has?.(item.fontName)
        ? (page as any).commonObjs.get(item.fontName)
        : null;
      const fontStyle = textContent.styles?.[item.fontName];

      const rawFontName =
        fontObj?.loadedName ||
        fontObj?.name ||
        fontStyle?.fontFamily ||
        item.fontName ||
        '';

      const isBold = Boolean(
        fontObj?.bold ||
        fontObj?.black ||
        /bold|black|heavy|w[6-9]|700|800|900/i.test(item.fontName) ||
        /bold|black|heavy|w[6-9]|700|800|900/i.test(rawFontName)
      );

      const isItalic = Boolean(
        fontObj?.italic ||
        /italic|oblique|slant/i.test(item.fontName) ||
        /italic|oblique|slant/i.test(rawFontName)
      );

      const fontFamily = resolveFontFamily(rawFontName, item.str);

      rawItems.push({
        str: item.str,
        x,
        y,
        width: item.width,
        height: item.height || fontSize,
        fontSize: Math.round(fontSize * 10) / 10,
        fontFamily,
        isBold,
        isItalic,
      });
    }

    // Check if page is entirely scanned (0 text items and 0 extracted images)
    if (rawItems.length === 0 && extractedImages.length === 0) {
      let previewImageUrl: string | undefined;
      if (renderCanvas) {
        try {
          previewImageUrl = renderCanvas.toDataURL('image/jpeg', 0.88);
        } catch (e) {
          console.warn('Could not export scanned page image:', e);
        }
      }

      extractedPages.push({
        pageNumber: pageNum,
        width: pageWidth,
        height: pageHeight,
        blocks: [],
        lines: [],
        images: [],
        isScanned: true,
        previewImageUrl,
      });
      continue;
    }

    // 3. Detect and extract vector logos (Garuda emblem 'ตราครุฑ', corporate emblems, letterheads)
    if (renderCanvas) {
      const vectorGraphics = detectCanvasGraphics(
        renderCanvas,
        renderScale,
        rawItems,
        pageWidth,
        pageHeight,
        extractedImages,
        pageNum
      );
      extractedImages.push(...vectorGraphics);
    }

    // Sort items top-to-bottom, then left-to-right
    rawItems.sort((a, b) => a.y - b.y || a.x - b.x);

    // Group items into visual lines
    const lineGroups: RawTextItem[][] = [];
    let currentLine: RawTextItem[] = [];
    let currentBaseY = 0;

    for (const item of rawItems) {
      if (currentLine.length === 0) {
        currentLine.push(item);
        currentBaseY = item.y;
      } else {
        const diffY = Math.abs(item.y - currentBaseY);
        const threshold = Math.max(item.fontSize, currentLine[0].fontSize) * 0.45;
        if (diffY <= threshold) {
          currentLine.push(item);
          currentBaseY =
            (currentBaseY * (currentLine.length - 1) + item.y) / currentLine.length;
        } else {
          lineGroups.push(currentLine);
          currentLine = [item];
          currentBaseY = item.y;
        }
      }
    }
    if (currentLine.length > 0) lineGroups.push(currentLine);

    // Process each line
    const lines: ExtractedLine[] = [];

    for (let i = 0; i < lineGroups.length; i++) {
      const group = lineGroups[i];
      group.sort((a, b) => a.x - b.x);

      const minX = group[0].x;
      const lastItem = group[group.length - 1];
      const maxX = lastItem.x + lastItem.width;
      const lineWidth = maxX - minX;
      const lineCenter = (minX + maxX) / 2;
      const maxFontSize = Math.max(...group.map((item) => item.fontSize));
      const baseY = group[0].y;

      const { runs, tabStops } = mergeLineItems(group);
      const lineText = runs.map((r) => r.text).join('');

      let alignment: AlignmentTypeValue = AlignmentType.LEFT;
      let indentPt = 0;

      const isCentered =
        Math.abs(lineCenter - pageCenter) < 28 &&
        minX > 45 &&
        pageWidth - maxX > 45 &&
        lineWidth < pageWidth * 0.85;

      const isRight =
        pageWidth - maxX < 65 &&
        minX > pageWidth * 0.4 &&
        lineWidth < pageWidth * 0.65;

      if (isCentered) {
        alignment = AlignmentType.CENTER;
      } else if (isRight) {
        alignment = AlignmentType.RIGHT;
      } else {
        alignment = AlignmentType.LEFT;
        if (minX > 72 && lineWidth < pageWidth * 0.88) {
          indentPt = Math.max(0, minX - 54);
        }
      }

      let spaceAfterPt = 2;
      if (i < lineGroups.length - 1) {
        const nextBaseY = lineGroups[i + 1][0].y;
        const deltaY = nextBaseY - baseY;
        if (deltaY > maxFontSize * 1.5) {
          spaceAfterPt = Math.min(Math.max(4, deltaY - maxFontSize * 1.2), 36);
        }
      }

      lines.push({
        runs,
        text: lineText,
        minX,
        maxX,
        baseY,
        maxFontSize,
        alignment,
        indentPt,
        spaceAfterPt,
        tabStops: tabStops.length > 0 ? tabStops : undefined,
      });
    }

    // 3. Assemble unified page blocks: interleave lines and images by Y position
    const blocks: PageBlock[] = [];
    lines.forEach((line) => blocks.push({ type: 'line', line, y: line.baseY }));
    extractedImages.forEach((image) => blocks.push({ type: 'image', image, y: image.topY }));

    // Sort by vertical position on the page
    blocks.sort((a, b) => a.y - b.y);

    extractedPages.push({
      pageNumber: pageNum,
      width: pageWidth,
      height: pageHeight,
      blocks,
      lines,
      images: extractedImages,
      isScanned: false,
    });
  }

  return extractedPages;
}

/**
 * Check whether two consecutive lines should naturally merge into a flowing Word paragraph
 */
function shouldMergeLines(line1: ExtractedLine, line2: ExtractedLine, pageWidth: number): boolean {
  if (line1.tabStops?.length || line2.tabStops?.length) return false;
  if (line1.alignment !== AlignmentType.LEFT || line2.alignment !== AlignmentType.LEFT) return false;
  if (Math.abs(line1.maxFontSize - line2.maxFontSize) > 0.8) return false;
  if (line2.indentPt > line1.indentPt + 10) return false;

  const deltaY = line2.baseY - line1.baseY;
  const expectedLineHeight = line1.maxFontSize * 1.25;
  if (deltaY < line1.maxFontSize * 0.7 || deltaY > expectedLineHeight * 1.6) return false;

  if (line1.maxX - line1.minX < pageWidth * 0.45) return false;

  const firstWord = line2.text.trim().split(/\s+/)[0] || '';
  if (/^([•\-\*]|[\d]+[\.\)]|[a-zA-Z][\.\)]|\([0-9a-zA-Z]+\))$/.test(firstWord)) return false;

  return true;
}

/**
 * Convert structured pages into a high-fidelity Microsoft Word (.docx) Document
 */
export async function generateWordDocument(
  pages: ExtractedPage[],
  onProgress?: (progress: number, status: string) => void
): Promise<Blob> {
  const sections = [];
  const fontUsageCount: Record<string, number> = {};
  const fontSizesSet = new Set<number>();

  for (let pIdx = 0; pIdx < pages.length; pIdx++) {
    const page = pages[pIdx];
    if (onProgress) {
      onProgress(
        60 + Math.round(((pIdx + 1) / pages.length) * 30),
        `กำลังสร้างหน้าเอกสาร Word หน้าที่ ${page.pageNumber}/${pages.length}...`
      );
    }

    const paragraphs: Paragraph[] = [];

    if (page.isScanned && page.previewImageUrl) {
      try {
        const res = await fetch(page.previewImageUrl);
        const buffer = await res.arrayBuffer();
        paragraphs.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                type: 'jpg',
                data: new Uint8Array(buffer),
                transformation: {
                  width: Math.min(560, Math.round(page.width * 0.9)),
                  height: Math.min(780, Math.round(page.height * 0.9)),
                },
              }),
            ],
          })
        );
      } catch (err) {
        console.warn('Failed to embed scanned image into docx:', err);
      }
    } else {
      // Process unified blocks (images + lines in reading order)
      let bIdx = 0;
      while (bIdx < page.blocks.length) {
        const block = page.blocks[bIdx];

        if (block.type === 'image') {
          // Embed Logo / Image
          paragraphs.push(
            new Paragraph({
              alignment: block.image.alignment,
              indent:
                block.image.indentPt > 0 && block.image.alignment === AlignmentType.LEFT
                  ? { left: Math.round(block.image.indentPt * 20) }
                  : undefined,
              spacing: { after: 180, before: 60 },
              children: [
                new ImageRun({
                  type: 'png',
                  data: block.image.bytes,
                  transformation: {
                    width: Math.min(560, Math.round(block.image.width)),
                    height: Math.min(760, Math.round(block.image.height)),
                  },
                }),
              ],
            })
          );
          bIdx++;
        } else {
          // Process Line(s)
          const line = block.line;

          line.runs.forEach((r) => {
            fontUsageCount[r.fontFamily] = (fontUsageCount[r.fontFamily] || 0) + 1;
            fontSizesSet.add(Math.round(r.fontSize));
          });

          // Check if consecutive lines can flow as one paragraph
          const mergedLines: ExtractedLine[] = [line];
          while (
            bIdx + 1 < page.blocks.length &&
            page.blocks[bIdx + 1].type === 'line' &&
            shouldMergeLines(
              mergedLines[mergedLines.length - 1],
              (page.blocks[bIdx + 1] as any).line,
              page.width
            )
          ) {
            mergedLines.push((page.blocks[bIdx + 1] as any).line);
            bIdx++;
          }

          const docxRuns: TextRun[] = [];

          mergedLines.forEach((mLine, mIdx) => {
            if (mIdx > 0) {
              docxRuns.push(new TextRun({ text: ' ' }));
            }

            mLine.runs.forEach((r) => {
              const runHalfPoints = Math.max(14, Math.round(r.fontSize * 2));
              docxRuns.push(
                new TextRun({
                  text: r.text,
                  size: runHalfPoints,
                  sizeComplexScript: runHalfPoints,
                  bold: r.isBold,
                  boldComplexScript: r.isBold,
                  italics: r.isItalic,
                  italicsComplexScript: r.isItalic,
                  font: {
                    name: r.fontFamily,
                    ascii: r.fontFamily,
                    cs: r.fontFamily,
                    hAnsi: r.fontFamily,
                    eastAsia: r.fontFamily,
                  },
                  color: '111827',
                })
              );
            });
          });

          const lastLine = mergedLines[mergedLines.length - 1];
          const spaceAfterTwips = Math.round(lastLine.spaceAfterPt * 20);

          paragraphs.push(
            new Paragraph({
              alignment: line.alignment,
              indent:
                line.indentPt > 0 && line.alignment === AlignmentType.LEFT
                  ? { left: Math.round(line.indentPt * 20) }
                  : undefined,
              tabStops: line.tabStops,
              spacing: {
                after: spaceAfterTwips,
                line: Math.round(Math.max(12, line.maxFontSize) * 1.3 * 20),
              },
              children: docxRuns,
            })
          );

          bIdx++;
        }
      }
    }

    // Add Word Section matching PDF page dimensions
    sections.push({
      properties: {
        page: {
          size: {
            width: Math.round(page.width * 20),
            height: Math.round(page.height * 20),
          },
          margin: {
            top: 720,
            right: 720,
            bottom: 720,
            left: 720,
          },
        },
      },
      children: paragraphs.length > 0 ? paragraphs : [new Paragraph('')],
    });
  }

  const primaryFont =
    Object.entries(fontUsageCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'TH Sarabun New';

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: {
              name: primaryFont,
              ascii: primaryFont,
              cs: primaryFont,
              hAnsi: primaryFont,
              eastAsia: primaryFont,
            },
            size: 32, // 16pt (standard Thai Sarabun font size)
            sizeComplexScript: 32,
            color: '111827',
          },
          paragraph: {
            spacing: { line: 280, after: 80 },
          },
        },
      },
    },
    sections,
  });

  if (onProgress) onProgress(95, 'กำลังบรรจุไฟล์ Word (.docx)...');
  const blob = await Packer.toBlob(doc);
  if (onProgress) onProgress(100, 'แปลงเป็น Word สำเร็จ!');

  return blob;
}

/**
 * End-to-end converter from PDF to structured Word .docx with embedded images
 */
export async function convertPdfToWordStructured(
  file: File,
  onProgress?: (progress: number, status: string) => void
): Promise<{
  blob: Blob;
  pages: ExtractedPage[];
  primaryFont: string;
  fontSizes: number[];
}> {
  if (onProgress) onProgress(10, 'กำลังเปิดไฟล์และวิเคราะห์เอกสาร PDF...');
  const pages = await extractStructuredPdf(file, onProgress);

  const fontUsageCount: Record<string, number> = {};
  const fontSizesSet = new Set<number>();

  pages.forEach((p) => {
    p.lines.forEach((l) => {
      l.runs.forEach((r) => {
        fontUsageCount[r.fontFamily] = (fontUsageCount[r.fontFamily] || 0) + 1;
        fontSizesSet.add(Math.round(r.fontSize));
      });
    });
  });

  const primaryFont =
    Object.entries(fontUsageCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'TH Sarabun New';
  const fontSizes = Array.from(fontSizesSet).sort((a, b) => a - b);

  const blob = await generateWordDocument(pages, onProgress);

  return {
    blob,
    pages,
    primaryFont,
    fontSizes,
  };
}
