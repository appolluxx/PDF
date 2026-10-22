import React from 'react';
import {
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
} from 'lucide-react';
import type { ToolDef } from '../types';
import type { Language } from '../lib/i18n';
import { translations } from '../lib/i18n';

interface ToolCardProps {
  tool: ToolDef;
  lang: Language;
  onSelect: (toolId: ToolDef['id']) => void;
}

// Purposeful, human-crafted iconography and color mapping
const toolStyles: Record<
  string,
  {
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    darkIconBg: string;
  }
> = {
  merge: {
    icon: Merge,
    iconBg: 'bg-rose-50',
    darkIconBg: 'dark:bg-rose-950/40',
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
  split: {
    icon: Split,
    iconBg: 'bg-amber-50',
    darkIconBg: 'dark:bg-amber-950/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  compress: {
    icon: Minimize2,
    iconBg: 'bg-emerald-50',
    darkIconBg: 'dark:bg-emerald-950/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  'pdf-to-img': {
    icon: Image,
    iconBg: 'bg-sky-50',
    darkIconBg: 'dark:bg-sky-950/40',
    iconColor: 'text-sky-600 dark:text-sky-400',
  },
  'img-to-pdf': {
    icon: FileImage,
    iconBg: 'bg-indigo-50',
    darkIconBg: 'dark:bg-indigo-950/40',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  'pdf-to-word': {
    icon: FileText,
    iconBg: 'bg-blue-50',
    darkIconBg: 'dark:bg-blue-950/40',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  rotate: {
    icon: RotateCw,
    iconBg: 'bg-pink-50',
    darkIconBg: 'dark:bg-pink-950/40',
    iconColor: 'text-pink-600 dark:text-pink-400',
  },
  organize: {
    icon: Layers,
    iconBg: 'bg-teal-50',
    darkIconBg: 'dark:bg-teal-950/40',
    iconColor: 'text-teal-600 dark:text-teal-400',
  },
  watermark: {
    icon: Stamp,
    iconBg: 'bg-red-50',
    darkIconBg: 'dark:bg-red-950/40',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  'page-numbers': {
    icon: Hash,
    iconBg: 'bg-slate-100',
    darkIconBg: 'dark:bg-slate-800',
    iconColor: 'text-slate-700 dark:text-slate-300',
  },
};

export const ToolCard: React.FC<ToolCardProps> = ({ tool, lang, onSelect }) => {
  const t = translations[lang];
  const style = toolStyles[tool.id] || {
    icon: FileText,
    iconBg: 'bg-slate-100',
    darkIconBg: 'dark:bg-slate-800',
    iconColor: 'text-slate-600 dark:text-slate-300',
  };
  const IconComponent = style.icon;

  const title = (t as Record<string, string>)[tool.titleKey] || tool.titleKey;
  const desc = (t as Record<string, string>)[tool.descKey] || tool.descKey;

  return (
    <div
      onClick={() => onSelect(tool.id)}
      role="button"
      tabIndex={0}
      aria-label={`${title}: ${desc}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(tool.id);
        }
      }}
      className="group relative flex flex-col justify-start p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs hover:shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all duration-200 cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
    >
      {/* Top row: Distinct Pictogram Icon + Optional Badge */}
      <div className="flex items-start justify-between">
        <div
          className={`w-12 h-12 rounded-2xl ${style.iconBg} ${style.darkIconBg} ${style.iconColor} flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shadow-2xs`}
        >
          <IconComponent className="w-6 h-6 stroke-[1.8]" />
        </div>

        {tool.badge && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60 font-mono">
            {tool.badge}
          </span>
        )}
      </div>

      {/* Tool Title */}
      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-4 group-hover:text-rose-600 dark:group-hover:text-rose-500 transition-colors tracking-tight">
        {title}
      </h3>

      {/* Tool Description */}
      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
        {desc}
      </p>
    </div>
  );
};
