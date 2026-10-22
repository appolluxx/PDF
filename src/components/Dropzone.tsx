import React, { useRef, useState } from 'react';
import { UploadCloud, Plus, FileText, ArrowUp } from 'lucide-react';
import type { Language } from '../lib/i18n';
import { translations } from '../lib/i18n';

interface DropzoneProps {
  lang: Language;
  accept: string;
  multiple: boolean;
  onFilesSelected: (files: File[]) => void;
  title?: string;
  hint?: string;
  compact?: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  lang,
  accept,
  multiple,
  onFilesSelected,
  title,
  hint,
  compact = false,
}) => {
  const t = translations[lang];
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (!multiple) {
        onFilesSelected([droppedFiles[0]]);
      } else {
        onFilesSelected(droppedFiles);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      onFilesSelected(selected);
      e.target.value = '';
    }
  };

  if (compact) {
    return (
      <div
        role="button"
        tabIndex={0}
        aria-label={t.add_more_files}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border border-dashed rounded-xl p-3 flex items-center justify-center space-x-2 cursor-pointer transition-all duration-150 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/50 ${
          isDragOver
            ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
        />
        <Plus className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
        <span>{t.add_more_files}</span>
      </div>
    );
  }

  const formatList = accept
    .split(',')
    .map((item) => item.replace('.', '').replace('image/', '').toUpperCase().trim())
    .join(' · ');

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={title || t.dropzone_title}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`group relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-rose-500/50 overflow-hidden ${
        isDragOver
          ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 shadow-lg shadow-rose-500/10 scale-[1.005]'
          : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-900/60 shadow-2xs hover:shadow-md'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex flex-col items-center max-w-md mx-auto">
        {/* Tactile Icon Box */}
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-200 shadow-2xs ${
            isDragOver
              ? 'bg-rose-600 text-white scale-110'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-slate-900 group-hover:text-white dark:group-hover:bg-rose-500 dark:group-hover:text-white'
          }`}
        >
          {isDragOver ? (
            <ArrowUp className="w-5 h-5 stroke-[2] animate-bounce" />
          ) : (
            <UploadCloud className="w-5 h-5 stroke-[1.8]" />
          )}
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight mb-1">
          {title || t.dropzone_title}
        </h3>

        {/* Hint */}
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed max-w-sm">
          {hint || (accept.includes('image') ? t.dropzone_hint_images : t.dropzone_hint_pdf)}
        </p>

        {/* Primary Action Button */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs sm:text-sm font-semibold transition-all duration-150 shadow-xs group-hover:scale-102 flex items-center space-x-2"
          >
            <FileText className="w-4 h-4 text-rose-500" />
            <span>{t.select_files}</span>
          </button>
        </div>

        {/* Metadata Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center space-x-3 text-[11px] font-mono text-slate-400 dark:text-slate-500">
          <span>{formatList || 'PDF'}</span>
          <span>·</span>
          <span>{multiple ? (lang === 'th' ? 'เลือกหลายไฟล์ได้' : 'Multi-file Batch') : (lang === 'th' ? 'ไฟล์เดี่ยว' : 'Single File')}</span>
          <span>·</span>
          <span>100% In-Memory</span>
        </div>
      </div>
    </div>
  );
};
