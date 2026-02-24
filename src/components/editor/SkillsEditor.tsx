import { useCV } from '../../context/CVContext';
import type { SkillGroup } from '../../types';
import { v4 } from '../../data/uuid';

export default function SkillsEditor() {
    const { cvData, updateField, dispatch } = useCV();
    const groups = cvData.skillGroups;

    const addGroup = () => {
        const newGroup: SkillGroup = {
            id: v4(),
            category: '',
            skills: [],
        };
        updateField('skillGroups', [...groups, newGroup]);
    };

    const removeGroup = (index: number) => {
        updateField('skillGroups', groups.filter((_, i) => i !== index));
    };

    const updateCategory = (index: number, value: string) => {
        updateField(`skillGroups.${index}.category`, value);
    };

    const updateSkills = (index: number, value: string) => {
        const skills = value.split(',').map((s) => s.trimStart());
        updateField(`skillGroups.${index}.skills`, skills);
    };

    const moveGroup = (index: number, direction: 'up' | 'down') => {
        const toIndex = direction === 'up' ? index - 1 : index + 1;
        if (toIndex < 0 || toIndex >= groups.length) return;
        dispatch({ type: 'REORDER_ITEM', payload: { section: 'skillGroups', fromIndex: index, toIndex } });
    };

    return (
        <div className="space-y-4">
            {groups.map((group, idx) => (
                <div key={group.id} className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-500 font-medium">Skill Group {idx + 1}</span>
                        <div className="flex gap-1">
                            <button onClick={() => moveGroup(idx, 'up')} disabled={idx === 0} className="text-zinc-500 hover:text-zinc-300 disabled:opacity-30 px-1 text-sm transition" title="Move up">&uarr;</button>
                            <button onClick={() => moveGroup(idx, 'down')} disabled={idx === groups.length - 1} className="text-zinc-500 hover:text-zinc-300 disabled:opacity-30 px-1 text-sm transition" title="Move down">&darr;</button>
                            <button onClick={() => removeGroup(idx)} className="text-zinc-500 hover:text-red-400 px-1 transition" title="Remove">&times;</button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-zinc-400 mb-1">Category Name</label>
                        <input value={group.category} onChange={(e) => updateCategory(idx, e.target.value)} placeholder="e.g. Programming Languages" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition" />
                    </div>
                    <div>
                        <label className="block text-xs text-zinc-400 mb-1">Skills (comma-separated)</label>
                        <input value={group.skills.join(', ')} onChange={(e) => updateSkills(idx, e.target.value)} placeholder="Python, JavaScript, TypeScript, Java" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition" />
                    </div>
                </div>
            ))}
            <button onClick={addGroup} className="w-full py-2 border-2 border-dashed border-zinc-700 rounded-lg text-sm text-zinc-400 hover:text-blue-400 hover:border-blue-500/50 transition">
                + Add Skill Group
            </button>
        </div>
    );
}
