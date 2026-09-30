import { useRef, useState, useEffect } from 'react';
import { useCV } from '../../context/CVContext';
import TemplateRenderer from './TemplateRenderer';

/** Keep one complete document in the DOM: clipping duplicate pages can hide
 * entries, especially when the designed template has independent columns. */
export default function Preview() {
    const { cvData } = useCV();
    const container = useRef<HTMLDivElement>(null);
    const document = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ scale: 1, height: 1123 });
    useEffect(() => {
        const host = container.current;
        const sheet = document.current;
        if (!host || !sheet) return;
        const observer = new ResizeObserver(() => {
            const scale = Math.min(1, Math.max(0.1, (host.clientWidth - 32) / sheet.offsetWidth));
            setSize({ scale, height: sheet.scrollHeight });
        });
        observer.observe(host);
        observer.observe(sheet);
        return () => observer.disconnect();
    }, []);
    return (
        <div ref={container} className="h-full overflow-auto bg-zinc-800/30 p-4 custom-scrollbar">
            <p className="no-print text-xs text-zinc-500 text-center mb-4">Live preview on A4. Final page breaks appear in the exported PDF.</p>
            <div className="preview-sheet-shell mx-auto" style={{ width: `${210 * size.scale}mm`, height: size.height * size.scale }}>
                <div ref={document} id="cv-preview" className="cv-page-wrapper shadow-2xl" style={{ transform: `scale(${size.scale})`, transformOrigin: 'top left' }}>
                    <TemplateRenderer cvData={cvData} templateId={cvData.templateId} />
                </div>
            </div>
        </div>
    );
}
