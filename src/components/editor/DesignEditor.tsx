import { useRef, useState } from 'react';
import { useCV } from '../../context/CVContext';

// Resize before saving: keep portraits small enough for localStorage and JSON backups.
async function preparePhoto(file: File): Promise<string> {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose a JPG, PNG or WebP image.');
    if (file.size > 10 * 1024 * 1024) throw new Error('Choose an image smaller than 10 MB.');
    const url = URL.createObjectURL(file);
    try {
        const image = new Image();
        image.src = url;
        await image.decode();
        const scale = Math.min(1, 800 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Your browser could not process this image.');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.85);
    } finally {
        URL.revokeObjectURL(url);
    }
}

export default function DesignEditor() {
    const { cvData, dispatch, updateField } = useCV();
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const request = useRef(0);
    const designed = cvData.templateId === 'designed';
    return (
        <section className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 space-y-3">
            <h2 className="text-sm font-semibold">Resume style</h2>
            <div className="flex gap-2">
                <button className={`style-choice ${!designed ? 'style-choice-active' : ''}`} aria-pressed={!designed} onClick={() => dispatch({ type: 'SET_TEMPLATE', payload: 'classic' })}>ATS resume</button>
                <button className={`style-choice ${designed ? 'style-choice-active' : ''}`} aria-pressed={designed} onClick={() => dispatch({ type: 'SET_TEMPLATE', payload: 'designed' })}>Designed resume</button>
            </div>
            <p className="text-xs text-zinc-400">{designed ? 'A styled layout for sharing directly. Your existing resume content is already included.' : 'Switch to Designed resume to convert this CV and add a photo. Your text stays the same.'}</p>
            {designed && <>
                <label className="flex items-center gap-3 text-xs text-zinc-300">Accent colour
                    <select aria-label="Accent colour" className="bg-zinc-800 rounded p-2" value={cvData.design?.accent ?? '#245c62'} onChange={e => updateField('design.accent', e.target.value)}>
                        <option value="#245c62">Teal</option><option value="#283c63">Navy</option><option value="#754354">Burgundy</option><option value="#484848">Graphite</option>
                    </select>
                </label>
                <label className="block text-xs text-zinc-300">Portrait (optional)
                    <input aria-label="Upload portrait" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} className="mt-2 block w-full text-xs file:mr-3 file:rounded file:border-0 file:bg-zinc-700 file:px-3 file:py-2 file:text-white" onChange={async e => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (!file) return;
                        const current = ++request.current;
                        setBusy(true); setError('');
                        try {
                            const photo = await preparePhoto(file);
                            if (current === request.current) { updateField('design.photo', photo); }
                        } catch (err) { setError(err instanceof Error ? err.message : 'Could not read this image.'); }
                        finally { setBusy(false); }
                    }} />
                </label>
                <p className="text-xs text-zinc-500">JPG, PNG or WebP, up to 10 MB. Photos are resized and saved in this browser and your JSON backup.</p>
                {busy && <p role="status" className="text-xs">Preparing photo…</p>}
                {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
                {cvData.design?.photo && <div className="flex items-center gap-3">
                    <img src={cvData.design.photo} alt="Selected portrait" className="w-16 h-16 rounded-lg object-cover" style={{ objectPosition: `50% ${cvData.design.photoPosition ?? 50}%` }} />
                    <div className="flex-1 space-y-2">
                        <label className="block text-xs text-zinc-300">Photo position
                            <input aria-label="Photo position" type="range" min="0" max="100" value={cvData.design.photoPosition ?? 50} onChange={e => updateField('design.photoPosition', Number(e.target.value))} className="block w-full mt-1" />
                        </label>
                        <button className="text-xs text-red-300" onClick={() => { request.current++; updateField('design.photo', '', 'Photo removed'); }}>Remove photo</button>
                    </div>
                </div>}
                <p className="text-xs text-zinc-400">Your photo, contact details, skills, languages and certifications appear in the left sidebar; your name heads the main column. Reordering applies within each column. Use an ATS template for automated application portals.</p>
            </>}
        </section>
    );
}
