import React from 'react';
import { Download, Check, RotateCcw, Home } from 'lucide-react';
import type { Language } from '../lib/i18n';
import { translations } from '../lib/i18n';
import { formatBytes } from '../lib/file-utils';

interface ResultSuccessProps {
  lang: Language;
  filename: string;
  onDownload: () => void;
  onReset: () => void;
  onGoHome: () => void;
  originalSize?: number;
  resultSize?: number;
  pageCount?: number;
  customActionLabel?: string;
}

export const ResultSuccess: React.FC<ResultSuccessProps> = ({
  lang,
  filename,
  onDownload,
  onReset,
  onGoHome,
  originalSize,
  resultSize,
  pageCount,
  customActionLabel,
}) => {
  const t = translations[lang];

  const savedPercent =
    originalSize && resultSize && originalSize > resultSize
      ? Math.round(((originalSize - resultSize) / originalSize) * 100)
      : null;

  return (
    <div className="max-w-md mx-auto py-8 text-center animate-fade-in">
      {/* Green checkmark circle */}
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-md shadow-emerald-500/10">
        <Check className="w-8 h-8 stroke-[2.5]" />
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1.5">
        {t.success_title}
      </h2>
      <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mb-6">
        {t.success_desc}
      </p>

      {/* File info card */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 text-left mb-6 text-xs sm:text-sm space-y-3 shadow-sm">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-700/60">
          <span className="text-slate-500 dark:text-slate-400">{t.file_name}</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[220px]">
            {filename}
          </span>
        </div>

        {/* Compression stats if applicable */}
        {originalSize && resultSize ? (
          <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
            <span className="text-slate-500 dark:text-slate-400">{t.file_size}</span>
            <div className="flex items-center space-x-2 font-mono">
              <span className="line-through text-slate-400">{formatBytes(originalSize)}</span>
              <span className="font-bold text-slate-900 dark:text-white">{formatBytes(resultSize)}</span>
              {savedPercent && savedPercent > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  -{savedPercent}%
                </span>
              )}
            </div>
          </div>
        ) : resultSize ? (
          <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
            <span className="text-slate-500 dark:text-slate-400">{t.file_size}</span>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
              {formatBytes(resultSize)}
            </span>
          </div>
        ) : null}

        {pageCount !== undefined && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-slate-500 dark:text-slate-400">{t.page_count}</span>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
              {pageCount} {t.page_unit}
            </span>
          </div>
        )}
      </div>

      {/* Main Download Button */}
      <button
        onClick={onDownload}
        className="w-full flex items-center justify-center space-x-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-rose-500/25 transition transform hover:scale-[1.02] mb-3"
      >
        <Download className="w-5 h-5" />
        <span>{customActionLabel || t.download_now}</span>
      </button>

      {/* Secondary Actions */}
      <div className="flex items-center justify-center space-x-3">
        <button
          onClick={onReset}
          className="flex items-center space-x-1.5 py-2 px-3.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{t.convert_another}</span>
        </button>
        <button
          onClick={onGoHome}
          className="flex items-center space-x-1.5 py-2 px-3.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <Home className="w-4 h-4" />
          <span>{t.back_home}</span>
        </button>
      </div>
    </div>
  );
};
