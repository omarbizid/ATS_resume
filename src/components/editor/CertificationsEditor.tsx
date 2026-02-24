import { useCV } from '../../context/CVContext';
import type { CertificationItem } from '../../types';
import { v4 } from '../../data/uuid';

export default function CertificationsEditor() {
    const { cvData, updateField, dispatch } = useCV();
    const items = cvData.certifications;

    const addItem = () => {
        const newItem: CertificationItem = { id: v4(), name: '', issuer: '', year: '' };
        updateField('certifications', [...items, newItem]);
    };

    const removeItem = (index: number) => {
        updateField('certifications', items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: string, value: string) => {
        updateField(`certifications.${index}.${field}`, value);
    };

    const moveItem = (index: number, direction: 'up' | 'down') => {
        const toIndex = direction === 'up' ? index - 1 : index + 1;
        if (toIndex < 0 || toIndex >= items.length) return;
        dispatch({ type: 'REORDER_ITEM', payload: { section: 'certifications', fromIndex: index, toIndex } });
    };

    return (
        <div className="space-y-4">
            {items.map((item, idx) => (
                <div key={item.id} className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-500 font-medium">Certification {idx + 1}</span>
                        <div className="flex gap-1">
                            <button onClick={() => moveItem(idx, 'up')} disabled={idx === 0} className="text-zinc-500 hover:text-zinc-300 disabled:opacity-30 px-1 text-sm transition" title="Move up">&uarr;</button>
                            <button onClick={() => moveItem(idx, 'down')} disabled={idx === items.length - 1} className="text-zinc-500 hover:text-zinc-300 disabled:opacity-30 px-1 text-sm transition" title="Move down">&darr;</button>
                            <button onClick={() => removeItem(idx)} className="text-zinc-500 hover:text-red-400 px-1 transition" title="Remove">&times;</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                            <label className="block text-xs text-zinc-400 mb-1">Certification Name</label>
                            <input value={item.name} onChange={(e) => updateItem(idx, 'name', e.target.value)} placeholder="AWS Solutions Architect" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition" />
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Year</label>
                            <input value={item.year} onChange={(e) => updateItem(idx, 'year', e.target.value)} placeholder="2024" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition" />
                        </div>
                        <div className="sm:col-span-3">
                            <label className="block text-xs text-zinc-400 mb-1">Issuer</label>
                            <input value={item.issuer} onChange={(e) => updateItem(idx, 'issuer', e.target.value)} placeholder="Amazon Web Services" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition" />
                        </div>
                    </div>
                </div>
            ))}
            <button onClick={addItem} className="w-full py-2 border-2 border-dashed border-zinc-700 rounded-lg text-sm text-zinc-400 hover:text-blue-400 hover:border-blue-500/50 transition">
                + Add Certification
            </button>
        </div>
    );
}
