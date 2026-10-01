import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useCV } from '../../context/CVContext';
import TemplateRenderer from './TemplateRenderer';
import { PAGE_HEIGHT_PX, pageMargins, paginate, type PageSlice } from './pagination';

/** Space between pages, in unscaled px. */
const PAGE_GAP_PX = 24;

function sameSlices(a: PageSlice[], b: PageSlice[]) {
    return a.length === b.length && a.every((p, i) => Math.abs(p.start - b[i].start) < 0.5 && Math.abs(p.end - b[i].end) < 0.5);
}

/**
 * Shows the CV as separate A4 pages. Page 1 holds the real document (#cv-preview): it is
 * measured to find the page breaks and cloned for the PDF export, so the export always gets
 * one complete, flowing document. Later pages are display-only copies shifted up to their slice.
 */
export default function Preview() {
    const { cvData } = useCV();
    const container = useRef<HTMLDivElement>(null);
    const documentRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const [layout, setLayout] = useState<{ pages: PageSlice[]; top: number }>({ pages: [{ start: 0, end: PAGE_HEIGHT_PX }], top: 0 });

    const measure = useCallback(() => {
        const doc = documentRef.current;
        if (!doc) return;
        const pages = paginate(doc);
        const { top } = pageMargins(doc);
        setLayout((prev) => (prev.top === top && sameSlices(prev.pages, pages) ? prev : { pages, top }));
    }, []);

    // Re-check the breaks before paint whenever the CV changes, so pages never flash.
    useLayoutEffect(measure, [cvData, measure]);

    useEffect(() => {
        const host = container.current;
        const doc = documentRef.current;
        if (!host || !doc) return;
        const observer = new ResizeObserver(() => {
            setScale(Math.min(1, Math.max(0.1, (host.clientWidth - 32) / doc.offsetWidth)));
            measure();
        });
        observer.observe(host);
        observer.observe(doc);
        // Text reflows once web fonts and photos finish loading.
        window.document.fonts.ready.then(measure);
        return () => observer.disconnect();
    }, [measure]);

    const { pages, top } = layout;
    const totalHeight = pages.length * PAGE_HEIGHT_PX + (pages.length - 1) * PAGE_GAP_PX;

    return (
        <div ref={container} className="h-full overflow-auto bg-zinc-800/30 p-4 custom-scrollbar">
            <p className="no-print text-xs text-zinc-500 text-center mb-4">
                {pages.length === 1 ? 'Live preview on A4.' : `${pages.length} A4 pages. The PDF breaks at the same places.`}
            </p>
            <div className="preview-sheet-shell mx-auto" style={{ width: `${210 * scale}mm`, height: totalHeight * scale }}>
                <div className="preview-pages" style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                    {pages.map((slice, i) => (
                        <div
                            key={i}
                            className={`preview-page shadow-2xl${i > 0 ? ' preview-page-extra' : ''}`}
                            style={{ height: PAGE_HEIGHT_PX, marginTop: i > 0 ? PAGE_GAP_PX : 0 }}
                            aria-hidden={i > 0 || undefined}
                            data-page={i + 1}
                        >
                            <div className="preview-slice" style={{ top: i > 0 ? top : 0, height: slice.end - slice.start }}>
                                {i === 0 ? (
                                    <div ref={documentRef} id="cv-preview" className="cv-page-wrapper">
                                        <TemplateRenderer cvData={cvData} templateId={cvData.templateId} />
                                    </div>
                                ) : (
                                    <div className="cv-page-wrapper" style={{ transform: `translateY(${-slice.start}px)` }}>
                                        <TemplateRenderer cvData={cvData} templateId={cvData.templateId} />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
