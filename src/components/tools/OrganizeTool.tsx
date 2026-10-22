import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Trash2, RotateCw, Check, Undo2 } from 'lucide-react';
import type { Language } from '../../lib/i18n';
import { Dropzone } from '../Dropzone';
import { ProcessingModal } from '../ProcessingModal';
import { ResultSuccess } from '../ResultSuccess';
import { organizePdfPages } from '../../lib/pdf-service';
import { renderAllPageThumbnails } from '../../lib/pdfjs-init';
import { downloadUint8Array } from '../../lib/file-utils';

interface OrganizeToolProps {
  lang: Language;
  onGoHome: () => void;
}

interface PageItem {
  id: string;
  originalIndex: number;
  previewUrl: string;
  rotation: number;
}

export const OrganizeTool: React.FC<OrganizeToolProps> = ({ lang, onGoHome }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [deletedPages, setDeletedPages] = useState<PageItem[]>([]);
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
      setProgress(50);
      setStatusText('กำลังสร้างภาพตัวอย่างแต่ละหน้า...');
      const thumbs = await renderAllPageThumbnails(selected, 50);

      const items: PageItem[] = thumbs.map((url, idx) => ({
        id: Math.random().toString(36).substring(2, 9),
        originalIndex: idx,
        previewUrl: url,
        rotation: 0,
      }));

      setPages(items);
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถอ่านไฟล์ PDF นี้ได้');
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMoveLeft = (index: number) => {
    if (index === 0) return;
    setPages((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleMoveRight = (index: number) => {
    if (index === pages.length - 1) return;
    setPages((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleRotate = (index: number) => {
    setPages((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, rotation: (item.rotation + 90) % 360 } : item
      )
    );
  };

  const handleDelete = (index: number) => {
    if (pages.length <= 1) {
      alert('ต้องมีอย่างน้อย 1 หน้าในเอกสาร');
      return;
    }
    const item = pages[index];
    setDeletedPages((prev) => [...prev, item]);
    setPages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUndoDelete = () => {
    if (deletedPages.length === 0) return;
    const lastDeleted = deletedPages[deletedPages.length - 1];
    setDeletedPages((prev) => prev.slice(0, -1));
    setPages((prev) => [...prev, lastDeleted]);
  };

  const handleSave = async () => {
    if (!file || pages.length === 0) return;

    try {
      setIsProcessing(true);
      setProgress(20);
      setStatusText('กำลังจัดเรียงเอกสาร...');

      const order = pages.map((p) => ({
        originalIndex: p.originalIndex,
        rotation: p.rotation,
      }));

      const bytes = await organizePdfPages(file, order, (p, s) => {
        setProgress(p);
        setStatusText(s);
      });

      setResultBytes(bytes);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการจัดระเบียบหน้า PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!file || !resultBytes) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    downloadUint8Array(resultBytes, `${baseName}_organized.pdf`);
  };

  const handleReset = () => {
    setFile(null);
    setPages([]);
    setDeletedPages([]);
    setResultBytes(null);
    setProgress(0);
  };

  if (resultBytes && file) {
    return (
      <ResultSuccess
        lang={lang}
        filename={`${file.name.replace(/\.[^/.]+$/, '')}_organized.pdf`}
        resultSize={resultBytes.byteLength}
        pageCount={pages.length}
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
          title="เลือกไฟล์ PDF เพื่อจัดเรียงและลบหน้า"
          hint="ดูภาพพรีวิวทุกหน้า สลับลำดับหน้า ลบหน้าที่ไม่ต้องการ หรือหมุนเฉพาะหน้าได้ง่ายๆ"
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
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
            คงเหลือ {pages.length} หน้า
            {deletedPages.length > 0 && ` (ลบ ${deletedPages.length} หน้า)`}
          </p>
        </div>

        <div className="flex items-center space-x-1.5 w-full sm:w-auto">
          {deletedPages.length > 0 && (
            <button
              onClick={handleUndoDelete}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>กู้คืน</span>
            </button>
          )}

          <button
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-xs transition shadow-md shadow-pink-500/20 transform hover:scale-[1.02]"
          >
            <Check className="w-4 h-4" />
            <span>ส่งออก PDF ({pages.length} หน้า)</span>
          </button>
        </div>
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {pages.map((item, index) => (
          <div
            key={item.id}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between"
          >
            <div className="relative aspect-[3/4] p-2.5 flex items-center justify-center bg-slate-50 dark:bg-slate-950 overflow-hidden">
              <img
                src={item.previewUrl}
                alt={`Page ${item.originalIndex + 1}`}
                style={{
                  transform: `rotate(${item.rotation}deg)`,
                  transition: 'transform 0.25s ease-in-out',
                }}
                className="max-h-full max-w-full object-contain rounded"
              />
              <span className="absolute top-2 left-2 w-5 h-5 rounded bg-slate-900/80 text-white text-[10px] font-mono flex items-center justify-center backdrop-blur-sm">
                #{index + 1}
              </span>
              <span className="absolute top-2 right-2 text-[10px] font-mono text-slate-400 bg-white/80 dark:bg-slate-900/80 px-1 py-0.5 rounded backdrop-blur-sm">
                {item.originalIndex + 1}
              </span>
            </div>

            <div className="p-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex space-x-1">
                <button
                  onClick={() => handleMoveLeft(index)}
                  disabled={index === 0}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20"
                  title="เลื่อนไปข้างหน้า"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleMoveRight(index)}
                  disabled={index === pages.length - 1}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20"
                  title="เลื่อนไปข้างหลัง"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleRotate(index)}
                  className="p-1 rounded text-slate-400 hover:text-rose-500 transition"
                  title="หมุนหน้า 90°"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => handleDelete(index)}
                className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                title="ลบหน้านี้ออก"
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
