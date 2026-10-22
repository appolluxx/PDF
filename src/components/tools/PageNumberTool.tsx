import React, { useState } from 'react';
import type { Language } from '../../lib/i18n';
import { Dropzone } from '../Dropzone';
import { ProcessingModal } from '../ProcessingModal';
import { ResultSuccess } from '../ResultSuccess';
import { addPageNumbersToPdf } from '../../lib/pdf-service';
import { getPdfPageCount, renderPdfPageToDataUrl } from '../../lib/pdfjs-init';
import { downloadUint8Array } from '../../lib/file-utils';
import type { PageNumberOptions } from '../../types';

interface PageNumberToolProps {
  lang: Language;
  onGoHome: () => void;
}

export const PageNumberTool: React.FC<PageNumberToolProps> = ({ lang, onGoHome }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null);
  const [options, setOptions] = useState<PageNumberOptions>({
    position: 'bottom-center',
    format: 'thai-page-x-of-y',
    fontSize: 12,
    margin: 30,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);

  const handleFileSelected = async (files: File[]) => {
    const selected = files[0];
    if (!selected) return;

    setFile(selected);
    try {
      const count = await getPdfPageCount(selected);
      setPageCount(count);
      const res = await renderPdfPageToDataUrl(selected, 1, 0.8);
      setPreviewThumbnail(res.dataUrl);
    } catch {
      // ignore
    }
  };

  const handleApply = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setProgress(10);

      const bytes = await addPageNumbersToPdf(file, options, (p, s) => {
        setProgress(p);
        setStatusText(s);
      });

      setResultBytes(bytes);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการใส่เลขหน้า');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!file || !resultBytes) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    downloadUint8Array(resultBytes, `${baseName}_numbered.pdf`);
  };

  const handleReset = () => {
    setFile(null);
    setPreviewThumbnail(null);
    setResultBytes(null);
    setProgress(0);
  };

  if (resultBytes && file) {
    return (
      <ResultSuccess
        lang={lang}
        filename={`${file.name.replace(/\.[^/.]+$/, '')}_numbered.pdf`}
        resultSize={resultBytes.byteLength}
        pageCount={pageCount}
        onDownload={handleDownload}
        onReset={handleReset}
        onGoHome={onGoHome}
      />
    );
  }

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-6">
        <Dropzone
          lang={lang}
          accept=".pdf"
          multiple={false}
          onFilesSelected={handleFileSelected}
          title="เลือกไฟล์ PDF เพื่อใส่เลขหน้าอัตโนมัติ"
          hint="ใส่หมายเลขหน้าในตำแหน่งที่ต้องการ กำหนดรูปแบบ เช่น หน้า 1 จาก 10 หรือ Page 1 of 10 ได้ง่ายๆ"
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {isProcessing && (
        <ProcessingModal lang={lang} progress={progress} statusText={statusText} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left: Preview */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center">
          <div className="w-full flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              ตัวอย่างตำแหน่งเลขหน้า (หน้า 1)
            </span>
            <span className="text-xs text-slate-500 font-medium">
              เอกสาร {pageCount} หน้า
            </span>
          </div>

          <div className="relative w-full max-w-[320px] aspect-[1/1.4] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-md flex items-center justify-center p-2">
            {previewThumbnail ? (
              <img
                src={previewThumbnail}
                alt="Page preview"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-slate-300">ตัวอย่างหน้า</div>
            )}

            {/* Simulated Page Number */}
            <div
              className={`absolute inset-0 flex pointer-events-none p-4 ${
                options.position === 'bottom-center'
                  ? 'items-end justify-center'
                  : options.position === 'bottom-right'
                  ? 'items-end justify-end'
                  : options.position === 'bottom-left'
                  ? 'items-end justify-start'
                  : options.position === 'top-center'
                  ? 'items-start justify-center'
                  : 'items-start justify-end'
              }`}
            >
              <span
                style={{ fontSize: `${options.fontSize}px` }}
                className="font-mono font-semibold px-2 py-0.5 rounded bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 shadow-sm border border-slate-200/50"
              >
                {options.format === 'thai-page-x-of-y'
                  ? `หน้า 1 จาก ${pageCount}`
                  : options.format === 'page-x-of-y'
                  ? `Page 1 of ${pageCount}`
                  : '1'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Customization */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              ตั้งค่าเลขหน้า
            </h3>
            <button
              onClick={handleReset}
              className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium"
            >
              เปลี่ยนไฟล์
            </button>
          </div>

          {/* Format */}
          <div className="space-y-1.5">
            <label className="block text-slate-500 dark:text-slate-400 font-medium">
              รูปแบบ
            </label>
            <div className="space-y-1.5">
              {[
                { id: 'thai-page-x-of-y', label: `หน้า 1 จาก ${pageCount}` },
                { id: 'page-x-of-y', label: `Page 1 of ${pageCount}` },
                { id: 'number', label: '1' },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setOptions({ ...options, format: fmt.id as PageNumberOptions['format'] })}
                  className={`w-full text-left p-2.5 rounded-lg border font-medium transition ${
                    options.format === fmt.id
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Position */}
          <div className="space-y-1.5">
            <label className="block text-slate-500 dark:text-slate-400 font-medium">
              ตำแหน่ง
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'bottom-center', label: 'ล่างกลาง' },
                { id: 'bottom-right', label: 'ล่างขวา' },
                { id: 'bottom-left', label: 'ล่างซ้าย' },
                { id: 'top-center', label: 'บนกลาง' },
                { id: 'top-right', label: 'บนขวา' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setOptions({ ...options, position: p.id as PageNumberOptions['position'] })}
                  className={`py-1.5 px-2 rounded-lg border font-medium transition ${
                    options.position === p.id
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-mono text-[11px] text-slate-500">
              <span>ขนาดตัวอักษร</span>
              <span>{options.fontSize} pt</span>
            </div>
            <input
              type="range"
              min="8"
              max="24"
              value={options.fontSize}
              onChange={(e) => setOptions({ ...options, fontSize: parseInt(e.target.value, 10) })}
              className="w-full accent-slate-900 dark:accent-slate-100"
            />
          </div>

          {/* Action Button */}
          <button
            onClick={handleApply}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-600 hover:from-fuchsia-600 hover:to-pink-700 text-white font-bold text-sm transition shadow-lg shadow-fuchsia-500/25 transform hover:scale-[1.01]"
          >
            ใส่เลขหน้าใน PDF
          </button>
        </div>
      </div>
    </div>
  );
};
