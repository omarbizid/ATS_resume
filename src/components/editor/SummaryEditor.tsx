import { useCV } from '../../context/CVContext';
import { BulletInput } from './fields';

export default function SummaryEditor() {
    const { cvData, updateField } = useCV();
    const { text, highlights } = cvData.summary;

    const updateHighlight = (index: number, value: string) => {
        const newHighlights = [...highlights];
        newHighlights[index] = value;
        updateField('summary.highlights', newHighlights);
    };

    const addHighlight = () => {
        if (highlights.length < 3) {
            updateField('summary.highlights', [...highlights, '']);
        }
    };

    const removeHighlight = (index: number) => {
        updateField('summary.highlights', highlights.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-3">
            <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Professional Summary
                </label>
                <textarea
                    value={text}
                    onChange={(e) => updateField('summary.text', e.target.value)}
                    placeholder="Brief professional summary (2-3 sentences)..."
                    rows={4}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition resize-none"
                />
            </div>
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-zinc-400">Key Highlights (max 3)</label>
                    {highlights.length < 3 && (
                        <button
                            onClick={addHighlight}
                            className="text-xs text-blue-400 hover:text-blue-300 transition"
                        >
                            + Add Highlight
                        </button>
                    )}
                </div>
                {highlights.map((h, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                        <BulletInput value={h} onChange={(v) => updateHighlight(i, v)} placeholder={`Highlight ${i + 1}`} label={`Highlight ${i + 1}`} />
                        <button
                            onClick={() => removeHighlight(i)}
                            className="text-zinc-500 hover:text-red-400 px-2 transition"
                            title="Remove"
                            aria-label={`Remove highlight ${i + 1}`}
                        >
                            &times;
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
