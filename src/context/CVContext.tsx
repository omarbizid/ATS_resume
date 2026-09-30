import React, { createContext, useContext, useReducer, useEffect, useRef, useState, type ReactNode } from 'react';
import type { CVData, CVLanguage, SectionKey, TemplateId } from '../types';
import { studentCV } from '../data/sampleData';

const STORAGE_KEY = 'cv-builder-data';

function loadFromStorage(): CVData | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const data = JSON.parse(raw) as CVData;
            // Migrate: add projects array if missing
            if (!data.projects) {
                data.projects = [];
            }
            // Migrate: add projects section setting if missing
            if (!data.sectionSettings.find((s) => s.key === 'projects')) {
                const maxOrder = Math.max(...data.sectionSettings.map((s) => s.order), -1);
                data.sectionSettings.push({ key: 'projects', label: 'Projects', visible: false, order: maxOrder + 1 });
            }
            return data;
        }
    } catch { /* ignore */ }
    return null;
}

function saveToStorage(data: CVData) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

type Action =
    | { type: 'LOAD_DATA'; payload: CVData }
    | { type: 'SET_FIELD'; payload: { path: string; value: unknown; discrete?: boolean } }
    | { type: 'SET_FIELDS'; payload: { path: string; value: unknown }[] }
    | { type: 'SET_TEMPLATE'; payload: TemplateId }
    | { type: 'SET_LANGUAGE'; payload: CVLanguage }
    | { type: 'TOGGLE_SECTION'; payload: SectionKey }
    | { type: 'REORDER_SECTION'; payload: { key: SectionKey; direction: 'up' | 'down' } }
    | { type: 'MOVE_SECTION'; payload: { fromIndex: number; toIndex: number } }
    | { type: 'REORDER_ITEM'; payload: { section: string; fromIndex: number; toIndex: number } };

function setNestedField(obj: CVData, path: string, value: unknown): CVData {
    const keys = path.split('.');
    // Paths can come from AI output; never let them reach object internals.
    if (keys.some((k) => k === '__proto__' || k === 'prototype' || k === 'constructor')) return obj;
    const result = JSON.parse(JSON.stringify(obj)) as Record<string, unknown>;
    let current: Record<string, unknown> = result;
    for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (current[k] === undefined || current[k] === null) {
            current[k] = isNaN(Number(keys[i + 1])) ? {} : [];
        }
        current = current[k] as Record<string, unknown>;
    }
    current[keys[keys.length - 1]] = value;
    return result as unknown as CVData;
}

function cvReducer(state: CVData, action: Action): CVData {
    switch (action.type) {
        case 'LOAD_DATA': {
            const data = { ...action.payload, projects: action.payload.projects ?? [], cvLanguage: action.payload.cvLanguage ?? 'en' };
            if (!data.sectionSettings.some(s => s.key === 'projects')) {
                data.sectionSettings = [...data.sectionSettings, { key: 'projects', label: 'Projects', visible: false, order: Math.max(-1, ...data.sectionSettings.map(s => s.order)) + 1 }];
            }
            return data;
        }

        case 'SET_FIELD':
            return setNestedField(state, action.payload.path, action.payload.value);

        case 'SET_FIELDS':
            return action.payload.reduce((cv, u) => setNestedField(cv, u.path, u.value), state);

        case 'SET_TEMPLATE':
            return { ...state, templateId: action.payload };

        case 'SET_LANGUAGE':
            return { ...state, cvLanguage: action.payload };

        case 'TOGGLE_SECTION': {
            const settings = state.sectionSettings.map((s) =>
                s.key === action.payload ? { ...s, visible: !s.visible } : s
            );
            return { ...state, sectionSettings: settings };
        }

        case 'REORDER_SECTION': {
            const { key, direction } = action.payload;
            const sorted = [...state.sectionSettings].sort((a, b) => a.order - b.order);
            const idx = sorted.findIndex((s) => s.key === key);
            const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (swapIdx < 0 || swapIdx >= sorted.length) return state;
            const newSettings = sorted.map((s, i) => {
                if (i === idx) return { ...s, order: swapIdx };
                if (i === swapIdx) return { ...s, order: idx };
                return { ...s, order: i };
            });
            return { ...state, sectionSettings: newSettings };
        }

        case 'MOVE_SECTION': {
            const { fromIndex, toIndex } = action.payload;
            const sorted = [...state.sectionSettings].sort((a, b) => a.order - b.order);
            const [moved] = sorted.splice(fromIndex, 1);
            sorted.splice(toIndex, 0, moved);
            const newSettings = sorted.map((s, i) => ({ ...s, order: i }));
            return { ...state, sectionSettings: newSettings };
        }

        case 'REORDER_ITEM': {
            const { section, fromIndex, toIndex } = action.payload;
            const arr = [...(state[section as keyof CVData] as unknown[])];
            const [item] = arr.splice(fromIndex, 1);
            arr.splice(toIndex, 0, item);
            return { ...state, [section]: arr };
        }

        default:
            return state;
    }
}

type HistoryAction = Action | { type: 'UNDO' } | { type: 'REDO' } | { type: 'RESTORE'; payload: CVData };

interface History {
    past: CVData[];
    present: CVData;
    future: CVData[];
    /** Path of the last SET_FIELD, so consecutive edits to one field form a single undo step. */
    lastPath: string | null;
}

const HISTORY_LIMIT = 100;

function commit(state: History, next: CVData, lastPath: string | null): History {
    return { past: [...state.past, state.present].slice(-HISTORY_LIMIT), present: next, future: [], lastPath };
}

