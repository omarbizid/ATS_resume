import { useRef } from 'react';
import { useCV } from '../../context/CVContext';
import type { CVData } from '../../types';

export default function ExportControls() {
    const { cvData, dispatch } = useCV();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExportPDF = () => {
        window.print();
    };

    const handleExportJSON = () => {
        const blob = new Blob([JSON.stringify(cvData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cv-${cvData.personal.fullName.replace(/\s+/g, '_').toLowerCase() || 'export'}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target?.result as string) as CVData;
                if (data.personal && data.sectionSettings) {
                    dispatch({ type: 'LOAD_DATA', payload: data });
                } else {
                    alert('Invalid CV data file.');
                }
            } catch {
                alert('Failed to parse JSON file.');
            }
        };
        reader.readAsText(file);
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={handleExportPDF}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition"
            >
                Export PDF
            </button>
            <button
                onClick={handleExportJSON}
                className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-xs font-medium rounded-lg transition"
            >
                Export JSON
            </button>
            <label className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-xs font-medium rounded-lg transition cursor-pointer">
                Import JSON
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                />
            </label>
        </div>
    );
}
