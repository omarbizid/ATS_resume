import { useCV } from '../../context/CVContext';
import type { ProjectItem } from '../../types';
import { v4 } from '../../data/uuid';

export default function ProjectsEditor() {
    const { cvData, updateField, dispatch } = useCV();
    const items = cvData.projects ?? [];

    const addItem = () => {
        const newItem: ProjectItem = { id: v4(), title: '', description: '', startDate: '', endDate: '', bullets: [''] };
        updateField('projects', [...items, newItem]);
    };

    const removeItem = (index: number) => {
        updateField('projects', items.filter((_, i) => i !== index));
    };

    const updateBullet = (itemIndex: number, bulletIndex: number, value: string) => {
        const newBullets = [...items[itemIndex].bullets];
        newBullets[bulletIndex] = value;
        updateField(`projects.${itemIndex}.bullets`, newBullets);
    };

    const addBullet = (itemIndex: number) => {
        if (items[itemIndex].bullets.length < 6) {
            updateField(`projects.${itemIndex}.bullets`, [...items[itemIndex].bullets, '']);
        }
    };

    const removeBullet = (itemIndex: number, bulletIndex: number) => {
        if (items[itemIndex].bullets.length > 1) {
            updateField(
                `projects.${itemIndex}.bullets`,
                items[itemIndex].bullets.filter((_, i) => i !== bulletIndex)
            );
        }
    };

    const moveItem = (index: number, direction: 'up' | 'down') => {
        const toIndex = direction === 'up' ? index - 1 : index + 1;
        if (toIndex < 0 || toIndex >= items.length) return;
        dispatch({ type: 'REORDER_ITEM', payload: { section: 'projects', fromIndex: index, toIndex } });
    };

    return (
        <div className="space-y-4">
            {items.map((item, idx) => (
                <div key={item.id} className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-500 font-medium">Project {idx + 1}</span>
                        <div className="flex gap-1">
                            <button onClick={() => moveItem(idx, 'up')} disabled={idx === 0} className="text-zinc-500 hover:text-zinc-300 disabled:opacity-30 px-1 text-sm transition" title="Move up">&uarr;</button>
                            <button onClick={() => moveItem(idx, 'down')} disabled={idx === items.length - 1} className="text-zinc-500 hover:text-zinc-300 disabled:opacity-30 px-1 text-sm transition" title="Move down">&darr;</button>
                            <button onClick={() => removeItem(idx)} className="text-zinc-500 hover:text-red-400 px-1 transition" title="Remove">&times;</button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-zinc-400 mb-1">Project Title</label>
                        <input value={item.title} onChange={(e) => updateField(`projects.${idx}.title`, e.target.value)} placeholder="e.g. Web Application for Recipe Management" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition" />
                    </div>
                    <div>
                        <label className="block text-xs text-zinc-400 mb-1">Short Description (optional)</label>
                        <input value={item.description} onChange={(e) => updateField(`projects.${idx}.description`, e.target.value)} placeholder="e.g. Academic project, Personal project" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Start Date</label>
                            <input value={item.startDate} onChange={(e) => updateField(`projects.${idx}.startDate`, e.target.value)} placeholder="Sep 2024" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition" />
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">End Date</label>
                            <input value={item.endDate} onChange={(e) => updateField(`projects.${idx}.endDate`, e.target.value)} placeholder="Jan 2025" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs text-zinc-400 font-medium">Bullets ({item.bullets.length}/6)</label>
                            {item.bullets.length < 6 && (
                                <button onClick={() => addBullet(idx)} className="text-xs text-blue-400 hover:text-blue-300 transition">+ Add Bullet</button>
                            )}
                        </div>
                        {item.bullets.map((b, bi) => (
                            <div key={bi} className="flex gap-2 mb-2">
                                <span className="text-zinc-600 mt-2 text-sm">•</span>
                                <input value={b} onChange={(e) => updateBullet(idx, bi, e.target.value)} placeholder={`Describe what you did ${bi + 1}`} className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition" />
                                {item.bullets.length > 1 && (
                                    <button onClick={() => removeBullet(idx, bi)} className="text-zinc-500 hover:text-red-400 px-1 transition">&times;</button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            <button onClick={addItem} className="w-full py-2 border-2 border-dashed border-zinc-700 rounded-lg text-sm text-zinc-400 hover:text-blue-400 hover:border-blue-500/50 transition">
                + Add Project
            </button>
        </div>
    );
}
