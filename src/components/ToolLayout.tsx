import React from 'react';
import {
  ArrowLeft,
  Merge,
  Split,
  Minimize2,
  Image,
  FileImage,
  FileText,
  RotateCw,
  Layers,
  Stamp,
  Hash,
  Lock,
  Unlock,
  ShieldCheck,
} from 'lucide-react';
import type { ToolDef } from '../types';
import type { Language } from '../lib/i18n';
import { translations } from '../lib/i18n';

interface ToolLayoutProps {
  tool: ToolDef;
  lang: Language;
  onBack: () => void;
  children: React.ReactNode;
}

const iconMap: Record<string, React.ElementType> = {
  Merge,
  Split,
  Minimize2,
  Image,
  FileImage,
  FileText,
  RotateCw,
  Layers,
  Stamp,
  Hash,
  Lock,
  Unlock,
};

export const ToolLayout: React.FC<ToolLayoutProps> = ({
  tool,
  lang,
  onBack,
  children,
}) => {
  const t = translations[lang];
  const title = (t as Record<string, string>)[tool.titleKey] || tool.titleKey;
  const desc = (t as Record<string, string>)[tool.descKey] || tool.descKey;
  const IconComponent = iconMap[tool.icon] || FileText;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center space-x-3.5">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            title="Back to Studio (Esc)"
            aria-label="Back to Studio"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shrink-0 shadow-2xs">
            <IconComponent className="w-5 h-5 stroke-[1.8]" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {title}
              </h1>
              {tool.badge && (
                <span className="font-mono text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/70 dark:border-slate-700/70">
                  {tool.badge}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {desc}
            </p>
          </div>
        </div>

        {/* Engine Security Indicator */}
        <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-500 dark:text-slate-400 self-start sm:self-center bg-slate-100/60 dark:bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-800/60">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Local Engine · Zero Egress</span>
        </div>
      </div>

      {/* Workspace Content */}
      <div>{children}</div>
    </div>
  );
};
