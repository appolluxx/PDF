import React from 'react';
import { Loader2 } from 'lucide-react';
import type { Language } from '../lib/i18n';
import { translations } from '../lib/i18n';

interface ProcessingModalProps {
  lang: Language;
  progress: number;
  statusText?: string;
}

export const ProcessingModal: React.FC<ProcessingModalProps> = ({
  lang,
  progress,
  statusText,
}) => {
  const t = translations[lang];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="processing-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-500 shadow-inner">
          <Loader2 className="w-7 h-7 animate-spin" />
        </div>

        <h3 id="processing-modal-title" className="text-lg font-bold text-slate-800 dark:text-white mb-1.5">
          {t.processing}
        </h3>

        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-2">
          {statusText || (lang === 'th' ? 'กรุณารอสักครู่ กำลังประมวลผลเอกสารของคุณ...' : 'Please wait, processing your document locally...')}
        </p>

        {/* Progress Bar Container */}
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t.processing}
          className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden mb-3"
        >
          <div
            className="bg-gradient-to-r from-rose-500 to-red-600 h-full transition-all duration-300 rounded-full"
            style={{ width: `${Math.max(5, progress)}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
          <span>{t.processed_locally || 'ประมวลผลบนเบราว์เซอร์'}</span>
          <span className="font-mono">{progress}%</span>
        </div>
      </div>
    </div>
  );
};
