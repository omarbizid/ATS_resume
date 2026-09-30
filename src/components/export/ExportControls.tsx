import { useRef } from 'react';
import { useCV } from '../../context/CVContext';
import { readCVFile } from '../../data/importCV';

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

interface Props {
  /** 'toolbar' shows every export action (JSON ones from the sm breakpoint); 'menu' shows only the JSON ones, full width. */
  variant?: 'toolbar' | 'menu';
  /** Called after a menu action, so the menu can close. */
  onDone?: () => void;
}

export default function ExportControls({ variant = 'toolbar', onDone }: Props) {
  const { cvData, loadData, notify } = useCV();
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
      if ((el as HTMLElement).style.display === 'grid') (el as HTMLElement).style.gridTemplateRows = 'auto';
      (el as HTMLElement).style.height = el.tagName === 'IMG' ? (el as HTMLElement).style.height : 'auto';
      (el as HTMLElement).removeAttribute('class');
    });
    clone.removeAttribute('class');
    clone.removeAttribute('id');

    // Force wrapper styles for A4
    clone.style.transform = 'none';
    clone.style.height = 'auto';
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
<title>Resume export</title>
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
      notify('Allow pop-ups for this site to export the PDF.');
      return;
    }

    // Print settings are the most common export problem, so say them up front.
    notify(cvData.templateId === 'designed'
      ? 'In the print dialog choose "Save as PDF", paper A4, margins None, and turn on "Background graphics".'
      : 'In the print dialog choose "Save as PDF", paper A4 and margins None.');

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for portraits to decode before opening the print dialog.
    printWindow.document.title = 'CV - ' + (cvData.personal.fullName || 'Export');
    Promise.all(Array.from(printWindow.document.images).map(img => img.decode().catch(() => undefined)))
      .then(() => printWindow.document.fonts.ready)
      .then(() => { if (!printWindow.closed) printWindow.print(); });
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(cvData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cv-${cvData.personal.fullName.replace(/\s+/g, '_').toLowerCase() || 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onDone?.();
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so choosing the same file again still triggers a change.
    e.target.value = '';
    if (!file) return;
    try {
      loadData(await readCVFile(file), `Imported ${file.name}`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not import this file.');
    }
    onDone?.();
  };

  const fileInput = <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportJSON} className="hidden" aria-label="Import JSON file" />;

  if (variant === 'menu') {
    const item = 'w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700 transition';
    return (
      <>
        <button onClick={handleExportJSON} className={item}>Export JSON backup</button>
        <button onClick={() => fileInputRef.current?.click()} className={item}>Import JSON backup</button>
        {fileInput}
      </>
    );
  }

  const secondary = 'hidden sm:inline-block px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-xs font-medium rounded-lg transition';
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExportPDF}
        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition"
      >
        Export PDF
      </button>
      <button onClick={handleExportJSON} className={secondary}>
        Export JSON
      </button>
      <button onClick={() => fileInputRef.current?.click()} className={secondary}>
        Import JSON
      </button>
      {fileInput}
    </div>
  );
}
