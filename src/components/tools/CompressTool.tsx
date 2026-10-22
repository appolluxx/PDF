import React, { useState } from 'react';
import { Check } from 'lucide-react';
import type { Language } from '../../lib/i18n';
import { Dropzone } from '../Dropzone';
import { ProcessingModal } from '../ProcessingModal';
import { ResultSuccess } from '../ResultSuccess';
import { compressPdf } from '../../lib/pdf-service';
import { getPdfPageCount } from '../../lib/pdfjs-init';
import { formatBytes, downloadUint8Array } from '../../lib/file-utils';
import type { CompressionLevel } from '../../types';

interface CompressToolProps {
  lang: Language;
  onGoHome: () => void;
}

export const CompressTool: React.FC<CompressToolProps> = ({ lang, onGoHome }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [level, setLevel] = useState<CompressionLevel>('recommended');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);

  const handleFileSelected = async (files: File[]) => {
    const selectedFile = files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    try {
      const count = await getPdfPageCount(selectedFile);
      setPageCount(count);
    } catch {
      // fallback
    }
  };

  const handleCompress = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setProgress(5);
      const res = await compressPdf(file, level, (p, s) => {
        setProgress(p);
        if (s) setStatusText(s);
      });
      setResultBytes(res);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดระหว่างการบีบอัดไฟล์ PDF กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!file || !resultBytes) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    downloadUint8Array(resultBytes, `${baseName}_compressed.pdf`);
  };

  const handleReset = () => {
    setFile(null);
    setResultBytes(null);
    setProgress(0);
    setPageCount(0);
  };

  if (resultBytes && file) {
    return (
      <ResultSuccess
        lang={lang}
        filename={`${file.name.replace(/\.[^/.]+$/, '')}_compressed.pdf`}
        originalSize={file.size}
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
          title="เลือกไฟล์ PDF ที่ต้องการลดขนาด"
          hint="ลากไฟล์ PDF มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์ (ประมวลผลบนเครื่อง 100% ปลอดภัย)"
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {isProcessing && (
        <ProcessingModal lang={lang} progress={progress} statusText={statusText} />
      )}

      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-5 text-xs">
        {/* Selected file summary */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
              {file.name}
            </h3>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              ขนาดปัจจุบัน: {formatBytes(file.size)}
              {pageCount > 0 && ` · ${pageCount} หน้า`}
            </p>
          </div>
          <button
            onClick={handleReset}
            className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium"
          >
            เปลี่ยนไฟล์
          </button>
        </div>

        {/* Compression Options */}
        <div className="space-y-2">
          <label className="block font-medium text-slate-700 dark:text-slate-300">
            ระดับการบีบอัด
          </label>

          {/* Option: Extreme */}
          <div
            onClick={() => setLevel('extreme')}
            className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition ${
              level === 'extreme'
                ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="font-medium text-xs">
                บีบอัดสูงสุด (Extreme)
              </div>
              <p className={`text-[11px] mt-0.5 ${level === 'extreme' ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400'}`}>
                ลดขนาดไฟล์มากที่สุด เหมาะสำหรับส่งอีเมลหรือโควต้าขนาดเล็ก
              </p>
            </div>
            <div
              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-3 ${
                level === 'extreme'
                  ? 'border-white bg-white text-slate-900 dark:border-slate-900 dark:bg-slate-900 dark:text-white'
                  : 'border-slate-300 dark:border-slate-600'
              }`}
            >
              {level === 'extreme' && <Check className="w-2.5 h-2.5 stroke-[2.5]" />}
            </div>
          </div>

          {/* Option: Recommended */}
          <div
            onClick={() => setLevel('recommended')}
            className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition ${
              level === 'recommended'
                ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="font-medium text-xs">
                แนะนำ (Recommended)
              </div>
              <p className={`text-[11px] mt-0.5 ${level === 'recommended' ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400'}`}>
                สมดุลดีเยี่ยมระหว่างความคมชัดและขนาดไฟล์ที่เล็กลง
              </p>
            </div>
            <div
              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-3 ${
                level === 'recommended'
                  ? 'border-white bg-white text-slate-900 dark:border-slate-900 dark:bg-slate-900 dark:text-white'
                  : 'border-slate-300 dark:border-slate-600'
              }`}
            >
              {level === 'recommended' && <Check className="w-2.5 h-2.5 stroke-[2.5]" />}
            </div>
          </div>

          {/* Option: Low */}
          <div
            onClick={() => setLevel('low')}
            className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition ${
              level === 'low'
                ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="font-medium text-xs">
                บีบอัดเล็กน้อย (Low)
              </div>
              <p className={`text-[11px] mt-0.5 ${level === 'low' ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400'}`}>
                รักษาความคมชัดของภาพและตัวอักษรไว้สูงสุด
              </p>
            </div>
            <div
              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-3 ${
                level === 'low'
                  ? 'border-white bg-white text-slate-900 dark:border-slate-900 dark:bg-slate-900 dark:text-white'
                  : 'border-slate-300 dark:border-slate-600'
              }`}
            >
              {level === 'low' && <Check className="w-2.5 h-2.5 stroke-[2.5]" />}
            </div>
          </div>
        </div>

        {/* Submit button */}
        <button
          onClick={handleCompress}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition transform hover:scale-[1.01]"
        >
          บีบอัดไฟล์ PDF
        </button>
      </div>
    </div>
  );
};
