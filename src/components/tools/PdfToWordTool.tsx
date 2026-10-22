import React, { useState } from 'react';
import {
  FileText,
  Download,
  Copy,
  Check,
  FileCode,
  Sparkles,
  Layout,
  AlignLeft,
  Eye,
  RotateCcw,
  Home,
  Image as ImageIcon,
} from 'lucide-react';
import type { Language } from '../../lib/i18n';
import { Dropzone } from '../Dropzone';
import { ProcessingModal } from '../ProcessingModal';
import {
  convertPdfToWordStructured,
  type ExtractedPage,
  type ExtractedLine,
  type PageBlock,
} from '../../lib/pdf-to-word';
import { downloadBlob } from '../../lib/file-utils';

interface PdfToWordToolProps {
  lang: Language;
  onGoHome?: () => void;
}

export const PdfToWordTool: React.FC<PdfToWordToolProps> = ({ onGoHome }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [wordBlob, setWordBlob] = useState<Blob | null>(null);
  const [pages, setPages] = useState<ExtractedPage[]>([]);
  const [primaryFont, setPrimaryFont] = useState<string>('TH Sarabun New');
  const [fontSizes, setFontSizes] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);
  const [previewMode, setPreviewMode] = useState<'visual' | 'text'>('visual');
  const [selectedPageNum, setSelectedPageNum] = useState<number | 'all'>('all');

  const handleFileSelected = async (files: File[]) => {
    const selected = files[0];
    if (!selected) return;

    setFile(selected);
    try {
      setIsProcessing(true);
      setProgress(15);
      setStatusText('กำลังเปิดและวิเคราะห์โครงสร้าง PDF, ข้อความ และโลโก้/รูปภาพ...');

      const result = await convertPdfToWordStructured(selected, (p, s) => {
        setProgress(p);
        setStatusText(s);
      });

      setWordBlob(result.blob);
      setPages(result.pages);
      setPrimaryFont(result.primaryFont);
      setFontSizes(result.fontSizes);
      setSelectedPageNum(result.pages.length > 3 ? 1 : 'all');
    } catch (err) {
      console.error('Error converting PDF to Word:', err);
      alert('เกิดข้อผิดพลาดในการแปลง PDF เป็น Word กรุณาลองใหม่อีกครั้ง');
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadDocx = () => {
    if (!wordBlob || !file) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    downloadBlob(wordBlob, `${baseName}.docx`);
  };

  // Reconstruct clean formatted plain text
  const getFullFormattedText = () => {
    return pages
      .map((p) => {
        const pageHeader = `=== หน้า ${p.pageNumber} ===\n`;
        const content = p.isScanned
          ? '[หน้าเอกสารแบบภาพสแกน]'
          : p.lines.map((l) => l.text).join('\n');
        return pageHeader + content;
      })
      .join('\n\n');
  };

  const handleDownloadTxt = () => {
    if (!file || pages.length === 0) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const fullText = getFullFormattedText();
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `${baseName}.txt`);
  };

  const handleCopyText = () => {
    const fullText = getFullFormattedText();
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setFile(null);
    setWordBlob(null);
    setPages([]);
    setProgress(0);
    setSelectedPageNum('all');
  };

  if (!file) {
    return (
      <div className="max-w-2xl mx-auto py-6">
        <Dropzone
          lang="th"
          accept=".pdf"
          multiple={false}
          onFilesSelected={handleFileSelected}
          title="เลือกไฟล์ PDF เพื่อแปลงเป็น Microsoft Word (.docx)"
          hint="รักษารูปแบบดั้งเดิม 100%: ฟอนต์ (TH Sarabun, Angsana, Arial ฯลฯ), ขนาดตัวอักษร, โลโก้/รูปภาพ, ตัวหนา, ตัวเอียง, กึ่งกลาง, แท็บ และขนาดหน้ากระดาษตรงตาม PDF"
        />
      </div>
    );
  }

  const displayedPages =
    selectedPageNum === 'all'
      ? pages
      : pages.filter((p) => p.pageNumber === selectedPageNum);

  const totalImagesCount = pages.reduce((sum, p) => sum + (p.images?.length || 0), 0);

  return (
    <div className="max-w-5xl mx-auto">
      {isProcessing && (
        <ProcessingModal lang="th" progress={progress} statusText={statusText} />
      )}

      {wordBlob && (
        <div className="space-y-6 text-xs">
          {/* Main Success & Download Banner */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {file.name.replace(/\.[^/.]+$/, '')}.docx
                    </h3>
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                      <Sparkles className="w-3 h-3" />
                      <span>รักษาโครงสร้าง & ขนาดฟอนต์ตรงเป๊ะ</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-2 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      📄 {pages.length} หน้า
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      🔤 ฟอนต์: {primaryFont}
                    </span>
                    {totalImagesCount > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 flex items-center space-x-1">
                        <ImageIcon className="w-3 h-3" />
                        <span>ดึงโลโก้/รูปภาพ {totalImagesCount} รูป</span>
                      </span>
                    )}
                    {fontSizes.length > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        📏 ขนาดที่พบ: {fontSizes.slice(0, 5).map((s) => `${s}pt`).join(', ')}
                        {fontSizes.length > 5 ? '...' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleDownloadDocx}
                  className="flex items-center justify-center space-x-2 py-2.5 px-5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition transform hover:scale-[1.02]"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลด Word (.docx)</span>
                </button>

                <button
                  onClick={handleDownloadTxt}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="ดาวน์โหลดเป็นไฟล์ข้อความ (.txt)"
                >
                  <FileCode className="w-4 h-4" />
                </button>

                <button
                  onClick={handleCopyText}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="คัดลอกข้อความทั้งหมด"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>

                <button
                  onClick={handleReset}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="แปลงไฟล์อื่น"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {onGoHome && (
                  <button
                    onClick={onGoHome}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="กลับหน้าหลัก"
                  >
                    <Home className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Document Preview Section */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            {/* Toolbar: Preview Mode & Page Selectors */}
            <div className="flex flex-col sm:flex-row items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5 text-xs sm:text-sm">
                  <Eye className="w-4 h-4 text-sky-500" />
                  <span>ตัวอย่างเอกสารก่อนเปิดใน Word</span>
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {/* View Switcher */}
                <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
                  <button
                    onClick={() => setPreviewMode('visual')}
                    className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg font-medium transition text-xs ${
                      previewMode === 'visual'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Layout className="w-3.5 h-3.5" />
                    <span>มุมมองจัดหน้าจริง</span>
                  </button>
                  <button
                    onClick={() => setPreviewMode('text')}
                    className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg font-medium transition text-xs ${
                      previewMode === 'text'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                    <span>ข้อความ</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Page Jump Selector if multiple pages */}
            {pages.length > 1 && (
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
                <span className="text-slate-400 mr-1 font-mono">หน้า:</span>
                <button
                  onClick={() => setSelectedPageNum('all')}
                  className={`px-3 py-1 rounded-lg font-medium transition shrink-0 ${
                    selectedPageNum === 'all'
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  ทั้งหมด ({pages.length})
                </button>
                {pages.map((p) => (
                  <button
                    key={p.pageNumber}
                    onClick={() => setSelectedPageNum(p.pageNumber)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition shrink-0 ${
                      selectedPageNum === p.pageNumber
                        ? 'bg-sky-500 text-white shadow-sm'
                        : 'border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {p.pageNumber}
                  </button>
                ))}
              </div>
            )}

            {/* Content Area */}
            {previewMode === 'visual' ? (
              <div className="space-y-6">
                {displayedPages.map((page) => (
                  <div
                    key={page.pageNumber}
                    className="relative bg-slate-100/60 dark:bg-slate-950/80 p-4 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800"
                  >
                    {/* Clean Page Pill Outside Paper */}
                    <div className="flex items-center justify-center mb-3">
                      <span className="px-3 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        หน้า {page.pageNumber} / {pages.length}
                      </span>
                    </div>

                    {/* Clean Paper Sheet without fake headers */}
                    <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-xl p-6 sm:p-10 shadow-xl border border-slate-200 dark:border-slate-800/80 min-h-[500px]">
                      {page.isScanned ? (
                        <div className="text-center py-4">
                          {page.previewImageUrl ? (
                            <img
                              src={page.previewImageUrl}
                              alt={`หน้า ${page.pageNumber}`}
                              className="max-h-[650px] mx-auto rounded shadow-sm border border-slate-200 dark:border-slate-700"
                            />
                          ) : (
                            <p className="text-slate-400 italic">หน้าเอกสารภาพสแกน (ไม่มีข้อความตัวอักษร)</p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1.5 font-sans leading-relaxed text-slate-800 dark:text-slate-100">
                          {page.blocks && page.blocks.length > 0 ? (
                            page.blocks.map((block, bIdx) => (
                              <RenderVisualBlock key={bIdx} block={block} primaryFont={primaryFont} />
                            ))
                          ) : (
                            page.lines.map((line, lIdx) => (
                              <RenderVisualLine key={lIdx} line={line} primaryFont={primaryFont} />
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Plain Text Mode */
              <div className="max-h-[600px] overflow-y-auto space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                {displayedPages.map((p) => (
                  <div key={p.pageNumber} className="pb-4 border-b border-slate-200 dark:border-slate-800 last:border-b-0">
                    <div className="text-[11px] font-bold text-sky-500 mb-2">
                      [ หน้า {p.pageNumber} ]
                    </div>
                    <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
                      {p.isScanned
                        ? '(หน้านี้เป็นภาพสแกน ไม่พบข้อความตัวอักษร)'
                        : p.lines.map((l) => l.text).join('\n')}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Resolve CSS font-family stack with Google Font fallbacks
 */
function getCssFontFamily(font: string): string {
  const lower = (font || '').toLowerCase();
  if (lower.includes('sarabun')) {
    return "'TH Sarabun New', 'TH Sarabun PSK', 'Sarabun', sans-serif";
  }
  if (lower.includes('angsana')) {
    return "'Angsana New', 'AngsanaUPC', sans-serif";
  }
  if (lower.includes('cordia')) {
    return "'Cordia New', 'CordiaUPC', sans-serif";
  }
  if (lower.includes('browallia')) {
    return "'Browallia New', 'BrowalliaUPC', sans-serif";
  }
  if (lower.includes('prompt')) {
    return "'Prompt', sans-serif";
  }
  if (lower.includes('kanit')) {
    return "'Kanit', sans-serif";
  }
  return `'${font}', sans-serif`;
}

/**
 * Visual Block Renderer (renders either an image/logo or a text line)
 */
function RenderVisualBlock({ block, primaryFont }: { block: PageBlock; primaryFont: string }) {
  if (block.type === 'image') {
    let alignmentClass = 'text-left';
    if (block.image.alignment === 'center') alignmentClass = 'text-center';
    if (block.image.alignment === 'right') alignmentClass = 'text-right';

    const indentStyle =
      block.image.alignment === 'left' && block.image.indentPt > 0
        ? { paddingLeft: `${Math.min(block.image.indentPt, 120)}px` }
        : undefined;

    return (
      <div className={`my-3 ${alignmentClass}`} style={indentStyle}>
        <img
          src={block.image.dataUrl}
          alt="Document Logo"
          style={{
            maxWidth: '100%',
            width: `${Math.min(block.image.width, 360)}px`,
            maxHeight: `${Math.min(block.image.height, 220)}px`,
            objectFit: 'contain',
          }}
          className="inline-block rounded shadow-xs"
        />
      </div>
    );
  }

  return <RenderVisualLine line={block.line} primaryFont={primaryFont} />;
}

/**
 * Visual Line Renderer showing font sizes, bold weights, alignments, and indentations
 */
function RenderVisualLine({ line, primaryFont }: { line: ExtractedLine; primaryFont: string }) {
  let alignmentClass = 'text-left';
  if (line.alignment === 'center') alignmentClass = 'text-center';
  if (line.alignment === 'right') alignmentClass = 'text-right';

  const indentStyle =
    line.alignment === 'left' && line.indentPt > 0
      ? { paddingLeft: `${Math.min(line.indentPt, 120)}px` }
      : undefined;

  const spaceAfterStyle =
    line.spaceAfterPt > 6
      ? { marginBottom: `${Math.min(line.spaceAfterPt, 28)}px` }
      : { marginBottom: '2px' };

  return (
    <div
      className={`${alignmentClass} transition-colors`}
      style={{ ...indentStyle, ...spaceAfterStyle }}
    >
      {line.runs.map((r, rIdx) => {
        const fontName = r.fontFamily || primaryFont;
        const fontStack = getCssFontFamily(fontName);
        // Display exact true font size from PDF
        const previewSize = Math.max(10, Math.min(48, Math.round(r.fontSize)));

        return (
          <span
            key={rIdx}
            style={{
              fontSize: `${previewSize}px`,
              fontFamily: fontStack,
              fontWeight: r.isBold ? 700 : 400,
              fontStyle: r.isItalic ? 'italic' : 'normal',
              lineHeight: 1.45,
            }}
            className={`inline ${r.isBold ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-800 dark:text-slate-200'}`}
          >
            {r.text}
          </span>
        );
      })}
    </div>
  );
}
