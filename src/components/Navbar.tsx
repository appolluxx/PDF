import React, { useState, useRef, useEffect } from 'react';
import {
  Moon,
  Sun,
  Shield,
  ChevronDown,
  FileText,
} from 'lucide-react';
import type { Language } from '../lib/i18n';
import { translations, TOOLS } from '../lib/i18n';
import type { ToolId } from '../types';

interface NavbarProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  darkMode: boolean;
  onDarkModeToggle: () => void;
  currentTool: ToolId | null;
  onGoHome: () => void;
  onSelectTool: (id: ToolId) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang,
  onLanguageChange,
  darkMode,
  onDarkModeToggle,
  currentTool,
  onGoHome,
  onSelectTool,
}) => {
  const t = translations[lang];
  const [convertOpen, setConvertOpen] = useState(false);
  const [allToolsOpen, setAllToolsOpen] = useState(false);
  const convertRef = useRef<HTMLDivElement>(null);
  const allToolsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (convertRef.current && !convertRef.current.contains(e.target as Node)) {
        setConvertOpen(false);
      }
      if (allToolsRef.current && !allToolsRef.current.contains(e.target as Node)) {
        setAllToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToolClick = (id: ToolId) => {
    setConvertOpen(false);
    setAllToolsOpen(false);
    onSelectTool(id);
  };

  const convertTools = TOOLS.filter((tool) => tool.category === 'convert');
  const organizeTools = TOOLS.filter((tool) => tool.category === 'organize');
  const otherTools = TOOLS.filter(
    (tool) => tool.category === 'optimize' || tool.category === 'security'
  );

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand + Desktop Nav Links */}
          <div className="flex items-center space-x-6 lg:space-x-8">
            {/* Brand Logo */}
            <button
              onClick={onGoHome}
              className="flex items-center space-x-2.5 group focus:outline-none"
              aria-label="PDFHub Home"
            >
              <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-600/20 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  PDF<span className="text-rose-600 dark:text-rose-500">Hub</span>
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links (like iLovePDF) */}
            <nav className="hidden lg:flex items-center space-x-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <button
                onClick={() => handleToolClick('merge')}
                className={`px-3 py-2 rounded-lg hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition ${
                  currentTool === 'merge' ? 'text-rose-600 dark:text-rose-400 font-bold' : ''
                }`}
              >
                {t.tool_merge_title}
              </button>

              <button
                onClick={() => handleToolClick('split')}
                className={`px-3 py-2 rounded-lg hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition ${
                  currentTool === 'split' ? 'text-rose-600 dark:text-rose-400 font-bold' : ''
                }`}
              >
                {t.tool_split_title}
              </button>

              <button
                onClick={() => handleToolClick('compress')}
                className={`px-3 py-2 rounded-lg hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition ${
                  currentTool === 'compress' ? 'text-rose-600 dark:text-rose-400 font-bold' : ''
                }`}
              >
                {t.tool_compress_title}
              </button>

              {/* Convert Dropdown */}
              <div ref={convertRef} className="relative">
                <button
                  onClick={() => {
                    setConvertOpen(!convertOpen);
                    setAllToolsOpen(false);
                  }}
                  className={`px-3 py-2 rounded-lg hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center space-x-1 ${
                    convertTools.some((t) => t.id === currentTool)
                      ? 'text-rose-600 dark:text-rose-400 font-bold'
                      : ''
                  }`}
                >
                  <span>{t.cat_convert}</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </button>

                {convertOpen && (
                  <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    {convertTools.map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => handleToolClick(tool.id)}
                        className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-between transition"
                      >
                        <span>{(t as Record<string, string>)[tool.titleKey]}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {tool.badge}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* All PDF Tools Dropdown */}
              <div ref={allToolsRef} className="relative">
                <button
                  onClick={() => {
                    setAllToolsOpen(!allToolsOpen);
                    setConvertOpen(false);
                  }}
                  className="px-3 py-2 rounded-lg hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center space-x-1"
                >
                  <span>{t.all_tools}</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </button>

                {allToolsOpen && (
                  <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="space-y-3">
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                          {t.sec_organize_title}
                        </div>
                        <div className="space-y-0.5">
                          {organizeTools.map((tool) => (
                            <button
                              key={tool.id}
                              onClick={() => handleToolClick(tool.id)}
                              className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-rose-600 dark:hover:text-rose-400 transition"
                            >
                              {(t as Record<string, string>)[tool.titleKey]}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-700 pt-2">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                          {t.sec_finishing_title}
                        </div>
                        <div className="space-y-0.5">
                          {otherTools.map((tool) => (
                            <button
                              key={tool.id}
                              onClick={() => handleToolClick(tool.id)}
                              className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-rose-600 dark:hover:text-rose-400 transition"
                            >
                              {(t as Record<string, string>)[tool.titleKey]}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Right: Security Badge + Language + Theme Toggle */}
          <div className="flex items-center space-x-3">
            {/* Privacy Badge */}
            <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 font-medium border border-slate-200/60 dark:border-slate-700/60">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t.security_badge}</span>
            </div>

            {/* Language Toggle */}
            <button
              onClick={() => onLanguageChange(lang === 'th' ? 'en' : 'th')}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              {lang === 'th' ? 'EN' : 'ไทย'}
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={onDarkModeToggle}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
              title={darkMode ? 'Light Mode' : 'Dark Mode'}
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
