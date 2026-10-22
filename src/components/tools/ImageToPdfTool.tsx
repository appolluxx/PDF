import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Trash2, Plus } from 'lucide-react';
import type { Language } from '../../lib/i18n';
import { Dropzone } from '../Dropzone';
import { ProcessingModal } from '../ProcessingModal';
import { ResultSuccess } from '../ResultSuccess';
import { convertImagesToPdf } from '../../lib/pdf-service';
import { downloadUint8Array } from '../../lib/file-utils';
import type { ImageToPdfOptions } from '../../types';

interface ImageToPdfToolProps {
  lang: Language;
  onGoHome: () => void;
}

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
}

export const ImageToPdfTool: React.FC<ImageToPdfToolProps> = ({ lang, onGoHome }) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [options, setOptions] = useState<ImageToPdfOptions>({
    orientation: 'portrait',
    pageSize: 'a4',
    margin: 'small',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);

  const handleFilesSelected = (newFiles: File[]) => {
    const valid = newFiles.filter((f) => f.type.startsWith('image/'));
    if (valid.length === 0) return;

    const items: ImageItem[] = valid.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...items]);
  };

  const handleMoveLeft = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleMoveRight = (index: number) => {
    if (index === images.length - 1) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleRemove = (id: string) => {
    setImages((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleConvert = async () => {
    if (images.length === 0) return;

    try {
      setIsProcessing(true);
      setProgress(10);

      const bytes = await convertImagesToPdf(
        images.map((img) => img.file),
        options,
        (p, s) => {
          setProgress(p);
          setStatusText(s);
        }
      );

      setResultBytes(bytes);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF จากรูปภาพ');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBytes) return;
    downloadUint8Array(resultBytes, 'images_to_document.pdf');
  };

  const handleReset = () => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setResultBytes(null);
    setProgress(0);
  };

  if (resultBytes) {
    return (
      <ResultSuccess
        lang={lang}
        filename="images_to_document.pdf"
        resultSize={resultBytes.byteLength}
        pageCount={images.length}
        onDownload={handleDownload}
        onReset={handleReset}
        onGoHome={onGoHome}
      />
    );
  }

  if (images.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-6">
        <Dropzone
          lang={lang}
          accept="image/jpeg,image/png,image/webp"
          multiple={true}
          onFilesSelected={handleFilesSelected}
          title="เลือกรูปภาพ JPG, PNG, WebP เพื่อแปลงเป็น PDF"
          hint="ลากรูปภาพมาวางที่นี่ หรือคลิกเพื่อเลือก สามารถเลือกรูปภาพหลายรูปพร้อมกันเพื่อรวมในไฟล์เดียว"
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {isProcessing && (
        <ProcessingModal lang={lang} progress={progress} statusText={statusText} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Images Grid & Reordering */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-sm font-semibold text-slate-800 dark:text-white">
              รูปภาพที่เลือก ({images.length} รูป)
            </span>

            <label className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition">
              <Plus className="w-4 h-4 text-rose-500" />
              <span>เพิ่มรูปภาพอีก</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) => {
                  if (e.target.files) handleFilesSelected(Array.from(e.target.files));
                  e.target.value = '';
                }}
                className="hidden"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {images.map((item, index) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col justify-between group"
              >
                <div className="relative aspect-[3/4] bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-2">
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    className="max-h-full max-w-full object-contain rounded-lg"
                  />
                  <span className="absolute top-2 left-2 w-6 h-6 rounded-full bg-slate-900/80 text-white text-xs font-bold flex items-center justify-center backdrop-blur-sm">
                    {index + 1}
                  </span>
                </div>

                <div className="p-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleMoveLeft(index)}
                      disabled={index === 0}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20"
                      title="ย้ายไปซ้าย"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveRight(index)}
                      disabled={index === images.length - 1}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20"
                      title="ย้ายไปขวา"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="p-1 rounded text-slate-400 hover:text-red-600 transition"
                    title="ลบออก"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Settings & Action */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 h-fit space-y-4 text-xs">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
            ตั้งค่าเอกสาร
          </h3>

          {/* Orientation */}
          <div className="space-y-1.5">
            <label className="block text-slate-500 dark:text-slate-400 font-medium">
              ทิศทางกระดาษ
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'portrait', label: 'แนวตั้ง' },
                { id: 'landscape', label: 'แนวนอน' },
                { id: 'auto', label: 'อัตโนมัติ' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setOptions({ ...options, orientation: opt.id as ImageToPdfOptions['orientation'] })}
                  className={`py-1.5 px-2 rounded-lg border font-medium transition ${
                    options.orientation === opt.id
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Page Size */}
          <div className="space-y-1.5">
            <label className="block text-slate-500 dark:text-slate-400 font-medium">
              ขนาดกระดาษ
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'a4', label: 'A4' },
                { id: 'fit', label: 'พอดีภาพ' },
                { id: 'letter', label: 'Letter' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setOptions({ ...options, pageSize: opt.id as ImageToPdfOptions['pageSize'] })}
                  className={`py-1.5 px-2 rounded-lg border font-medium transition ${
                    options.pageSize === opt.id
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Margins */}
          <div className="space-y-1.5">
            <label className="block text-slate-500 dark:text-slate-400 font-medium">
              ระยะขอบ
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'none', label: 'ไม่มี' },
                { id: 'small', label: 'แคบ' },
                { id: 'large', label: 'กว้าง' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setOptions({ ...options, margin: opt.id as ImageToPdfOptions['margin'] })}
                  className={`py-1.5 px-2 rounded-lg border font-medium transition ${
                    options.margin === opt.id
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleConvert}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition transform hover:scale-[1.01]"
          >
            แปลงรูปภาพเป็น PDF
          </button>
        </div>
      </div>
    </div>
  );
};
