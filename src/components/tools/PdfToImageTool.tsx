import React, { useState } from 'react';
import {
  Download,
  Archive,
  Trash2,
  Plus,
  FileText,
  Check,
} from 'lucide-react';
import type { Language } from '../../lib/i18n';
import { Dropzone } from '../Dropzone';
import { ProcessingModal } from '../ProcessingModal';
import { renderPdfPageToDataUrl, getPdfPageCount } from '../../lib/pdfjs-init';
import { formatBytes, downloadDataUrl, downloadZip } from '../../lib/file-utils';

interface PdfToImageToolProps {
  lang: Language;
  onGoHome?: () => void;
}

interface PdfFileItem {
  id: string;
  file: File;
  pageCount?: number;
}

interface ConvertedPageItem {
  fileId: string;
  fileName: string;
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

export const PdfToImageTool: React.FC<PdfToImageToolProps> = ({ lang }) => {
  const [files, setFiles] = useState<PdfFileItem[]>([]);
  const [imageFormat, setImageFormat] = useState<'image/jpeg' | 'image/png'>('image/jpeg');
  const [qualityDpi, setQualityDpi] = useState<'standard' | 'high'>('standard');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [convertedPages, setConvertedPages] = useState<ConvertedPageItem[]>([]);
  const [activeFileFilter, setActiveFileFilter] = useState<string>('all');

  const handleFilesSelected = async (newFiles: File[]) => {
    const validPdfFiles = newFiles.filter((f) => f.name.toLowerCase().endsWith('.pdf'));
    if (validPdfFiles.length === 0) return;

    const items: PdfFileItem[] = validPdfFiles.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
    }));

    setFiles((prev) => [...prev, ...items]);

    // Load page counts asynchronously for each file
    for (const item of items) {
      try {
        const count = await getPdfPageCount(item.file);
        setFiles((current) =>
          current.map((f) => (f.id === item.id ? { ...f, pageCount: count } : f))
        );
      } catch {
        // fallback
      }
    }
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const totalPagesCount = files.reduce((acc, curr) => acc + (curr.pageCount || 1), 0);

  const handleConvertBatch = async () => {
    if (files.length === 0) return;

    try {
      setIsProcessing(true);
      setProgress(2);
      setStatusText('กำลังเตรียมประมวลผลไฟล์...');

      const scale = qualityDpi === 'high' ? 2.0 : 1.3;
      const quality = imageFormat === 'image/jpeg' ? 0.9 : 1.0;
      const results: ConvertedPageItem[] = [];

      let processedPagesGlobal = 0;
      const totalGlobalPages = totalPagesCount || files.length;

      for (let fIdx = 0; fIdx < files.length; fIdx++) {
        const item = files[fIdx];
        const numPages = item.pageCount || (await getPdfPageCount(item.file));

        for (let p = 1; p <= numPages; p++) {
          processedPagesGlobal++;
          const percent = Math.min(
            98,
            Math.round((processedPagesGlobal / totalGlobalPages) * 100)
          );
          setProgress(percent);
          setStatusText(
            `ไฟล์ ${fIdx + 1}/${files.length} (${item.file.name}) · หน้า ${p}/${numPages}`
          );

          const res = await renderPdfPageToDataUrl(
            item.file,
            p,
            scale,
            imageFormat,
            quality
          );

          results.push({
            fileId: item.id,
            fileName: item.file.name,
            pageNumber: p,
            dataUrl: res.dataUrl,
            width: res.width,
            height: res.height,
          });
        }
      }

      setConvertedPages(results);
      setProgress(100);
      setStatusText('เสร็จสมบูรณ์');
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการแปลงไฟล์ PDF เป็นรูปภาพ');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadSingle = (page: ConvertedPageItem) => {
    const baseName = page.fileName.replace(/\.[^/.]+$/, '');
    const ext = imageFormat === 'image/jpeg' ? 'jpg' : 'png';
    downloadDataUrl(page.dataUrl, `${baseName}_page_${page.pageNumber}.${ext}`);
  };

  const handleDownloadSingleFileZip = async (fileItem: PdfFileItem) => {
    const pagesForFile = convertedPages.filter((p) => p.fileId === fileItem.id);
    if (pagesForFile.length === 0) return;

    setIsProcessing(true);
    setProgress(50);
    setStatusText(`กำลังสร้าง ZIP สำหรับ ${fileItem.file.name}...`);

    const baseName = fileItem.file.name.replace(/\.[^/.]+$/, '');
    const ext = imageFormat === 'image/jpeg' ? 'jpg' : 'png';

    const zipEntries = pagesForFile.map((p) => {
      const base64Data = p.dataUrl.split(',')[1];
      return {
        name: `${baseName}_page_${p.pageNumber}.${ext}`,
        data: Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0)),
      };
    });

    await downloadZip(zipEntries, `${baseName}_images.zip`);
    setIsProcessing(false);
  };

  const handleDownloadAllZip = async () => {
    if (convertedPages.length === 0) return;

    setIsProcessing(true);
    setProgress(30);
    setStatusText('กำลังสร้างไฟล์ ZIP...');

    const ext = imageFormat === 'image/jpeg' ? 'jpg' : 'png';
    const nameCountMap = new Map<string, number>();

    const zipEntries = convertedPages.map((p) => {
      const baseName = p.fileName.replace(/\.[^/.]+$/, '');
      const base64Data = p.dataUrl.split(',')[1];
      
      // Flat structure: Put all images directly at root (no subfolders)
      let fileName = `${baseName}_page_${p.pageNumber}.${ext}`;
      if (nameCountMap.has(fileName)) {
        const count = nameCountMap.get(fileName)! + 1;
        nameCountMap.set(fileName, count);
        fileName = `${baseName}_${p.fileId.slice(0, 4)}_page_${p.pageNumber}.${ext}`;
      } else {
        nameCountMap.set(fileName, 1);
      }

      return {
        name: fileName,
        data: Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0)),
      };
    });

    const zipName =
      files.length === 1
        ? `${files[0].file.name.replace(/\.[^/.]+$/, '')}_images.zip`
        : `images_${files.length}_files.zip`;

    await downloadZip(zipEntries, zipName, (p) => {
      setProgress(Math.round(30 + p * 0.7));
    });

    setIsProcessing(false);
  };

  const handleReset = () => {
    setFiles([]);
    setConvertedPages([]);
    setProgress(0);
    setActiveFileFilter('all');
  };

  // Filtered displayed pages
  const displayedPages =
    activeFileFilter === 'all'
      ? convertedPages
      : convertedPages.filter((p) => p.fileId === activeFileFilter);

  if (files.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-4">
        <Dropzone
          lang={lang}
          accept=".pdf"
          multiple={true}
          onFilesSelected={handleFilesSelected}
          title="เลือกไฟล์ PDF (รองรับหลายไฟล์พร้อมกัน)"
          hint="ลากไฟล์ PDF มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์ แปลงทุกหน้าเป็นภาพ JPG หรือ PNG"
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {isProcessing && (
        <ProcessingModal lang={lang} progress={progress} statusText={statusText} />
      )}

      {convertedPages.length === 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: File List */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <div className="font-medium text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <span>เลือกแล้ว {files.length} ไฟล์</span>
                <span className="font-mono text-slate-400">·</span>
                <span className="font-mono text-slate-500">{totalPagesCount} หน้า</span>
              </div>

              <div className="flex items-center space-x-1.5">
                <label className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition">
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มไฟล์</span>
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) handleFilesSelected(Array.from(e.target.files));
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={handleReset}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                  title="ล้างทั้งหมด"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* List of Files */}
            <div className="space-y-2">
              {files.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-mono flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                        {item.file.name}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {formatBytes(item.file.size)}
                        {item.pageCount !== undefined && ` · ${item.pageCount} หน้า`}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveFile(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 transition shrink-0 ml-2"
                    title="ลบออก"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right 1 Col: Settings & Action */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 h-fit space-y-5 text-xs">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
              การตั้งค่า
            </h3>

            {/* Format selection */}
            <div className="space-y-1.5">
              <label className="block text-slate-500 dark:text-slate-400 font-medium">
                รูปแบบไฟล์
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setImageFormat('image/jpeg')}
                  className={`py-2 px-3 rounded-lg border font-medium transition ${
                    imageFormat === 'image/jpeg'
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  JPG
                </button>
                <button
                  type="button"
                  onClick={() => setImageFormat('image/png')}
                  className={`py-2 px-3 rounded-lg border font-medium transition ${
                    imageFormat === 'image/png'
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  PNG
                </button>
              </div>
            </div>

            {/* Quality selection */}
            <div className="space-y-1.5">
              <label className="block text-slate-500 dark:text-slate-400 font-medium">
                ความละเอียด
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setQualityDpi('standard')}
                  className={`py-2 px-3 rounded-lg border font-medium transition ${
                    qualityDpi === 'standard'
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  150 DPI
                </button>
                <button
                  type="button"
                  onClick={() => setQualityDpi('high')}
                  className={`py-2 px-3 rounded-lg border font-medium transition ${
                    qualityDpi === 'high'
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  300 DPI
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 space-y-1 font-mono text-[11px]">
              <div className="flex justify-between">
                <span>Files</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{files.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total pages</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{totalPagesCount}</span>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleConvertBatch}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold text-sm shadow-lg shadow-rose-500/25 transition transform hover:scale-[1.01]"
            >
              แปลงเป็นรูปภาพ ({files.length} ไฟล์)
            </button>
          </div>
        </div>
      ) : (
        /* Results View */
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Check className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  แปลงเสร็จสิ้น {files.length} ไฟล์ ({convertedPages.length} รูป)
                </h3>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                onClick={handleReset}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition"
              >
                แปลงชุดใหม่
              </button>
              <button
                onClick={handleDownloadAllZip}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 py-2 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-semibold shadow-md shadow-rose-500/20 transition transform hover:scale-[1.01]"
              >
                <Archive className="w-4 h-4" />
                <span>ดาวน์โหลด ZIP ทั้งหมด</span>
              </button>
            </div>
          </div>

          {/* Filter Pills for Multiple Files */}
          {files.length > 1 && (
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setActiveFileFilter('all')}
                className={`px-3 py-1 rounded-lg font-medium shrink-0 transition ${
                  activeFileFilter === 'all'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                ทั้งหมด ({convertedPages.length})
              </button>

              {files.map((f) => {
                const count = convertedPages.filter((p) => p.fileId === f.id).length;
                return (
                  <div key={f.id} className="flex items-center shrink-0 space-x-1">
                    <button
                      onClick={() => setActiveFileFilter(f.id)}
                      className={`px-3 py-1 rounded-l-lg font-medium transition ${
                        activeFileFilter === f.id
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {f.file.name} ({count})
                    </button>
                    <button
                      onClick={() => handleDownloadSingleFileZip(f)}
                      className="px-2 py-1 rounded-r-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-l-0 border-slate-200 dark:border-slate-800"
                      title={`ดาวน์โหลด ZIP เฉพาะ ${f.file.name}`}
                    >
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Grid of Converted Images */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {displayedPages.map((page, idx) => (
              <div
                key={`${page.fileId}-${page.pageNumber}-${idx}`}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between"
              >
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 flex items-center justify-center relative">
                  <img
                    src={page.dataUrl}
                    alt={`${page.fileName} Page ${page.pageNumber}`}
                    className="max-h-52 object-contain rounded"
                  />
                  {files.length > 1 && (
                    <span className="absolute top-2 left-2 max-w-[80%] truncate text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900/80 text-white backdrop-blur-sm">
                      {page.fileName}
                    </span>
                  )}
                </div>

                <div className="p-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-500">
                    p. {page.pageNumber}
                  </span>
                  <button
                    onClick={() => handleDownloadSingle(page)}
                    className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="ดาวน์โหลดรูปนี้"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
