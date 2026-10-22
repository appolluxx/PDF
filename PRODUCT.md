# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Privacy-conscious individuals and professionals (office workers, students, legal, and financial practitioners) who need fast, reliable PDF manipulation utilities without uploading confidential documents or personal data to remote servers or cloud infrastructure.

## Product Purpose

PDFHub provides a comprehensive, browser-based suite of PDF conversion, organization, and editing tools. It exists to eliminate privacy risks, subscription paywalls, and file size quotas typically imposed by cloud PDF services. Success means seamless, instant in-browser file transformation with zero data egress.

## Positioning

100% Client-Side Privacy: Every file conversion, split, merge, compression, and rendering process occurs entirely within the user's browser using local WebAssembly and JavaScript engines. No files or metadata ever leave the user's machine.

## Operating Context

- Web browsers on desktop, laptop, and mobile devices across macOS, Windows, Linux, and iOS/Android.
- Workflows involve sensitive files: legal contracts, financial spreadsheets, identification copies, academic papers, and business forms.
- Environments include corporate intranets, privacy-regulated sectors, or offline/intermittent internet connections where external uploads are strictly prohibited or impractical.

## Capabilities and Constraints

- **Core Capabilities:**
  - Organize: Merge PDFs, split pages/ranges into separate documents or ZIP archives, rotate pages, reorder and delete pages.
  - Convert: PDF to images (JPG/PNG at 150/300 DPI), Images (JPG, PNG, WebP) to PDF, PDF to editable Word document (.docx).
  - Optimize: Multi-level PDF file size compression with immediate reduction statistics.
  - Security & Style: Custom text watermark insertion (rotation, opacity, color), automated page numbering (custom format and position).
  - User Experience: Bilingual interface (Thai & English) with toggleable dark mode and live previews.
- **Strict Constraints:**
  - Inviolable zero-server architecture: all operations must run client-side (`pdf-lib`, `pdfjs-dist`, `docx`, `jszip`).
  - No remote server endpoints, telemetry collection, or external document parsing APIs.

## Brand Commitments

- **Name:** PDFHub
- **Tone:** Professional, reliable, secure, transparent, and frictionless.
- **Visual Identity:** Modern utility interface with clean typography, clear tool categories, and dark/light adaptive aesthetics.

## Evidence on Hand

- Fully functional React 19 + TypeScript + Vite + Tailwind CSS v4 web application with 10 implemented tools in `src/components/tools/`.
- Localized strings for English and Thai in `src/lib/i18n.ts`.
- Client-side PDF processing engines in `src/lib/pdf-service.ts` and `src/lib/pdfjs-init.ts`.
- No external cloud dependencies or server routes.

## Product Principles

1. **Zero Data Egress:** Privacy is not an optional setting; it is an architectural invariant. All data processing remains 100% inside the client browser.
2. **Immediate Utility:** Frictionless workflow with instant drag-and-drop, real-time page previews, and zero sign-ups or paywalls.
3. **Clarity and Predictability:** Explicit previews, transparent compression percentages, and clear feedback so users always know what will happen to their documents.
4. **Resilient Local Performance:** Efficient memory management and chunked processing to handle multi-page PDFs without freezing the browser tab.

## Accessibility & Inclusion

- Bilingual support out-of-the-box (Thai / English).
- High contrast dark/light theme switching with clear visual hierarchy.
- Keyboard accessible navigation and accessible drag-and-drop targets for document manipulation.
