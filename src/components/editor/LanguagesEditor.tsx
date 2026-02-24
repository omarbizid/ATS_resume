import { useCV } from '../../context/CVContext';
import type { LanguageItem } from '../../types';
import { v4 } from '../../data/uuid';

const LEVELS = [
    'Native',
    'Fluent (C2)',
    'Advanced (C1)',
    'Upper Intermediate (B2)',
    'Intermediate (B1)',
    'Elementary (A2)',
    'Beginner (A1)',
];

export default function LanguagesEditor() {
    const { cvData, updateField, dispatch } = useCV();
    const items = cvData.languages;

    const addItem = () => {
        const newItem: LanguageItem = { id: v4(), language: '', level: 'Intermediate (B1)' };
        updateField('languages', [...items, newItem]);
    };

    const removeItem = (index: number) => {
        updateField('languages', items.filter((_, i) => i !== index));
    };

    const moveItem = (index: number, direction: 'up' | 'down') => {
        const toIndex = direction === 'up' ? index - 1 : index + 1;
        if (toIndex < 0 || toIndex >= items.length) return;
        dispatch({ type: 'REORDER_ITEM', payload: { section: 'languages', fromIndex: index, toIndex } });
    };

    return (
        <div className="space-y-4">
            {items.map((item, idx) => (
                <div key={item.id} className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-zinc-500 font-medium">Language {idx + 1}</span>
                        <div className="flex gap-1">
                            <button onClick={() => moveItem(idx, 'up')} disabled={idx === 0} className="text-zinc-500 hover:text-zinc-300 disabled:opacity-30 px-1 text-sm transition" title="Move up">&uarr;</button>
                            <button onClick={() => moveItem(idx, 'down')} disabled={idx === items.length - 1} className="text-zinc-500 hover:text-zinc-300 disabled:opacity-30 px-1 text-sm transition" title="Move down">&darr;</button>
                            <button onClick={() => removeItem(idx)} className="text-zinc-500 hover:text-red-400 px-1 transition" title="Remove">&times;</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Language</label>
                            <input value={item.language} onChange={(e) => updateField(`languages.${idx}.language`, e.target.value)} placeholder="English" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition" />
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Level</label>
                            <select value={item.level} onChange={(e) => updateField(`languages.${idx}.level`, e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition">
                                {LEVELS.map((l) => (
                                    <option key={l} value={l}>{l}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            ))}
            <button onClick={addItem} className="w-full py-2 border-2 border-dashed border-zinc-700 rounded-lg text-sm text-zinc-400 hover:text-blue-400 hover:border-blue-500/50 transition">
                + Add Language
            </button>
        </div>
    );
}
