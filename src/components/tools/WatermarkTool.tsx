import React, { useState } from 'react';
import type { Language } from '../../lib/i18n';
import { Dropzone } from '../Dropzone';
import { ProcessingModal } from '../ProcessingModal';
import { ResultSuccess } from '../ResultSuccess';
import { addWatermarkToPdf } from '../../lib/pdf-service';
import { getPdfPageCount, renderPdfPageToDataUrl } from '../../lib/pdfjs-init';
import { downloadUint8Array } from '../../lib/file-utils';
import type { WatermarkOptions } from '../../types';

interface WatermarkToolProps {
  lang: Language;
  onGoHome: () => void;
}

export const WatermarkTool: React.FC<WatermarkToolProps> = ({ lang, onGoHome }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null);
  const [options, setOptions] = useState<WatermarkOptions>({
    text: 'สำเนาถูกต้อง',
    fontSize: 48,
    opacity: 0.35,
    color: 'red',
    rotation: 45,
    position: 'diagonal',
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

  const handleApplyWatermark = async () => {
    if (!file || !options.text.trim()) return;

    try {
      setIsProcessing(true);
      setProgress(10);

      const bytes = await addWatermarkToPdf(file, options, (p, s) => {
        setProgress(p);
        setStatusText(s);
      });

      setResultBytes(bytes);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการใส่ลายน้ำใน PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!file || !resultBytes) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    downloadUint8Array(resultBytes, `${baseName}_watermarked.pdf`);
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
        filename={`${file.name.replace(/\.[^/.]+$/, '')}_watermarked.pdf`}
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
          title="เลือกไฟล์ PDF เพื่อใส่ลายน้ำ (Watermark)"
          hint="เพิ่มข้อความลายน้ำ เช่น สำเนาถูกต้อง, CONFIDENTIAL, DRAFT พร้อมปรับขนาด ตำแหน่ง ความโปร่งแสงได้อิสระ"
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
        {/* Left Col: Live Preview */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center">
          <div className="w-full flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              ตัวอย่างลายน้ำ (หน้า 1)
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

            {/* Simulated Watermark Overlay */}
            <div
              className={`absolute inset-0 flex pointer-events-none p-6 ${
                options.position === 'diagonal' || options.position === 'center'
                  ? 'items-center justify-center'
                  : options.position === 'bottom-right'
                  ? 'items-end justify-end'
                  : options.position === 'bottom-left'
                  ? 'items-end justify-start'
                  : options.position === 'top-right'
                  ? 'items-start justify-end'
                  : 'items-start justify-start'
              }`}
            >
              <span
                style={{
                  fontSize: `${Math.round(options.fontSize * 0.45)}px`,
                  opacity: options.opacity,
                  transform: `rotate(${options.position === 'diagonal' ? '-45deg' : `${options.rotation}deg`})`,
                  color:
                    options.color === 'red'
                      ? '#ef4444'
                      : options.color === 'blue'
                      ? '#3b82f6'
                      : options.color === 'gray'
                      ? '#6b7280'
                      : '#111827',
                }}
                className="font-bold whitespace-nowrap select-none font-sans"
              >
                {options.text || 'WATERMARK'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Col: Customization Form */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              ตั้งค่าลายน้ำ
            </h3>
            <button
              onClick={handleReset}
              className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium"
            >
              เปลี่ยนไฟล์
            </button>
          </div>

          {/* Watermark text */}
          <div className="space-y-1.5">
            <label className="block text-slate-500 dark:text-slate-400 font-medium">
              ข้อความลายน้ำ
            </label>
            <input
              type="text"
              value={options.text}
              onChange={(e) => setOptions({ ...options, text: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400"
            />
            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {['สำเนาถูกต้อง', 'CONFIDENTIAL', 'DRAFT', 'ห้ามเผยแพร่'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setOptions({ ...options, text: preset })}
                  className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                >
                  {preset}
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
                { id: 'diagonal', label: 'ทแยงกลาง' },
                { id: 'center', label: 'ตรงกลาง' },
                { id: 'bottom-right', label: 'ล่างขวา' },
                { id: 'bottom-left', label: 'ล่างซ้าย' },
                { id: 'top-right', label: 'บนขวา' },
                { id: 'top-left', label: 'บนซ้าย' },
              ].map((pos) => (
                <button
                  key={pos.id}
                  onClick={() => setOptions({ ...options, position: pos.id as WatermarkOptions['position'] })}
                  className={`py-1.5 px-2 rounded-lg border font-medium transition ${
                    options.position === pos.id
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font Color */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              สีข้อความ:
            </label>
            <div className="flex space-x-3">
              {[
                { id: 'red', bg: 'bg-red-500', name: 'แดง' },
                { id: 'gray', bg: 'bg-slate-500', name: 'เทา' },
                { id: 'blue', bg: 'bg-blue-500', name: 'น้ำเงิน' },
                { id: 'black', bg: 'bg-slate-900', name: 'ดำ' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setOptions({ ...options, color: c.id })}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border font-medium transition ${
                    options.color === c.id
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${c.bg}`} />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Opacity Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-mono text-[11px] text-slate-500">
              <span>ความโปร่งแสง</span>
              <span>{Math.round(options.opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={options.opacity}
              onChange={(e) => setOptions({ ...options, opacity: parseFloat(e.target.value) })}
              className="w-full accent-slate-900 dark:accent-slate-100"
            />
          </div>

          {/* Font Size Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-mono text-[11px] text-slate-500">
              <span>ขนาดตัวอักษร</span>
              <span>{options.fontSize} pt</span>
            </div>
            <input
              type="range"
              min="20"
              max="80"
              step="2"
              value={options.fontSize}
              onChange={(e) => setOptions({ ...options, fontSize: parseInt(e.target.value, 10) })}
              className="w-full accent-slate-900 dark:accent-slate-100"
            />
          </div>

          {/* Action Button */}
          <button
            onClick={handleApplyWatermark}
            disabled={!options.text.trim()}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold text-sm transition shadow-lg shadow-teal-500/25 disabled:opacity-40 disabled:cursor-not-allowed transform hover:scale-[1.01]"
          >
            ใส่ลายน้ำใน PDF
          </button>
        </div>
      </div>
    </div>
  );
};
