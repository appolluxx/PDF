import { useState, useEffect } from 'react';
import {
  Search,
  Shield,
  Zap,
  Sparkles,
  X,
} from 'lucide-react';
import type { ToolId, ToolCategory } from './types';
import type { Language } from './lib/i18n';
import { TOOLS, translations } from './lib/i18n';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ToolCard } from './components/ToolCard';
import { ToolLayout } from './components/ToolLayout';

// Tools
import { MergeTool } from './components/tools/MergeTool';
import { SplitTool } from './components/tools/SplitTool';
import { CompressTool } from './components/tools/CompressTool';
import { PdfToImageTool } from './components/tools/PdfToImageTool';
import { ImageToPdfTool } from './components/tools/ImageToPdfTool';
import { PdfToWordTool } from './components/tools/PdfToWordTool';
import { RotateTool } from './components/tools/RotateTool';
import { OrganizeTool } from './components/tools/OrganizeTool';
import { WatermarkTool } from './components/tools/WatermarkTool';
import { PageNumberTool } from './components/tools/PageNumberTool';

export function App() {
  const [lang, setLang] = useState<Language>('th');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pdfhub_theme');
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [currentToolId, setCurrentToolId] = useState<ToolId | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>('all');

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('pdfhub_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('pdfhub_theme', 'light');
    }
  }, [darkMode]);

  const t = translations[lang];

  const handleSelectTool = (id: ToolId) => {
    setCurrentToolId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoHome = () => {
    setCurrentToolId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentToolDef = TOOLS.find((tool) => tool.id === currentToolId);

  // Filter tools based on search and category
  const filteredTools = TOOLS.filter((tool) => {
    const title = (t as Record<string, string>)[tool.titleKey]?.toLowerCase() || '';
    const desc = (t as Record<string, string>)[tool.descKey]?.toLowerCase() || '';
    const query = searchQuery.toLowerCase().trim();

    const matchesSearch =
      !query || title.includes(query) || desc.includes(query) || tool.id.includes(query);
    const matchesCategory =
      selectedCategory === 'all' || tool.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar
        lang={lang}
        onLanguageChange={setLang}
        darkMode={darkMode}
        onDarkModeToggle={() => setDarkMode((prev) => !prev)}
        currentTool={currentToolId}
        onGoHome={handleGoHome}
        onSelectTool={handleSelectTool}
      />

      <main className="flex-1">
        {currentToolDef ? (
          <ToolLayout
            tool={currentToolDef}
            lang={lang}
            onBack={handleGoHome}
          >
            {currentToolId === 'merge' && <MergeTool lang={lang} onGoHome={handleGoHome} />}
            {currentToolId === 'split' && <SplitTool lang={lang} onGoHome={handleGoHome} />}
            {currentToolId === 'compress' && <CompressTool lang={lang} onGoHome={handleGoHome} />}
            {currentToolId === 'pdf-to-img' && <PdfToImageTool lang={lang} onGoHome={handleGoHome} />}
            {currentToolId === 'img-to-pdf' && <ImageToPdfTool lang={lang} onGoHome={handleGoHome} />}
            {currentToolId === 'pdf-to-word' && <PdfToWordTool lang={lang} onGoHome={handleGoHome} />}
            {currentToolId === 'rotate' && <RotateTool lang={lang} onGoHome={handleGoHome} />}
            {currentToolId === 'organize' && <OrganizeTool lang={lang} onGoHome={handleGoHome} />}
            {currentToolId === 'watermark' && <WatermarkTool lang={lang} onGoHome={handleGoHome} />}
            {currentToolId === 'page-numbers' && <PageNumberTool lang={lang} onGoHome={handleGoHome} />}
          </ToolLayout>
        ) : (
          <div>
            {/* Human-Centered Hero Section (iLovePDF Style) */}
            <section className="pt-12 sm:pt-16 pb-8 px-4 sm:px-6 max-w-4xl mx-auto text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                {lang === 'th'
                  ? 'เครื่องมือจัดการไฟล์ PDF ออนไลน์ ครบจบในที่เดียว'
                  : 'Every tool you need to work with PDFs in one place'}
              </h1>

              <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                {lang === 'th' ? (
                  <>
                    รวมไฟล์, แยกหน้า, บีบอัด, แปลงเป็น Word หรือรูปภาพ, หมุนหน้า และใส่ลายน้ำได้ง่ายๆ ภายในไม่กี่คลิก —{' '}
                    <strong className="text-slate-900 dark:text-slate-200 font-semibold">
                      ปลอดภัย 100% ประมวลผลบนเครื่องของคุณโดยตรง
                    </strong>
                  </>
                ) : (
                  <>
                    Merge, split, compress, convert, rotate, and watermark PDFs easily with just a few clicks.{' '}
                    <strong className="text-slate-900 dark:text-slate-200 font-semibold">
                      100% private, client-side processing with zero server uploads.
                    </strong>
                  </>
                )}
              </p>

              {/* Filter Tabs & Search Bar */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-3xl mx-auto">
                {/* Horizontal Category Tags */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                  {[
                    { id: 'all', label: t.cat_all },
                    { id: 'organize', label: t.cat_organize },
                    { id: 'convert', label: t.cat_convert },
                    { id: 'optimize', label: t.cat_optimize },
                    { id: 'security', label: t.cat_security },
                  ].map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id as ToolCategory)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                        selectedCategory === category.id
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>

                {/* Compact Search Bar */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.search_placeholder}
                    className="w-full pl-8 pr-7 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/50 shadow-2xs"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* Tools Grid Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
              {filteredTools.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    {lang === 'th'
                      ? `ไม่พบเครื่องมือที่ตรงกับ "${searchQuery}"`
                      : `No tools matching "${searchQuery}"`}
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}
                    className="mt-3 text-xs text-rose-600 dark:text-rose-400 hover:underline font-semibold"
                  >
                    {lang === 'th' ? 'แสดงเครื่องมือทั้งหมด' : 'Show all tools'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
                  {filteredTools.map((tool) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      lang={lang}
                      onSelect={handleSelectTool}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Human-Centered Trust & Feature Banner (Why Users Love It) */}
            <section className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 py-16 px-4 sm:px-6 lg:px-8">
              <div className="max-w-6xl mx-auto">
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                    {lang === 'th'
                      ? 'ทำไมต้องเลือก PDFHub?'
                      : 'Why choose PDFHub?'}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {lang === 'th'
                      ? 'ทุกไฟล์จัดการบนเครื่องของคุณอย่างปลอดภัย ใช้งานฟรี ไม่มีข้อผูกมัด'
                      : 'Client-side document management engineered for privacy and speed.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center sm:text-left">
                  {/* Feature 1 */}
                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-850/50 border border-slate-200/80 dark:border-slate-800">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 mx-auto sm:mx-0">
                      <Shield className="w-6 h-6 stroke-[2]" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {lang === 'th' ? 'ความเป็นส่วนตัว 100%' : '100% Client-Side Privacy'}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      {lang === 'th'
                        ? 'ไฟล์ของคุณไม่เคยถูกส่งขึ้นคลาวด์หรือเซิร์ฟเวอร์ใดๆ เอกสารถูกประมวลผลภายในเบราว์เซอร์ของคุณโดยตรง จึงปลอดภัยสูงสุดสำหรับเอกสารสำคัญ'
                        : 'Your files are processed directly inside your browser. No files are uploaded to any external server or stored in the cloud.'}
                    </p>
                  </div>

                  {/* Feature 2 */}
                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-850/50 border border-slate-200/80 dark:border-slate-800">
                    <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 mx-auto sm:mx-0">
                      <Zap className="w-6 h-6 stroke-[2]" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {lang === 'th' ? 'รวดเร็ว ไร้คิวคอย' : 'Instant & Offline Ready'}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      {lang === 'th'
                        ? 'ทำงานด้วยเทคโนโลยี WebAssembly ความเร็วสูงบนเครื่องของคุณ ไม่ต้องรออัปโหลดและดาวน์โหลดกลับ แม้สัญญาณอินเทอร์เน็ตหลุดก็ยังทำงานต่อได้'
                        : 'Lightning-fast processing powered by WebAssembly. No upload or download queues, working reliably even when offline.'}
                    </p>
                  </div>

                  {/* Feature 3 */}
                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-850/50 border border-slate-200/80 dark:border-slate-800">
                    <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-4 mx-auto sm:mx-0">
                      <Sparkles className="w-6 h-6 stroke-[2]" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {lang === 'th' ? 'ฟรี ไม่มีข้อจำกัด' : 'Free & Unlimited'}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      {lang === 'th'
                        ? 'ไม่มีการจำกัดขนาดไฟล์ ไม่มีการบังคับใส่ลายน้ำ และไม่ต้องสมัครสมาชิก สามารถใช้งานทุกเครื่องมือได้ทันทีทุกที่ทุกเวลา'
                        : 'No subscription walls, no forced watermarks, and no file size limits. Use every tool completely free with zero friction.'}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      <Footer lang={lang} />
    </div>
  );
}

export default App;
