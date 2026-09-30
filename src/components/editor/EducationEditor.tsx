import { useCV } from '../../context/CVContext';
import { ArrowDown, ArrowUp, Plus, X } from '@phosphor-icons/react';
import { DateInput } from './fields';
import type { EducationItem } from '../../types';
import { v4 } from '../../data/uuid';

export default function EducationEditor() {
    const { cvData, updateField, dispatch } = useCV();
    const items = cvData.education;
    const language = cvData.cvLanguage ?? 'en';

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
        updateField('education', items.filter((_, i) => i !== index), 'Education entry removed');
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
                            <button onClick={() => moveItem(idx, 'up')} disabled={idx === 0} className="text-zinc-500 hover:text-zinc-300 disabled:opacity-30 px-1 text-sm transition" title="Move up" aria-label="Move up"><ArrowUp /></button>
                            <button onClick={() => moveItem(idx, 'down')} disabled={idx === items.length - 1} className="text-zinc-500 hover:text-zinc-300 disabled:opacity-30 px-1 text-sm transition" title="Move down" aria-label="Move down"><ArrowDown /></button>
                            <button onClick={() => removeItem(idx)} className="text-zinc-500 hover:text-red-400 px-1 transition" title="Remove" aria-label="Remove"><X /></button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Degree or qualification</label>
                            <input value={item.degree} onChange={(e) => updateItem(idx, 'degree', e.target.value)} placeholder="BSc Computer Science" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500 transition" />
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">School or university</label>
                            <input value={item.school} onChange={(e) => updateItem(idx, 'school', e.target.value)} placeholder="MIT" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500 transition" />
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-400 mb-1">Location</label>
                            <input value={item.location} onChange={(e) => updateItem(idx, 'location', e.target.value)} placeholder="Cambridge, MA" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500 transition" />
                        </div>
                        <div className="sm:col-span-2 grid grid-cols-2 gap-3">
                            <DateInput label="Start date" value={item.startDate} onChange={(v) => updateItem(idx, 'startDate', v)} language={language} />
                            <DateInput label="End date" value={item.endDate} onChange={(v) => updateItem(idx, 'endDate', v)} language={language} />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-xs text-zinc-400 mb-1">Grade (optional)</label>
                            <input value={item.grade} onChange={(e) => updateItem(idx, 'grade', e.target.value)} placeholder="First Class Honours / GPA 3.8" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500 transition" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs text-zinc-400 font-medium">Key modules (max 3)</label>
                            {item.modules.length < 3 && (
                                <button onClick={() => addModule(idx)} className="inline-flex items-center gap-1 text-xs text-accent-400 hover:text-accent-300"><Plus />Add module</button>
                            )}
                        </div>
                        {item.modules.map((m, mi) => (
                            <div key={mi} className="flex gap-2 mb-2">
                                <input value={m} onChange={(e) => updateModule(idx, mi, e.target.value)} placeholder={`Module ${mi + 1}`} className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500 transition" />
                                <button onClick={() => removeModule(idx, mi)} aria-label={`Remove module ${mi + 1}`} className="text-zinc-500 hover:text-red-400 px-1 transition"><X /></button>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            <button onClick={addItem} className="w-full py-2 flex items-center justify-center gap-1.5 border border-dashed border-zinc-700 rounded-lg text-sm text-zinc-400 hover:text-accent-400 hover:border-accent-500/50 transition">
                <Plus />Add education
            </button>
        </div>
    );
}
