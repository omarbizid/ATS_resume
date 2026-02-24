import { useCV } from '../../context/CVContext';
import type { SectionKey } from '../../types';

export default function SectionReorder() {
    const { cvData, dispatch } = useCV();
    const sorted = [...cvData.sectionSettings].sort((a, b) => a.order - b.order);

    const move = (key: SectionKey, direction: 'up' | 'down') => {
        dispatch({ type: 'REORDER_SECTION', payload: { key, direction } });
    };

    const toggle = (key: SectionKey) => {
        dispatch({ type: 'TOGGLE_SECTION', payload: key });
    };

    return (
        <div className="space-y-2">
            <p className="text-xs text-zinc-500 mb-2">Drag sections to reorder. Toggle visibility.</p>
            {sorted.map((section, idx) => (
                <div
                    key={section.key}
                    className="flex items-center gap-2 bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2"
                >
                    <label className="flex items-center gap-2 flex-1 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={section.visible}
                            onChange={() => toggle(section.key)}
                            className="rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500/50"
                        />
                        <span className={`text-sm ${section.visible ? 'text-zinc-200' : 'text-zinc-500 line-through'}`}>
                            {section.label}
                        </span>
                    </label>
                    <div className="flex gap-1">
                        <button
                            onClick={() => move(section.key, 'up')}
                            disabled={idx === 0}
                            className="text-zinc-500 hover:text-zinc-300 disabled:opacity-30 px-1 text-sm transition"
                            title="Move up"
                        >
                            &uarr;
                        </button>
                        <button
                            onClick={() => move(section.key, 'down')}
                            disabled={idx === sorted.length - 1}
                            className="text-zinc-500 hover:text-zinc-300 disabled:opacity-30 px-1 text-sm transition"
                            title="Move down"
                        >
                            &darr;
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
