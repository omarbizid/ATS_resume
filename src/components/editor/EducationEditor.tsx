import { useCV } from '../../context/CVContext';
import type { EducationItem } from '../../types';
import { v4 } from '../../data/uuid';

export default function EducationEditor() {
    const { cvData, updateField, dispatch } = useCV();
    const items = cvData.education;

    const addItem = () => {
        const newItem: EducationItem = {
            id: v4(),
            degree: '',
            school: '',
            location: '',
            startDate: '',
            endDate: '',
            grade: '',
            modules: [],
        };
        updateField('education', [...items, newItem]);
    };

    const removeItem = (index: number) => {
        updateField('education', items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: string, value: unknown) => {
        updateField(`education.${index}.${field}`, value);
    };

    const updateModule = (itemIndex: number, modIndex: number, value: string) => {
        const newModules = [...items[itemIndex].modules];
        newModules[modIndex] = value;
        updateField(`education.${itemIndex}.modules`, newModules);
    };

    const addModule = (itemIndex: number) => {
        if (items[itemIndex].modules.length < 3) {
            updateField(`education.${itemIndex}.modules`, [...items[itemIndex].modules, '']);
        }
    };

    const removeModule = (itemIndex: number, modIndex: number) => {
        updateField(
            `education.${itemIndex}.modules`,
            items[itemIndex].modules.filter((_, i) => i !== modIndex)
        );
    };

    const moveItem = (index: number, direction: 'up' | 'down') => {
        const toIndex = direction === 'up' ? index - 1 : index + 1;
        if (toIndex < 0 || toIndex >= items.length) return;
        dispatch({ type: 'REORDER_ITEM', payload: { section: 'education', fromIndex: index, toIndex } });
    };

    return (
        <div className="space-y-4">
            {items.map((item, idx) => (
                <div key={item.id} className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-500 font-medium">Education {idx + 1}</span>
                        <div className="flex gap-1">
                            <button onClick={() => moveItem(idx, 'up')} disabled={idx === 0} className="text-zinc-500 hover:text-zinc-300 disabled:opacity-30 px-1 text-sm transition" title="Move up">&uarr;</button>
                            <button onClick={() => moveItem(idx, 'down')} disabled={idx === items.length - 1} className="text-zinc-500 hover:text-zinc-300 disabled:opacity-30 px-1 text-sm transition" title="Move down">&darr;</button>
                            <button onClick={() => removeItem(idx)} className="text-zinc-500 hover:text-red-400 px-1 transition" title="Remove">&times;</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Degree / Qualification</label>
                            <input value={item.degree} onChange={(e) => updateItem(idx, 'degree', e.target.value)} placeholder="BSc Computer Science" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition" />
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">School / University</label>
                            <input value={item.school} onChange={(e) => updateItem(idx, 'school', e.target.value)} placeholder="MIT" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition" />
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Location</label>
                            <input value={item.location} onChange={(e) => updateItem(idx, 'location', e.target.value)} placeholder="Cambridge, MA" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition" />
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="block text-xs text-zinc-400 mb-1">Start Date</label>
                                <input value={item.startDate} onChange={(e) => updateItem(idx, 'startDate', e.target.value)} placeholder="Sep 2020" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition" />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs text-zinc-400 mb-1">End Date</label>
                                <input value={item.endDate} onChange={(e) => updateItem(idx, 'endDate', e.target.value)} placeholder="Jun 2024" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition" />
                            </div>
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-xs text-zinc-400 mb-1">Grade (optional)</label>
                            <input value={item.grade} onChange={(e) => updateItem(idx, 'grade', e.target.value)} placeholder="First Class Honours / GPA 3.8" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs text-zinc-400 font-medium">Key Modules (max 3)</label>
                            {item.modules.length < 3 && (
                                <button onClick={() => addModule(idx)} className="text-xs text-blue-400 hover:text-blue-300 transition">+ Add Module</button>
                            )}
                        </div>
                        {item.modules.map((m, mi) => (
                            <div key={mi} className="flex gap-2 mb-2">
                                <input value={m} onChange={(e) => updateModule(idx, mi, e.target.value)} placeholder={`Module ${mi + 1}`} className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition" />
                                <button onClick={() => removeModule(idx, mi)} className="text-zinc-500 hover:text-red-400 px-1 transition">&times;</button>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            <button onClick={addItem} className="w-full py-2 border-2 border-dashed border-zinc-700 rounded-lg text-sm text-zinc-400 hover:text-blue-400 hover:border-blue-500/50 transition">
                + Add Education
            </button>
        </div>
    );
}