function historyReducer(state: History, action: HistoryAction): History {
    switch (action.type) {
        case 'UNDO': {
            if (!state.past.length) return state;
            return { past: state.past.slice(0, -1), present: state.past[state.past.length - 1], future: [state.present, ...state.future], lastPath: null };
        }
        case 'REDO': {
            if (!state.future.length) return state;
            return { past: [...state.past, state.present], present: state.future[0], future: state.future.slice(1), lastPath: null };
        }
        case 'RESTORE':
            return commit(state, action.payload, null);
        default: {
            const next = cvReducer(state.present, action);
            if (next === state.present) return state;
            if (action.type !== 'SET_FIELD' || action.payload.discrete) return commit(state, next, null);
            const { path } = action.payload;
            if (path === state.lastPath) return { ...state, present: next, future: [] };
            return commit(state, next, path);
        }
    }
}

interface Toast {
    id: number;
    message: string;
    /** Snapshot to go back to when the user clicks Undo. */
    restore?: CVData;
}

interface CVContextValue {
    cvData: CVData;
    dispatch: React.Dispatch<HistoryAction>;
    /** Pass a message for destructive edits: it shows a toast with an Undo button. */
    updateField: (path: string, value: unknown, message?: string) => void;
    updateFields: (updates: { path: string; value: unknown }[], message: string) => void;
    loadData: (data: CVData, message: string) => void;
    notify: (message: string) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    /** True when this browser had no saved CV at startup. */
    isNewVisitor: boolean;
}

const CVContext = createContext<CVContextValue | null>(null);

function isEditableTarget(target: EventTarget | null) {
    return target instanceof HTMLElement && !!target.closest('input, textarea, select, [contenteditable="true"]');
}

export function CVProvider({ children }: { children: ReactNode }) {
    const [initial] = useState(() => {
        const saved = loadFromStorage();
        return { data: saved ?? studentCV, isNewVisitor: !saved };
    });
    const [history, dispatch] = useReducer(historyReducer, initial.data, (present): History => ({ past: [], present, future: [], lastPath: null }));
    const cvData = history.present;
    // Callbacks can run after an await (AI replies), so Undo snapshots read the latest state.
    const latest = useRef(cvData);
    useEffect(() => { latest.current = cvData; }, [cvData]);
    const [toast, setToast] = useState<Toast | null>(null);

    const [saveError, setSaveError] = useState(false);
    useEffect(() => {
        const timer = window.setTimeout(() => {
            try { saveToStorage(cvData); setSaveError(false); }
            catch { setSaveError(true); }
        }, 150);
        const flush = () => { try { saveToStorage(cvData); } catch { /* Banner handles storage errors. */ } };
        window.addEventListener('pagehide', flush);
        return () => { clearTimeout(timer); window.removeEventListener('pagehide', flush); };
    }, [cvData]);

    useEffect(() => {
        if (!toast) return;
        const timer = window.setTimeout(() => setToast(null), 6000);
        return () => clearTimeout(timer);
    }, [toast]);

    // Text fields keep the browser's own undo; elsewhere Ctrl+Z / Ctrl+Y undo CV changes.
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (!(e.ctrlKey || e.metaKey) || e.altKey || isEditableTarget(e.target)) return;
            const key = e.key.toLowerCase();
            if (key === 'z' && !e.shiftKey) { e.preventDefault(); dispatch({ type: 'UNDO' }); }
            else if (key === 'y' || (key === 'z' && e.shiftKey)) { e.preventDefault(); dispatch({ type: 'REDO' }); }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    const notify = (message: string, restore?: CVData) => setToast({ id: Date.now(), message, restore });

    const updateField = (path: string, value: unknown, message?: string) => {
        dispatch({ type: 'SET_FIELD', payload: { path, value, discrete: !!message } });
        if (message) notify(message, latest.current);
    };

    const updateFields = (updates: { path: string; value: unknown }[], message: string) => {
        dispatch({ type: 'SET_FIELDS', payload: updates });
        notify(message, latest.current);
    };

    const loadData = (data: CVData, message: string) => {
        dispatch({ type: 'LOAD_DATA', payload: JSON.parse(JSON.stringify(data)) });
        notify(message, latest.current);
    };

    const value: CVContextValue = {
        cvData,
        dispatch,
        updateField,
        updateFields,
        loadData,
        notify: (message) => notify(message),
        undo: () => dispatch({ type: 'UNDO' }),
        redo: () => dispatch({ type: 'REDO' }),
        canUndo: history.past.length > 0,
        canRedo: history.future.length > 0,
        isNewVisitor: initial.isNewVisitor,
    };

    return (
        <CVContext.Provider value={value}>
            {saveError && <div role="alert" className="no-print bg-amber-950 text-amber-100 p-3 text-sm">Automatic saving is unavailable or storage is full. Export JSON to keep your changes and photo.</div>}
            {children}
            {toast && (
                <div role="status" aria-live="polite" className="no-print fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 bg-zinc-800 border border-zinc-600 text-zinc-100 text-sm rounded-lg shadow-2xl pl-4 pr-2 py-2 max-w-[calc(100vw-2rem)]">
                    <span>{toast.message}</span>
                    {toast.restore && (
                        <button
                            onClick={() => { dispatch({ type: 'RESTORE', payload: toast.restore! }); setToast(null); }}
                            className="px-2 py-1 text-blue-300 hover:text-blue-200 font-medium rounded transition"
                        >
                            Undo
                        </button>
                    )}
                    <button onClick={() => setToast(null)} aria-label="Dismiss notification" className="px-1.5 text-zinc-400 hover:text-zinc-200 transition">&times;</button>
                </div>
            )}
        </CVContext.Provider>
    );
}

// The context hook intentionally shares its provider module.
// eslint-disable-next-line react-refresh/only-export-components
export function useCV() {
    const ctx = useContext(CVContext);
    if (!ctx) throw new Error('useCV must be used within CVProvider');
    return ctx;
}
