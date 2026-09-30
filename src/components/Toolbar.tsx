import { useEffect, useState } from 'react';
import { useCV } from '../context/CVContext';
import type { CVLanguage, TemplateId } from '../types';
import { studentCV, juniorDevCV, blankCV } from '../data/sampleData';
import ExportControls from './export/ExportControls';

interface Props {
    showATS: boolean;
    onToggleATS: () => void;
    showChat: boolean;
    onToggleChat: () => void;
    mobileView: 'editor' | 'preview';
    onMobileViewChange: (view: 'editor' | 'preview') => void;
}

const SAVE_LABELS = { saved: '✓ Saved', saving: 'Saving…', error: 'Not saved' } as const;

export default function Toolbar({ showATS, onToggleATS, showChat, onToggleChat, mobileView, onMobileViewChange }: Props) {
    const { cvData, dispatch, loadData, undo, redo, canUndo, canRedo, saveStatus } = useCV();
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        if (!menuOpen) return;
        const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [menuOpen]);

    const loadSample = (sample: 'student' | 'junior') => {
        loadData(sample === 'student' ? studentCV : juniorDevCV, `Loaded the ${sample === 'student' ? 'Student' : 'Junior Dev'} sample`);
    };
    const newCV = () => loadData(blankCV(), 'Started a blank CV');

    const menuItem = 'w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700 transition';

    return (
        <div className="no-print bg-zinc-900 border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
                <h1 className="text-base font-bold text-zinc-100 tracking-tight">
                    <span className="text-blue-400">CV</span> Studio
                </h1>
                <div className="hidden sm:flex items-center gap-1.5 ml-2">
                    <span className="text-xs text-zinc-500">Template:</span>
                    <select
                        aria-label="Resume template"
                        value={cvData.templateId}
                        onChange={(e) => dispatch({ type: 'SET_TEMPLATE', payload: e.target.value as TemplateId })}
                        className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                    >
                        <option value="classic">Classic ATS</option>
                        <option value="minimal">Minimal ATS</option>
                        <option value="designed">Designed resume (photo)</option>
                    </select>
                </div>
                <div className="hidden sm:flex items-center gap-1.5">
                    <span className="text-xs text-zinc-500">CV language:</span>
                    <select
                        aria-label="CV language (section headings)"
                        value={cvData.cvLanguage ?? 'en'}
                        onChange={(e) => dispatch({ type: 'SET_LANGUAGE', payload: e.target.value as CVLanguage })}
                        className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                    >
                        <option value="en">English</option>
                        <option value="fr">Français</option>
                    </select>
                </div>
                <span
                    className={`hidden md:inline text-xs ${saveStatus === 'error' ? 'text-amber-400' : 'text-zinc-500'}`}
                    title="Your CV is saved in this browser as you type"
                >
                    {SAVE_LABELS[saveStatus]}
                </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                {/* Mobile view toggle */}
                <div className="sm:hidden flex bg-zinc-800 rounded-lg p-0.5">
                    <button
                        onClick={() => onMobileViewChange('editor')}
                        aria-pressed={mobileView === 'editor'}
                        className={`px-3 py-1 text-xs rounded-md transition ${mobileView === 'editor' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400'
                            }`}
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => onMobileViewChange('preview')}
                        aria-pressed={mobileView === 'preview'}
                        className={`px-3 py-1 text-xs rounded-md transition ${mobileView === 'preview' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400'
                            }`}
                    >
                        Preview
                    </button>
                </div>

                {/* Template selector (mobile) */}
                <select
                    aria-label="Resume template"
                    value={cvData.templateId}
                    onChange={(e) => dispatch({ type: 'SET_TEMPLATE', payload: e.target.value as TemplateId })}
                    className="sm:hidden bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-xs text-zinc-200 focus:outline-none"
                >
                    <option value="classic">Classic</option>
                    <option value="minimal">Minimal ATS</option>
                    <option value="designed">Designed resume</option>
                </select>

                {/* Language selector (mobile) */}
                <select
                    aria-label="CV language (section headings)"
                    value={cvData.cvLanguage ?? 'en'}
                    onChange={(e) => dispatch({ type: 'SET_LANGUAGE', payload: e.target.value as CVLanguage })}
                    className="sm:hidden bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-xs text-zinc-200 focus:outline-none"
                >
                    <option value="en">EN</option>
                    <option value="fr">FR</option>
                </select>

                <button
                    onClick={onToggleATS}
                    aria-pressed={showATS}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${showATS
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                        }`}
                >
                    ATS Check
                </button>

                <button
                    onClick={onToggleChat}
                    aria-pressed={showChat}
                    aria-label="AI assistant"
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${showChat
                        ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                        : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                        }`}
                >
                    ✨ AI
                </button>

                <div className="flex items-center gap-1">
                    <button onClick={undo} disabled={!canUndo} aria-label="Undo" title="Undo (Ctrl+Z)" className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-md transition disabled:opacity-40 disabled:hover:bg-zinc-800">
                        ↶
                    </button>
                    <button onClick={redo} disabled={!canRedo} aria-label="Redo" title="Redo (Ctrl+Y)" className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-md transition disabled:opacity-40 disabled:hover:bg-zinc-800">
                        ↷
                    </button>
                </div>

                <div className="hidden sm:flex items-center gap-1.5">
                    <button onClick={newCV} className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-md transition">
                        New CV
                    </button>
                    <span className="text-xs text-zinc-500 ml-1">Load:</span>
                    <button onClick={() => loadSample('student')} className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-md transition">
                        Student
                    </button>
                    <button onClick={() => loadSample('junior')} className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-md transition">
                        Junior Dev
                    </button>
                </div>

                {/* Secondary actions on phones, where the toolbar has no room for them */}
                <div className="relative sm:hidden">
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-expanded={menuOpen}
                        aria-label="More actions"
                        className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-md transition"
                    >
                        ⋯
                    </button>
                    {menuOpen && (
                        <>
                            <div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => setMenuOpen(false)} />
                            <div className="absolute right-0 top-full mt-1 z-50 w-52 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl py-1 overflow-hidden">
                                <button onClick={() => { newCV(); setMenuOpen(false); }} className={menuItem}>New blank CV</button>
                                <button onClick={() => { loadSample('student'); setMenuOpen(false); }} className={menuItem}>Load Student sample</button>
                                <button onClick={() => { loadSample('junior'); setMenuOpen(false); }} className={menuItem}>Load Junior Dev sample</button>
                                <div className="my-1 border-t border-zinc-700" />
                                <ExportControls variant="menu" onDone={() => setMenuOpen(false)} />
                                <p className="px-3 pt-1 pb-2 text-xs text-zinc-500">{SAVE_LABELS[saveStatus]} in this browser</p>
                            </div>
                        </>
                    )}
                </div>

                <ExportControls />
            </div>
        </div>
    );
}
