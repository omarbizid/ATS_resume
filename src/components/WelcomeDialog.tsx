import { useEffect, useRef, useState } from 'react';
import { useCV } from '../context/CVContext';
import { blankCV } from '../data/sampleData';
import { readCVFile } from '../data/importCV';

/** First-visit choice so new users don't have to clear the sample CV by hand. */
export default function WelcomeDialog() {
    const { isNewVisitor, loadData, notify } = useCV();
    const [open, setOpen] = useState(isNewVisitor);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open]);

    if (!open) return null;

    const startBlank = () => {
        loadData(blankCV(), 'Started a blank CV');
        setOpen(false);
    };

    const importFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        try {
            loadData(await readCVFile(file), `Imported ${file.name}`);
            setOpen(false);
        } catch (err) {
            notify(err instanceof Error ? err.message : 'Could not import this file.');
        }
    };

    const choice = 'w-full text-left px-4 py-3 rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-blue-500/60';

    return (
        <div className="no-print fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div role="dialog" aria-modal="true" aria-labelledby="welcome-title" className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl p-6 space-y-4 shadow-2xl">
                <div className="space-y-1">
                    <h2 id="welcome-title" className="text-lg font-semibold text-zinc-100">Welcome to <span className="text-blue-400">CV</span> Studio</h2>
                    <p className="text-sm text-zinc-400">Build an ATS-friendly resume with a live preview. Your CV is saved in this browser as you type.</p>
                </div>
                <div className="space-y-2">
                    <button autoFocus onClick={startBlank} className={`${choice} bg-blue-600 border-blue-500 hover:bg-blue-500 text-white`}>
                        <span className="block text-sm font-semibold">Start from scratch</span>
                        <span className="block text-xs text-blue-100">An empty CV with the standard sections</span>
                    </button>
                    <button onClick={() => setOpen(false)} className={`${choice} bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-100`}>
                        <span className="block text-sm font-semibold">Explore the sample</span>
                        <span className="block text-xs text-zinc-400">Edit an example CV to see how it works</span>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className={`${choice} bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-100`}>
                        <span className="block text-sm font-semibold">Import a JSON backup</span>
                        <span className="block text-xs text-zinc-400">Continue a CV you exported earlier</span>
                    </button>
                    <input ref={fileInputRef} type="file" accept=".json" onChange={importFile} className="hidden" aria-label="Import a JSON backup file" />
                </div>
            </div>
        </div>
    );
}
