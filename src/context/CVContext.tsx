import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { CVData, CVLanguage, SectionKey, TemplateId } from '../types';
import { studentCV } from '../data/sampleData';

const STORAGE_KEY = 'cv-builder-data';

function loadFromStorage(): CVData | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return null;
}

function saveToStorage(data: CVData) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

type Action =
    | { type: 'LOAD_DATA'; payload: CVData }
    | { type: 'SET_FIELD'; payload: { path: string; value: unknown } }
    | { type: 'SET_TEMPLATE'; payload: TemplateId }
    | { type: 'SET_LANGUAGE'; payload: CVLanguage }
    | { type: 'TOGGLE_SECTION'; payload: SectionKey }
    | { type: 'REORDER_SECTION'; payload: { key: SectionKey; direction: 'up' | 'down' } }
    | { type: 'REORDER_ITEM'; payload: { section: string; fromIndex: number; toIndex: number } };

function setNestedField(obj: CVData, path: string, value: unknown): CVData {
    const keys = path.split('.');
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
        case 'LOAD_DATA':
            return action.payload;

        case 'SET_FIELD':
            return setNestedField(state, action.payload.path, action.payload.value);

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

interface CVContextValue {
    cvData: CVData;
    dispatch: React.Dispatch<Action>;
    updateField: (path: string, value: unknown) => void;
}

const CVContext = createContext<CVContextValue | null>(null);

export function CVProvider({ children }: { children: ReactNode }) {
    const [cvData, dispatch] = useReducer(cvReducer, null, () => {
        return loadFromStorage() || studentCV;
    });

    useEffect(() => {
        saveToStorage(cvData);
    }, [cvData]);

    const updateField = (path: string, value: unknown) => {
        dispatch({ type: 'SET_FIELD', payload: { path, value } });
    };

    return (
        <CVContext.Provider value={{ cvData, dispatch, updateField }}>
            {children}
        </CVContext.Provider>
    );
}

export function useCV() {
    const ctx = useContext(CVContext);
    if (!ctx) throw new Error('useCV must be used within CVProvider');
    return ctx;
}
