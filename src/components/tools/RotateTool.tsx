import React, { useState } from 'react';
import { RotateCw, RotateCcw, Check } from 'lucide-react';
import type { Language } from '../../lib/i18n';
import { Dropzone } from '../Dropzone';
import { ProcessingModal } from '../ProcessingModal';
import { ResultSuccess } from '../ResultSuccess';
import { rotatePdfPages } from '../../lib/pdf-service';
import { getPdfPageCount, renderAllPageThumbnails } from '../../lib/pdfjs-init';
import { downloadUint8Array } from '../../lib/file-utils';

interface RotateToolProps {
  lang: Language;
  onGoHome: () => void;
}

export const RotateTool: React.FC<RotateToolProps> = ({ lang, onGoHome }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [pageRotations, setPageRotations] = useState<{ [pageIndex: number]: number }>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);

  const handleFileSelected = async (files: File[]) => {
    const selected = files[0];
    if (!selected) return;

    setFile(selected);
    setIsProcessing(true);
    setProgress(20);
    setStatusText('กำลังโหลดหน้าเอกสาร...');

    try {
      const count = await getPdfPageCount(selected);
      setPageCount(count);

      setProgress(50);
      setStatusText('กำลังสร้างรูปตัวอย่างหน้า...');
      const thumbs = await renderAllPageThumbnails(selected, 40);
      setThumbnails(thumbs);
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถอ่านไฟล์ PDF นี้ได้');
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const rotateSinglePage = (pageIndex: number, delta: number) => {
    setPageRotations((prev) => {
      const current = prev[pageIndex] || 0;
      const next = (current + delta + 360) % 360;
      return { ...prev, [pageIndex]: next };
    });
  };

  const rotateAllPages = (delta: number) => {
    setPageRotations((prev) => {
      const updated: { [k: number]: number } = {};
      for (let i = 0; i < pageCount; i++) {
        const curr = prev[i] || 0;
        updated[i] = (curr + delta + 360) % 360;
      }
      return updated;
    });
  };

  const handleSave = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setProgress(20);
      setStatusText('กำลังหมุนหน้ากระดาษ...');

      const bytes = await rotatePdfPages(file, pageRotations, (p, s) => {
        setProgress(p);
        setStatusText(s);
      });

      setResultBytes(bytes);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการบันทึกเอกสาร PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!file || !resultBytes) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    downloadUint8Array(resultBytes, `${baseName}_rotated.pdf`);
  };

  const handleReset = () => {
    setFile(null);
    setPageCount(0);
    setThumbnails([]);
    setPageRotations({});
    setResultBytes(null);
    setProgress(0);
  };

  if (resultBytes && file) {
    return (
      <ResultSuccess
        lang={lang}
        filename={`${file.name.replace(/\.[^/.]+$/, '')}_rotated.pdf`}
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
          title="เลือกไฟล์ PDF ที่ต้องการหมุนหน้า"
          hint="หมุนหน้าเอกสารทั้งหมดพร้อมกัน หรือหมุนเฉพาะหน้าที่ต้องการได้แบบอิสระ"
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {isProcessing && (
        <ProcessingModal lang={lang} progress={progress} statusText={statusText} />
      )}

      {/* Control Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
            {file.name}
          </h3>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            {pageCount} หน้า
          </p>
        </div>

        <div className="flex items-center space-x-1.5 w-full sm:w-auto">
          <button
            onClick={() => rotateAllPages(-90)}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>หมุนซ้าย 90°</span>
          </button>

          <button
            onClick={() => rotateAllPages(90)}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>หมุนขวา 90°</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold transition shadow-md shadow-rose-500/25 transform hover:scale-[1.02]"
          >
            <Check className="w-4 h-4" />
            <span>บันทึก PDF</span>
          </button>
        </div>
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {thumbnails.map((thumb, idx) => {
          const rotation = pageRotations[idx] || 0;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between"
            >
              <div className="relative aspect-[3/4] p-2.5 flex items-center justify-center bg-slate-50 dark:bg-slate-950 overflow-hidden">
                <img
                  src={thumb}
                  alt={`Page ${idx + 1}`}
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: 'transform 0.25s ease-in-out',
                  }}
                  className="max-h-full max-w-full object-contain rounded"
                />
                <span className="absolute top-2 left-2 w-5 h-5 rounded bg-slate-900/80 text-white text-[10px] font-mono flex items-center justify-center backdrop-blur-sm">
                  {idx + 1}
                </span>
                {rotation !== 0 && (
                  <span className="absolute top-2 right-2 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                    {rotation}°
                  </span>
                )}
              </div>

              <div className="p-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  หน้า {idx + 1}
                </span>
                <div className="flex space-x-1">
                  <button
                    onClick={() => rotateSinglePage(idx, -90)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    title="หมุนซ้าย 90°"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => rotateSinglePage(idx, 90)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    title="หมุนขวา 90°"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
