import React from 'react';
import type { Language } from '../lib/i18n';
import { translations } from '../lib/i18n';

interface FooterProps {
  lang: Language;
}

export const Footer: React.FC<FooterProps> = ({ lang }) => {
  const t = translations[lang];

  return (
    <footer className="mt-auto border-t border-slate-200/80 dark:border-slate-800 py-8 px-4 sm:px-6 transition-colors">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-3">
        <div className="flex items-center space-x-2 text-center sm:text-left">
          <span className="font-bold text-slate-800 dark:text-white">PDFHub</span>
          <span>·</span>
          <span>{t.privacy_notice}</span>
        </div>

        <div className="flex items-center space-x-3 font-mono text-[11px] text-slate-400">
          <span>100% Client-Side</span>
          <span>·</span>
          <span>Offline Ready</span>
        </div>
      </div>
    </footer>
  );
};
