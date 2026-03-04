import { useRef } from 'react';
import { useCV } from '../../context/CVContext';
import type { CVData } from '../../types';

/**
 * Recursively inline all computed styles on an element tree.
 * This ensures the cloned HTML looks identical in the print window
 * and the browser embeds real text glyphs (not a rasterized image).
 */
function inlineComputedStyles(source: Element, target: Element) {
  const srcEl = source as HTMLElement;
  const tgtEl = target as HTMLElement;
  const computed = window.getComputedStyle(srcEl);

  // Copy every computed property as an inline style
  for (let i = 0; i < computed.length; i++) {
    const prop = computed[i];
    tgtEl.style.setProperty(prop, computed.getPropertyValue(prop));
  }

  // Recurse into children
  const srcChildren = source.children;
  const tgtChildren = target.children;
  for (let i = 0; i < srcChildren.length; i++) {
    inlineComputedStyles(srcChildren[i], tgtChildren[i]);
  }
}

export default function ExportControls() {
  const { cvData, dispatch } = useCV();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportPDF = () => {
    const cvPreview = document.getElementById('cv-preview');
    if (!cvPreview) return;

    // Deep-clone the CV preview and inline all computed styles
    // so the print window renders an exact visual copy with real text
    const clone = cvPreview.cloneNode(true) as HTMLElement;
    inlineComputedStyles(cvPreview, clone);

    // Remove Tailwind/app class names — all styling is now inline
    clone.querySelectorAll('*').forEach((el) => {
      (el as HTMLElement).removeAttribute('class');
    });
    clone.removeAttribute('class');
    clone.removeAttribute('id');

    // Force wrapper styles for A4
    clone.style.width = '210mm';
    clone.style.minHeight = '297mm';
    clone.style.background = 'white';
    clone.style.boxShadow = 'none';
    clone.style.margin = '0';
    clone.style.padding = '0';

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>CV - ${cvData.personal.fullName || 'Export'}</title>
<style>
  @page { size: A4; margin: 0; }
  html, body {
    margin: 0;
    padding: 0;
    background: white;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
</style>
</head>
<body>
${clone.outerHTML}
</body>
</html>`;

    // Open a new window for printing — more reliable than iframe
    const printWindow = window.open('', '_blank', 'width=800,height=1100');
    if (!printWindow) {
      alert('Please allow popups to export PDF.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for the document to fully load, then trigger print
    printWindow.addEventListener('load', () => {
      setTimeout(() => {
        printWindow.print();
      }, 300);
    });
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
