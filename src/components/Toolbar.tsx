import { useEffect, useState } from 'react';
import { ArrowUUpLeft, ArrowUUpRight, CaretDown, ChatCircleText, Check, DotsThree, ListChecks, WarningCircle } from '@phosphor-icons/react';
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

const SELECT = 'bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-sm text-zinc-200 hover:border-zinc-700 focus:outline-none';
const QUIET = 'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100';
const TOGGLE_ON = 'bg-accent-500/15 text-accent-300 border-accent-500/40';
const TOGGLE_OFF = 'border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100';

function SaveStatus({ status }: { status: 'saved' | 'saving' | 'error' }) {
    if (status === 'error') return <span className="inline-flex items-center gap-1 text-sm text-amber-400"><WarningCircle />Not saved</span>;
    if (status === 'saving') return <span className="text-sm text-zinc-500">Saving…</span>;
    return <span className="inline-flex items-center gap-1 text-sm text-zinc-500"><Check />Saved</span>;
}

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

    const menuItem = 'w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800';
    const templateSelect = (
        <select
            aria-label="Resume template"
            value={cvData.templateId}
            onChange={(e) => dispatch({ type: 'SET_TEMPLATE', payload: e.target.value as TemplateId })}
            className={SELECT}
        >
            <option value="classic">Classic ATS</option>
            <option value="minimal">Minimal ATS</option>
            <option value="designed">Designed resume (photo)</option>
        </select>
    );
    const languageSelect = (short: boolean) => (
        <select
            aria-label="CV language (section headings)"
            value={cvData.cvLanguage ?? 'en'}
            onChange={(e) => dispatch({ type: 'SET_LANGUAGE', payload: e.target.value as CVLanguage })}
            className={SELECT}
        >
            <option value="en">{short ? 'EN' : 'English'}</option>
            <option value="fr">{short ? 'FR' : 'Français'}</option>
        </select>
    );

    return (
        <header className="no-print bg-zinc-950 border-b border-zinc-800/80 px-4 py-2.5 flex items-center justify-between gap-x-4 gap-y-2 flex-wrap">
            <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
                <h1 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-zinc-100 shrink-0">
                    <span aria-hidden="true" className="grid place-items-center w-6 h-6 rounded-md bg-accent-600 text-[11px] font-bold text-white">CV</span>
                    CV Studio
                </h1>
                <div className="hidden sm:flex items-center gap-2">
                    {templateSelect}
                    {languageSelect(false)}
                </div>
                <span className="hidden md:inline-flex" title="Your CV is saved in this browser as you type">
                    <SaveStatus status={saveStatus} />
                </span>
                {/* Phone: switch between the editor and the preview */}
                <div className="sm:hidden ml-auto flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                    {(['editor', 'preview'] as const).map((view) => (
                        <button
                            key={view}
                            onClick={() => onMobileViewChange(view)}
                            aria-pressed={mobileView === view}
                            className={`px-3 py-1 text-sm rounded-md ${mobileView === view ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400'}`}
                        >
                            {view === 'editor' ? 'Edit' : 'Preview'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                {/* Phone: template and language get their own row */}
                <div className="sm:hidden flex items-center gap-2 w-full [&>select:first-child]:flex-1">
                    {templateSelect}
                    {languageSelect(true)}
                </div>

                <button onClick={onToggleATS} aria-pressed={showATS} aria-label="ATS check" className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-sm ${showATS ? TOGGLE_ON : TOGGLE_OFF}`}>
                    <ListChecks /><span className="sm:hidden">ATS</span><span className="hidden sm:inline">ATS check</span>
                </button>
                <button onClick={onToggleChat} aria-pressed={showChat} aria-label="AI assistant" className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-sm ${showChat ? TOGGLE_ON : TOGGLE_OFF}`}>
                    <ChatCircleText /><span className="sm:hidden">AI</span><span className="hidden sm:inline">AI assistant</span>
                </button>

                <span className="hidden sm:block w-px h-5 bg-zinc-800" aria-hidden="true" />

                <div className="flex items-center">
                    <button onClick={undo} disabled={!canUndo} aria-label="Undo" title="Undo (Ctrl+Z)" className={`${QUIET} disabled:opacity-35 disabled:hover:bg-transparent`}>
                        <ArrowUUpLeft />
                    </button>
                    <button onClick={redo} disabled={!canRedo} aria-label="Redo" title="Redo (Ctrl+Y)" className={`${QUIET} disabled:opacity-35 disabled:hover:bg-transparent`}>
                        <ArrowUUpRight />
                    </button>
                </div>

                {/* New CV, samples and JSON backups: secondary actions, one menu on every screen size */}
                <div className="relative">
                    <button onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} className={QUIET}>
                        <DotsThree className="sm:hidden" />
                        <span className="sm:hidden sr-only">More actions</span>
                        <span className="hidden sm:inline">File</span>
                        <CaretDown className={`hidden sm:block transition-transform ${menuOpen ? 'rotate-180' : ''}`} size={12} />
                    </button>
                    {menuOpen && (
                        <>
                            <div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => setMenuOpen(false)} />
                            <div className="absolute right-0 top-full mt-1.5 z-50 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/40 py-1.5 overflow-hidden">
                                <button onClick={() => { newCV(); setMenuOpen(false); }} className={menuItem}>New blank CV</button>
                                <button onClick={() => { loadSample('student'); setMenuOpen(false); }} className={menuItem}>Load Student sample</button>
                                <button onClick={() => { loadSample('junior'); setMenuOpen(false); }} className={menuItem}>Load Junior Dev sample</button>
                                <div className="my-1.5 border-t border-zinc-800" />
                                <ExportControls variant="menu" onDone={() => setMenuOpen(false)} />
                                <p className="md:hidden px-3 pt-1.5 pb-1"><SaveStatus status={saveStatus} /></p>
                            </div>
                        </>
                    )}
                </div>

                <ExportControls />
            </div>
        </header>
    );
}
