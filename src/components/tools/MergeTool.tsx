import React, { useState } from 'react';
import { ArrowUp, ArrowDown, Trash2, FileText, Plus } from 'lucide-react';
import type { Language } from '../../lib/i18n';
import { translations } from '../../lib/i18n';
import { Dropzone } from '../Dropzone';
import { ProcessingModal } from '../ProcessingModal';
import { ResultSuccess } from '../ResultSuccess';
import { mergePdfFiles } from '../../lib/pdf-service';
import { getPdfPageCount } from '../../lib/pdfjs-init';
import { formatBytes, downloadUint8Array } from '../../lib/file-utils';

interface MergeToolProps {
  lang: Language;
  onGoHome: () => void;
}

interface MergeFileItem {
  id: string;
  file: File;
  pageCount?: number;
}

export const MergeTool: React.FC<MergeToolProps> = ({ lang, onGoHome }) => {
  const t = translations[lang];
  const [files, setFiles] = useState<MergeFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  const [totalResultPages, setTotalResultPages] = useState<number>(0);

  const handleFilesSelected = async (newFiles: File[]) => {
    const validPdfFiles = newFiles.filter((f) => f.name.toLowerCase().endsWith('.pdf'));
    if (validPdfFiles.length === 0) return;

    const items: MergeFileItem[] = validPdfFiles.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
    }));

    setFiles((prev) => [...prev, ...items]);

    // Load page counts asynchronously
    for (const item of items) {
      try {
        const count = await getPdfPageCount(item.file);
        setFiles((current) =>
          current.map((f) => (f.id === item.id ? { ...f, pageCount: count } : f))
        );
      } catch {
        // ignore errors
      }
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setFiles((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === files.length - 1) return;
    setFiles((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleRemove = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      alert(lang === 'th' ? 'กรุณาเลือกไฟล์ PDF อย่างน้อย 2 ไฟล์เพื่อรวม' : 'Please select at least 2 PDF files to merge');
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(5);
      const totalPages = files.reduce((acc, curr) => acc + (curr.pageCount || 1), 0);
      setTotalResultPages(totalPages);

      const result = await mergePdfFiles(
        files.map((f) => f.file),
        (p, status) => {
          setProgress(p);
          setStatusText(status);
        }
      );

      setResultBytes(result);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการรวมไฟล์ PDF กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (resultBytes) {
      downloadUint8Array(resultBytes, 'merged_document.pdf');
    }
  };

  const handleReset = () => {
    setFiles([]);
    setResultBytes(null);
    setProgress(0);
  };

  if (resultBytes) {
    return (
      <ResultSuccess
        lang={lang}
        filename="merged_document.pdf"
        resultSize={resultBytes.byteLength}
        pageCount={totalResultPages}
        onDownload={handleDownload}
        onReset={handleReset}
        onGoHome={onGoHome}
      />
    );
  }

  if (files.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-6">
        <Dropzone
          lang={lang}
          accept=".pdf"
          multiple={true}
          onFilesSelected={handleFilesSelected}
          title="เลือกไฟล์ PDF หลายไฟล์เพื่อรวม"
          hint="ลากไฟล์ PDF มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์ (รองรับหลายไฟล์พร้อมกัน)"
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {isProcessing && (
        <ProcessingModal lang={lang} progress={progress} statusText={statusText} />
      )}

      {/* Top action header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
        <div className="font-medium text-slate-900 dark:text-slate-100">
          เลือกแล้ว {files.length} ไฟล์
          <span className="text-slate-400 font-normal ml-2 font-mono">
            (เรียงตามลำดับจากบนลงล่าง)
          </span>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <label className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition">
            <Plus className="w-3.5 h-3.5" />
            <span>{t.add_more_files}</span>
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
            onClick={handleMerge}
            disabled={files.length < 2}
            className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-5 py-2 rounded-xl font-bold text-xs transition ${
              files.length >= 2
                ? 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-md shadow-rose-500/25 cursor-pointer transform hover:scale-[1.02]'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>รวมไฟล์ PDF ({files.length})</span>
          </button>
        </div>
      </div>

      {/* File List */}
      <div className="space-y-2 mb-6">
        {files.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <span className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-mono flex items-center justify-center shrink-0">
                {index + 1}
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

            {/* Actions: Move Up, Move Down, Delete */}
            <div className="flex items-center space-x-1 shrink-0 ml-4">
              <button
                onClick={() => handleMoveUp(index)}
                disabled={index === 0}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
                title="ย้ายขึ้น"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleMoveDown(index)}
                disabled={index === files.length - 1}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
                title="ย้ายลง"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleRemove(item.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                title="ลบออก"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
