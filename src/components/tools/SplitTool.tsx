import React, { useState } from 'react';
import { Scissors, FileArchive, CheckSquare, Square } from 'lucide-react';
import type { Language } from '../../lib/i18n';
import { translations } from '../../lib/i18n';
import { Dropzone } from '../Dropzone';
import { ProcessingModal } from '../ProcessingModal';
import { ResultSuccess } from '../ResultSuccess';
import { splitPdf, extractAllPagesAsPdfs } from '../../lib/pdf-service';
import { getPdfPageCount, renderAllPageThumbnails } from '../../lib/pdfjs-init';
import { downloadUint8Array, downloadZip, parsePageRange } from '../../lib/file-utils';

interface SplitToolProps {
  lang: Language;
  onGoHome: () => void;
}

export const SplitTool: React.FC<SplitToolProps> = ({ lang, onGoHome }) => {
  const t = translations[lang];
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [splitMode, setSplitMode] = useState<'range' | 'extract-all'>('range');
  const [rangeInput, setRangeInput] = useState<string>('1');
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set([0]));
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  const [resultZipFiles, setResultZipFiles] = useState<{ name: string; data: Uint8Array }[] | null>(null);

  const handleFileSelected = async (files: File[]) => {
    const selectedFile = files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsProcessing(true);
    setProgress(20);
    setStatusText('กำลังวิเคราะห์หน้าเอกสาร...');

    try {
      const count = await getPdfPageCount(selectedFile);
      setPageCount(count);
      setRangeInput(count > 1 ? `1-${Math.min(count, 3)}` : '1');
      const initial = new Set<number>();
      for (let i = 0; i < Math.min(count, 3); i++) initial.add(i);
      setSelectedPages(initial);

      // Render thumbnails
      setProgress(50);
      setStatusText('กำลังโหลดรูปตัวอย่างหน้า...');
      const thumbs = await renderAllPageThumbnails(selectedFile, 30);
      setThumbnails(thumbs);
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถอ่านไฟล์ PDF นี้ได้ กรุณาลองใหม่อีกครั้ง');
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRangeChange = (val: string) => {
    setRangeInput(val);
    const parsed = parsePageRange(val, pageCount);
    setSelectedPages(new Set(parsed));
  };

  const togglePageSelection = (pageIndex: number) => {
    const newSet = new Set(selectedPages);
    if (newSet.has(pageIndex)) {
      if (newSet.size > 1) {
        newSet.delete(pageIndex);
      }
    } else {
      newSet.add(pageIndex);
    }
    setSelectedPages(newSet);
    // Sync back to range input string
    const sorted = Array.from(newSet).sort((a, b) => a - b).map((p) => p + 1);
    setRangeInput(sorted.join(', '));
  };

  const handleSplit = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setProgress(10);

      if (splitMode === 'extract-all') {
        const zipEntries = await extractAllPagesAsPdfs(file, (p, s) => {
          setProgress(p);
          setStatusText(s);
        });
        setResultZipFiles(zipEntries);
      } else {
        const pagesToExtract = Array.from(selectedPages).sort((a, b) => a - b);
        const bytes = await splitPdf(file, pagesToExtract, (p, s) => {
          setProgress(p);
          setStatusText(s);
        });
        setResultBytes(bytes);
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการแยกไฟล์ PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!file) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '');

    if (splitMode === 'extract-all' && resultZipFiles) {
      await downloadZip(resultZipFiles, `${baseName}_pages.zip`);
    } else if (resultBytes) {
      downloadUint8Array(resultBytes, `${baseName}_split.pdf`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPageCount(0);
    setThumbnails([]);
    setResultBytes(null);
    setResultZipFiles(null);
    setSelectedPages(new Set([0]));
    setRangeInput('1');
  };

  if (resultBytes || resultZipFiles) {
    return (
      <ResultSuccess
        lang={lang}
        filename={splitMode === 'extract-all' ? `${file?.name || 'document'}_pages.zip` : `${file?.name || 'document'}_split.pdf`}
        resultSize={resultBytes ? resultBytes.byteLength : undefined}
        pageCount={splitMode === 'extract-all' ? resultZipFiles?.length : selectedPages.size}
        customActionLabel={splitMode === 'extract-all' ? 'ดาวน์โหลดไฟล์ ZIP ทั้งหมด' : t.download_now}
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
          title="เลือกไฟล์ PDF ที่ต้องการแยกหน้า"
          hint="ลากไฟล์ PDF มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์ (ประมวลผลบนเครื่อง ปลอดภัย 100%)"
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {isProcessing && (
        <ProcessingModal lang={lang} progress={progress} statusText={statusText} />
      )}

      {/* Control Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6 text-xs">
        {/* Left 2 Cols: Mode selector & inputs */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                {file.name}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                {pageCount} หน้า
              </p>
            </div>
            <button
              onClick={handleReset}
              className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium"
            >
              เปลี่ยนไฟล์
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSplitMode('range')}
              className={`p-3 rounded-lg border text-left flex items-start space-x-2.5 transition ${
                splitMode === 'range'
                  ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Scissors className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-xs">เลือกช่วงหน้า</div>
                <div className="text-[11px] opacity-75 mt-0.5">
                  เลือกหน้าที่ต้องการเป็น 1 ไฟล์
                </div>
              </div>
            </button>

            <button
              onClick={() => setSplitMode('extract-all')}
              className={`p-3 rounded-lg border text-left flex items-start space-x-2.5 transition ${
                splitMode === 'extract-all'
                  ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400'
              }`}
            >
              <FileArchive className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-xs">แยกทุกหน้า (ZIP)</div>
                <div className="text-[11px] opacity-75 mt-0.5">
                  แยกแต่ละหน้าเป็นไฟล์เดี่ยว
                </div>
              </div>
            </button>
          </div>

          {/* Range input if range mode */}
          {splitMode === 'range' && (
            <div className="space-y-1.5">
              <label className="block text-slate-500 dark:text-slate-400 font-medium">
                หน้าที่ต้องการแยก (เช่น 1-3, 5 หรือคลิกที่รูปด้านล่าง)
              </label>
              <input
                type="text"
                value={rangeInput}
                onChange={(e) => handleRangeChange(e.target.value)}
                placeholder="เช่น 1-3, 5, 8"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400"
              />
              <p className="text-[11px] text-slate-400 font-mono">
                เลือกแล้ว {selectedPages.size} / {pageCount} หน้า
              </p>
            </div>
          )}
        </div>

        {/* Right 1 Col: Summary & Action */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
              สรุปรายการ
            </h4>
            <div className="space-y-2 text-slate-500 dark:text-slate-400">
              <div className="flex justify-between">
                <span>โหมด</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {splitMode === 'range' ? 'ช่วงหน้าที่เลือก' : 'แตกทุกหน้า'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>ผลลัพธ์</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {splitMode === 'range'
                    ? `1 ไฟล์ (${selectedPages.size} หน้า)`
                    : `${pageCount} ไฟล์ (.zip)`}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSplit}
            disabled={splitMode === 'range' && selectedPages.size === 0}
            className="w-full mt-4 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold transition shadow-md shadow-rose-500/25 disabled:opacity-40 disabled:cursor-not-allowed transform hover:scale-[1.01]"
          >
            {splitMode === 'range' ? 'แยกหน้าที่เลือก' : 'แตกทุกหน้าเป็น ZIP'}
          </button>
        </div>
      </div>

      {/* Page Thumbnails Grid (Range Mode) */}
      {splitMode === 'range' && thumbnails.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-800 dark:text-white">
              คลิกที่หน้าเพื่อเลือกหรือยกเลิก:
            </h4>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  const all = new Set(Array.from({ length: pageCount }, (_, i) => i));
                  setSelectedPages(all);
                  setRangeInput(`1-${pageCount}`);
                }}
                className="text-xs text-rose-500 hover:underline font-semibold"
              >
                เลือกทั้งหมด
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={() => {
                  setSelectedPages(new Set([0]));
                  setRangeInput('1');
                }}
                className="text-xs text-slate-500 hover:underline font-semibold"
              >
                เลือกเฉพาะหน้าแรก
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {thumbnails.map((thumb, idx) => {
              const isSelected = selectedPages.has(idx);
              return (
                <div
                  key={idx}
                  onClick={() => togglePageSelection(idx)}
                  className={`group relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-slate-900 dark:border-slate-100 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={thumb}
                    alt={`Page ${idx + 1}`}
                    className="w-full h-44 object-contain bg-white p-1"
                  />
                  <div
                    className={`absolute bottom-0 inset-x-0 py-1 px-2 text-[11px] font-mono flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                        : 'bg-slate-800/80 text-white backdrop-blur-sm'
                    }`}
                  >
                    <span>p. {idx + 1}</span>
                    {isSelected ? (
                      <CheckSquare className="w-3.5 h-3.5" />
                    ) : (
                      <Square className="w-3.5 h-3.5" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
