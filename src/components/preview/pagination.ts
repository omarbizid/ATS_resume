/**
 * Splits the rendered CV into A4 pages for the preview, choosing breaks the way the
 * browser does when it prints the PDF: never inside a line, never inside an element
 * with `break-inside: avoid` (entries), never right after one with `break-after: avoid`
 * (headings), and without single orphan/widow lines in a paragraph.
 */

const PX_PER_MM = 96 / 25.4;
export const PAGE_HEIGHT_PX = 297 * PX_PER_MM;

/** A slice of the document, in unscaled px from its top, shown on one page. */
export interface PageSlice {
    start: number;
    end: number;
}

type Span = [number, number];

/** Sorted, merged spans; spans touching by less than a pixel stay separate. */
function merge(spans: Span[]): Span[] {
    const out: Span[] = [];
    for (const [a, b] of [...spans].filter(([a, b]) => b > a).sort((x, y) => x[0] - y[0])) {
        const last = out[out.length - 1];
        if (last && a < last[1] - 1) last[1] = Math.max(last[1], b);
        else out.push([a, b]);
    }
    return out;
}

/** Where page content may sit, from the template's own vertical padding. */
export function pageMargins(doc: HTMLElement) {
    const page = doc.firstElementChild as HTMLElement | null;
    const style = page ? getComputedStyle(page) : null;
    return { top: style ? parseFloat(style.paddingTop) : 0, bottom: style ? parseFloat(style.paddingBottom) : 0 };
}

export function paginate(doc: HTMLElement): PageSlice[] {
    const box = doc.getBoundingClientRect();
    // The preview is scaled with a CSS transform; work in the document's own pixels.
    const scale = box.height / doc.offsetHeight || 1;
    const toY = (v: number) => (v - box.top) / scale;
    const { top, bottom } = pageMargins(doc);

    // Every line of text, grouped by the block that contains it.
    const linesByBlock = new Map<HTMLElement, Span[]>();
    const lines: Span[] = [];
    const findBlock = (node: Node): HTMLElement => {
        let el = node.parentElement ?? doc;
        while (el !== doc && getComputedStyle(el).display.startsWith('inline')) el = el.parentElement ?? doc;
        return el;
    };
    const range = document.createRange();
    const walker = document.createTreeWalker(doc, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!node.textContent?.trim()) continue;
        range.selectNodeContents(node);
        const block = findBlock(node);
        for (const r of range.getClientRects()) {
            if (r.height <= 0) continue;
            const span: Span = [toY(r.top), toY(r.bottom)];
            lines.push(span);
            linesByBlock.set(block, [...(linesByBlock.get(block) ?? []), span]);
        }
    }
    doc.querySelectorAll('img').forEach((img) => {
        const r = img.getBoundingClientRect();
        lines.push([toY(r.top), toY(r.bottom)]);
    });
    const fine = merge(lines);
    if (fine.length === 0) return [{ start: 0, end: PAGE_HEIGHT_PX - bottom }];

    // Spans that must stay on one page.
    const keep: Span[] = [];
    for (const blockLines of linesByBlock.values()) {
        const rows = merge(blockLines);
        // Default orphans and widows are 2: short paragraphs move whole, long ones keep 2 lines at each end.
        if (rows.length <= 3) keep.push([rows[0][0], rows[rows.length - 1][1]]);
        else keep.push([rows[0][0], rows[1][1]], [rows[rows.length - 2][0], rows[rows.length - 1][1]]);
    }
    doc.querySelectorAll<HTMLElement>('*').forEach((el) => {
        const style = getComputedStyle(el);
        if (style.breakInside !== 'avoid' && style.breakAfter !== 'avoid') return;
        const r = el.getBoundingClientRect();
        const span: Span = [toY(r.top), toY(r.bottom)];
        if (style.breakInside === 'avoid') keep.push(span);
        if (style.breakAfter === 'avoid') {
            const next = fine.find(([a]) => a >= span[1] - 1);
            if (next) keep.push([span[0], next[1]]);
        }
    });
    const coarse = merge([...fine, ...keep]);

    const contentEnd = fine[fine.length - 1][1];
    const room = PAGE_HEIGHT_PX - top - bottom;
    const pages: PageSlice[] = [];
    let start = 0;
    let limit = PAGE_HEIGHT_PX - bottom;
    while (pages.length < 50) {
        if (contentEnd <= limit + 0.5) {
            pages.push({ start, end: limit });
            break;
        }
        const straddling = (spans: Span[]) => spans.find(([a, b]) => a < limit - 0.5 && b > limit + 0.5);
        let cut = straddling(coarse);
        // A group taller than a whole page has to split somewhere: fall back to line boundaries.
        if (cut && cut[0] <= start + 1) cut = straddling(fine);
        const end = cut && cut[0] > start + 1 ? cut[0] : limit;
        pages.push({ start, end });
        // The next page starts at the next line, dropping the space between (as print does with margins).
        const next = fine.find(([a]) => a >= end - 0.5);
        if (!next) break;
        start = Math.max(end, next[0] - 1);
        limit = start + room;
    }
    return pages;
}
