import { useCV } from '../context/CVContext';
import type { CVLanguage, TemplateId } from '../types';
import { studentCV, juniorDevCV } from '../data/sampleData';
import ExportControls from './export/ExportControls';

interface Props {
    showATS: boolean;
    onToggleATS: () => void;
    showChat: boolean;
    onToggleChat: () => void;
    mobileView: 'editor' | 'preview';
    onMobileViewChange: (view: 'editor' | 'preview') => void;
}

export default function Toolbar({ showATS, onToggleATS, showChat, onToggleChat, mobileView, onMobileViewChange }: Props) {
    const { cvData, dispatch } = useCV();

    const loadSample = (sample: 'student' | 'junior') => {
        const data = sample === 'student' ? studentCV : juniorDevCV;
        dispatch({ type: 'LOAD_DATA', payload: JSON.parse(JSON.stringify(data)) });
    };

    return (
        <div className="no-print bg-zinc-900 border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
                <h1 className="text-base font-bold text-zinc-100 tracking-tight">
                    <span className="text-blue-400">ATS</span> CV Builder
                </h1>
                <div className="hidden sm:flex items-center gap-1.5 ml-2">
                    <span className="text-xs text-zinc-500">Template:</span>
                    <select
                        value={cvData.templateId}
                        onChange={(e) => dispatch({ type: 'SET_TEMPLATE', payload: e.target.value as TemplateId })}
                        className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                    >
                        <option value="classic">Classic ATS</option>
                        <option value="minimal">Minimal ATS</option>
                    </select>
                </div>
                <div className="hidden sm:flex items-center gap-1.5">
                    <span className="text-xs text-zinc-500">Langue:</span>
                    <select
                        value={cvData.cvLanguage ?? 'en'}
                        onChange={(e) => dispatch({ type: 'SET_LANGUAGE', payload: e.target.value as CVLanguage })}
                        className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                    >
                        <option value="en">English</option>
                        <option value="fr">Français</option>
                    </select>
                </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                {/* Mobile view toggle */}
                <div className="sm:hidden flex bg-zinc-800 rounded-lg p-0.5">
                    <button
                        onClick={() => onMobileViewChange('editor')}
                        className={`px-3 py-1 text-xs rounded-md transition ${mobileView === 'editor' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400'
                            }`}
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => onMobileViewChange('preview')}
                        className={`px-3 py-1 text-xs rounded-md transition ${mobileView === 'preview' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400'
                            }`}
                    >
                        Preview
                    </button>
                </div>

                {/* Template selector (mobile) */}
                <select
                    value={cvData.templateId}
                    onChange={(e) => dispatch({ type: 'SET_TEMPLATE', payload: e.target.value as TemplateId })}
                    className="sm:hidden bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-xs text-zinc-200 focus:outline-none"
                >
                    <option value="classic">Classic</option>
                    <option value="minimal">Minimal</option>
                </select>

                {/* Language selector (mobile) */}
                <select
                    value={cvData.cvLanguage ?? 'en'}
                    onChange={(e) => dispatch({ type: 'SET_LANGUAGE', payload: e.target.value as CVLanguage })}
                    className="sm:hidden bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-xs text-zinc-200 focus:outline-none"
                >
                    <option value="en">EN</option>
                    <option value="fr">FR</option>
                </select>

                <button
                    onClick={onToggleATS}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${showATS
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                        }`}
                >
                    ATS Check
                </button>

                <button
                    onClick={onToggleChat}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${showChat
                        ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                        : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                        }`}
                >
                    ✨ AI
                </button>

                <div className="hidden sm:flex items-center gap-1.5">
                    <span className="text-xs text-zinc-500">Load:</span>
                    <button onClick={() => loadSample('student')} className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-md transition">
                        Student
                    </button>
                    <button onClick={() => loadSample('junior')} className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-md transition">
                        Junior Dev
                    </button>
                </div>

                <ExportControls />
            </div>
        </div>
    );
}
