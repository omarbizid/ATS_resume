import { useRef, useState, useEffect, useCallback } from 'react';
import { useCV } from '../../context/CVContext';
import TemplateRenderer from './TemplateRenderer';

const PAGE_HEIGHT_MM = 297;
const PAGE_TOP_MARGIN_MM = 8;
// If a heading is in the last 15% of a page (~45mm), push it to the next page
const DANGER_ZONE_RATIO = 0.15;

export default function Preview() {
    const { cvData } = useCV();
    const measureRef = useRef<HTMLDivElement>(null);
    const pagesContainerRef = useRef<HTMLDivElement>(null);
    const [pageCount, setPageCount] = useState(1);
    const [pageHeightPx, setPageHeightPx] = useState(0);

    // Calculate exact mm-to-px for this browser/zoom
    useEffect(() => {
        const testEl = document.createElement('div');
        testEl.style.height = `${PAGE_HEIGHT_MM}mm`;
        testEl.style.position = 'absolute';
        testEl.style.visibility = 'hidden';
        document.body.appendChild(testEl);
        const px = testEl.offsetHeight;
        document.body.removeChild(testEl);
        if (px > 0) setPageHeightPx(px);
    }, []);

    // Apply smart spacers to a container: push headings near page bottom to next page
    const applySmartSpacers = useCallback((container: Element) => {
        if (!pageHeightPx) return;

        // Reset previous spacers
        container.querySelectorAll('h2').forEach((h) => {
            (h as HTMLElement).style.paddingTop = '';
        });

        const containerRect = container.getBoundingClientRect();
        const dangerStart = pageHeightPx * (1 - DANGER_ZONE_RATIO);
        const topMarginPx = pageHeightPx * (PAGE_TOP_MARGIN_MM / PAGE_HEIGHT_MM);

        // Process headings in order (top to bottom) — each spacer shifts subsequent positions
        const headings = container.querySelectorAll('h2');
        headings.forEach((heading) => {
            const rect = heading.getBoundingClientRect();
            const posFromTop = rect.top - containerRect.top;
            const pageIdx = Math.floor(posFromTop / pageHeightPx);
            const posInPage = posFromTop - pageIdx * pageHeightPx;

            // If heading is in the danger zone (last 15% of page), push to next page
            if (posInPage > dangerStart) {
                const spacer = pageHeightPx - posInPage + topMarginPx;
                (heading as HTMLElement).style.paddingTop = `${spacer}px`;
            }
        });
    }, [pageHeightPx]);

    // Measure content, apply smart spacers, calculate pages
    useEffect(() => {
        const el = measureRef.current;
        if (!el || !pageHeightPx) return;

        const update = () => {
            // Apply smart spacers to measurement div
            applySmartSpacers(el);

            // Measure total height after spacers
            const h = el.scrollHeight;
            const usablePerPage = pageHeightPx - (pageHeightPx * PAGE_TOP_MARGIN_MM / PAGE_HEIGHT_MM);

            let count: number;
            if (h <= pageHeightPx) {
                count = 1;
            } else {
                count = 1 + Math.max(0, Math.ceil((h - pageHeightPx) / usablePerPage));
            }
            setPageCount(count);

            // Apply same smart spacers to all visible page containers
            requestAnimationFrame(() => {
                const pages = pagesContainerRef.current;
                if (!pages) return;
                pages.querySelectorAll('.cv-page-content').forEach((c) => {
                    applySmartSpacers(c);
                });
            });
        };

        const observer = new ResizeObserver(update);
        observer.observe(el);
        update();

        return () => observer.disconnect();
    }, [pageHeightPx, cvData, applySmartSpacers]);

    // Calculate marginTop for each page
    const getPageOffset = (pageIdx: number): string | undefined => {
        if (pageIdx === 0) return undefined;
        const offset = (PAGE_HEIGHT_MM - PAGE_TOP_MARGIN_MM) * pageIdx;
        return `${-offset}mm`;
    };

    return (
        <div
            ref={pagesContainerRef}
            className="h-full overflow-y-auto flex flex-col items-center bg-zinc-800/30 p-4 gap-8 custom-scrollbar"
        >
            {/* Hidden measurement copy — full height, no clipping */}
            <div
                ref={measureRef}
                aria-hidden="true"
                className="cv-page-content"
                style={{
                    width: '210mm',
                    position: 'absolute',
                    left: '-9999px',
                    visibility: 'hidden',
                    pointerEvents: 'none',
                }}
            >
                <TemplateRenderer cvData={cvData} templateId={cvData.templateId} />
            </div>

            {/* Visible pages */}
            {Array.from({ length: pageCount }, (_, i) => (
                <div
                    key={i}
                    className="shadow-2xl flex-shrink-0 rounded-sm"
                    style={{
                        width: '210mm',
                        height: `${PAGE_HEIGHT_MM}mm`,
                        overflow: 'hidden',
                        background: 'white',
                        position: 'relative',
                    }}
                >
                    <div
                        id={i === 0 ? 'cv-preview' : undefined}
                        className="cv-page-wrapper cv-page-content"
                        style={{
                            marginTop: getPageOffset(i),
                            minHeight: 'auto',
                            backgroundImage: 'none',
                        }}
                    >
                        <TemplateRenderer cvData={cvData} templateId={cvData.templateId} />
                    </div>

                    {/* Top margin overlay for pages after the first */}
                    {i > 0 && (
                        <div
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: `${PAGE_TOP_MARGIN_MM}mm`,
                                background: 'white',
                            }}
                        />
                    )}

                    {/* Page number */}
                    {pageCount > 1 && (
                        <div
                            style={{
                                position: 'absolute',
                                bottom: '5mm',
                                right: '8mm',
                                fontSize: '8pt',
                                color: '#ccc',
                                pointerEvents: 'none',
                            }}
                        >
                            {i + 1} / {pageCount}
                        </div>
                    )}
                </div>
            ))}

            <div className="h-4 flex-shrink-0" />
        </div>
    );
}
