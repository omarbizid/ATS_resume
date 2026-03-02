import { useRef } from 'react';
import { useCV } from '../../context/CVContext';
import type { CVData } from '../../types';

export default function ExportControls() {
    const { cvData, dispatch } = useCV();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExportPDF = () => {
        const cvPreview = document.getElementById('cv-preview');
        if (!cvPreview) return;

        // Get the CV HTML content
        const cvHTML = cvPreview.innerHTML;

        // Build a clean HTML document with ONLY the CV styles (no Tailwind, no app CSS)
        const printDoc = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>CV Export</title>
<style>
  @page { size: A4; margin: 0; }

  html, body {
    margin: 0;
    padding: 0;
    background: white;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .cv-page-wrapper {
    width: 210mm;
    min-height: 297mm;
    background: white;
  }

  .cv-page {
    padding: 15mm 18mm;
    color: #111;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10.5pt;
    line-height: 1.4;
  }

  /* Header */
  .cv-page h1 {
    font-size: 18px;
    font-weight: 700;
    color: #000;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin: 0;
  }

  .cv-page .text-center { text-align: center; }
  .cv-page .mb-1 { margin-bottom: 4px; }
  .cv-page .mb-3 { margin-bottom: 12px; }
  .cv-page .mt-0\\.5 { margin-top: 2px; }
  .cv-page .mt-1 { margin-top: 4px; }

  .cv-page .text-\\[18px\\] { font-size: 18px; }
  .cv-page .text-\\[11px\\] { font-size: 11px; }
  .cv-page .text-\\[10px\\] { font-size: 10px; }
  .cv-page .text-black { color: #000; }
  .cv-page .text-gray-500 { color: #6b7280; }
  .cv-page .text-gray-600 { color: #4b5563; }
  .cv-page .text-gray-700 { color: #374151; }
  .cv-page .font-bold { font-weight: 700; }
  .cv-page .tracking-wide { letter-spacing: 0.05em; }
  .cv-page .uppercase { text-transform: uppercase; }
  .cv-page .space-y-2 > * + * { margin-top: 8px; }

  /* Classic heading */
  .cv-heading-classic {
    font-size: 11pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #111;
    margin-top: 10px;
    margin-bottom: 2px;
  }

  /* Minimal heading */
  .cv-heading-minimal {
    font-size: 12pt;
    font-weight: 700;
    color: #111;
    margin-top: 10px;
    margin-bottom: 4px;
    border-bottom: none;
  }

  .cv-divider {
    border: none;
    border-top: 0.5px solid #444;
    margin: 2px 0 6px 0;
  }

  .cv-text {
    font-size: 10pt;
    color: #222;
    line-height: 1.45;
    margin: 0;
  }

  .cv-entry {
    margin-top: 6px;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .cv-entry-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
  }

  .cv-entry-title {
    font-weight: 700;
    font-size: 10.5pt;
    color: #111;
  }

  .cv-entry-subtitle {
    font-weight: 400;
    font-size: 10pt;
    color: #333;
  }

  .cv-entry-date {
    font-size: 9.5pt;
    color: #444;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .cv-list {
    margin: 3px 0 0 0;
    padding-left: 16px;
    list-style: none;
  }

  .cv-list li {
    font-size: 10pt;
    color: #222;
    line-height: 1.45;
    margin-bottom: 1px;
    position: relative;
    padding-left: 4px;
  }

  .cv-list li::before {
    content: "•";
    position: absolute;
    left: -14px;
    color: #444;
  }

  h2 {
    break-after: avoid;
    page-break-after: avoid;
  }

  strong { font-weight: 700; }
</style>
</head>
<body>
  <div class="cv-page-wrapper">
    ${cvHTML}
  </div>
</body>
</html>`;

        // Create a hidden iframe for printing
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.top = '-10000px';
        iframe.style.left = '-10000px';
        iframe.style.width = '210mm';
        iframe.style.height = '297mm';
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) {
            document.body.removeChild(iframe);
            return;
        }

        iframeDoc.open();
        iframeDoc.write(printDoc);
        iframeDoc.close();

        // Wait for content to render, then print
        iframe.onload = () => {
            setTimeout(() => {
                iframe.contentWindow?.print();
                // Clean up after print dialog closes
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 1000);
            }, 250);
        };
    };

    const handleExportJSON = () => {
        const blob = new Blob([JSON.stringify(cvData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cv-${cvData.personal.fullName.replace(/\s+/g, '_').toLowerCase() || 'export'}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target?.result as string) as CVData;
                if (data.personal && data.sectionSettings) {
                    dispatch({ type: 'LOAD_DATA', payload: data });
                } else {
                    alert('Invalid CV data file.');
                }
            } catch {
                alert('Failed to parse JSON file.');
            }
        };
        reader.readAsText(file);
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={handleExportPDF}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition"
            >
                Export PDF
            </button>
            <button
                onClick={handleExportJSON}
                className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-xs font-medium rounded-lg transition"
            >
                Export JSON
            </button>
            <label className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-xs font-medium rounded-lg transition cursor-pointer">
                Import JSON
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                />
            </label>
        </div>
    );
}
