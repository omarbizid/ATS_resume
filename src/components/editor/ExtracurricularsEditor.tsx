import { useCV } from '../../context/CVContext';
import type { ExtracurricularItem } from '../../types';
import { v4 } from '../../data/uuid';

export default function ExtracurricularsEditor() {
    const { cvData, updateField, dispatch } = useCV();
    const items = cvData.extracurriculars;

    const addItem = () => {
        const newItem: ExtracurricularItem = { id: v4(), title: '', bullets: [''] };
        updateField('extracurriculars', [...items, newItem]);
    };

    const removeItem = (index: number) => {
        updateField('extracurriculars', items.filter((_, i) => i !== index));
    };

    const updateBullet = (itemIndex: number, bulletIndex: number, value: string) => {
        const newBullets = [...items[itemIndex].bullets];
        newBullets[bulletIndex] = value;
        updateField(`extracurriculars.${itemIndex}.bullets`, newBullets);
    };

    const addBullet = (itemIndex: number) => {
        if (items[itemIndex].bullets.length < 3) {
            updateField(`extracurriculars.${itemIndex}.bullets`, [...items[itemIndex].bullets, '']);
        }
    };

    const removeBullet = (itemIndex: number, bulletIndex: number) => {
        if (items[itemIndex].bullets.length > 1) {
            updateField(
                `extracurriculars.${itemIndex}.bullets`,
                items[itemIndex].bullets.filter((_, i) => i !== bulletIndex)
            );
        }
    };

    const moveItem = (index: number, direction: 'up' | 'down') => {
        const toIndex = direction === 'up' ? index - 1 : index + 1;
        if (toIndex < 0 || toIndex >= items.length) return;
        dispatch({ type: 'REORDER_ITEM', payload: { section: 'extracurriculars', fromIndex: index, toIndex } });
    };

    return (
        <div className="space-y-4">
            {items.map((item, idx) => (
                <div key={item.id} className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-500 font-medium">Activity {idx + 1}</span>
                        <div className="flex gap-1">
                            <button onClick={() => moveItem(idx, 'up')} disabled={idx === 0} className="text-zinc-500 hover:text-zinc-300 disabled:opacity-30 px-1 text-sm transition" title="Move up">&uarr;</button>
                            <button onClick={() => moveItem(idx, 'down')} disabled={idx === items.length - 1} className="text-zinc-500 hover:text-zinc-300 disabled:opacity-30 px-1 text-sm transition" title="Move down">&darr;</button>
                            <button onClick={() => removeItem(idx)} className="text-zinc-500 hover:text-red-400 px-1 transition" title="Remove">&times;</button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-zinc-400 mb-1">Activity Title</label>
                        <input value={item.title} onChange={(e) => updateField(`extracurriculars.${idx}.title`, e.target.value)} placeholder="Coding Club President" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition" />
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs text-zinc-400 font-medium">Bullets ({item.bullets.length}/3)</label>
                            {item.bullets.length < 3 && (
                                <button onClick={() => addBullet(idx)} className="text-xs text-blue-400 hover:text-blue-300 transition">+ Add Bullet</button>
                            )}
                        </div>
                        {item.bullets.map((b, bi) => (
                            <div key={bi} className="flex gap-2 mb-2">
                                <span className="text-zinc-600 mt-2 text-sm">•</span>
                                <input value={b} onChange={(e) => updateBullet(idx, bi, e.target.value)} placeholder={`Describe contribution ${bi + 1}`} className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition" />
                                {item.bullets.length > 1 && (
                                    <button onClick={() => removeBullet(idx, bi)} className="text-zinc-500 hover:text-red-400 px-1 transition">&times;</button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            <button onClick={addItem} className="w-full py-2 border-2 border-dashed border-zinc-700 rounded-lg text-sm text-zinc-400 hover:text-blue-400 hover:border-blue-500/50 transition">
                + Add Extracurricular
            </button>
        </div>
    );
}
