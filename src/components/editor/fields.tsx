import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { CVLanguage } from '../../types';

const FIELD = 'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition disabled:opacity-50';

interface BulletInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    label: string;
}

/** A bullet point that grows to show all its text, with a length hint for long bullets. */
export function BulletInput({ value, onChange, placeholder, label }: BulletInputProps) {
    const ref = useRef<HTMLTextAreaElement>(null);
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight + 2}px`;
    }, [value]);

    const length = value.length;
    return (
        <div className="flex-1 min-w-0">
            <textarea
                ref={ref}
                rows={1}
                value={value}
                aria-label={label}
                placeholder={placeholder}
                // A bullet is one paragraph: Enter and pasted line breaks must not split it.
                onChange={(e) => onChange(e.target.value.replace(/\s*[\r\n]+\s*/g, ' '))}
                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                className={`${FIELD} block resize-none overflow-hidden`}
            />
            {length > 120 && (
                <p className={`mt-1 text-xs text-right ${length > 200 ? 'text-amber-400' : 'text-zinc-500'}`}>
                    {length} characters{length > 200 ? ': consider shortening to 1–2 lines' : ''}
                </p>
            )}
        </div>
    );
}

const MONTH_LABELS: Record<CVLanguage, string[]> = {
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    fr: ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'],
};

// Spellings accepted when reading dates typed before the picker existed (accents and dots removed).
const MONTH_ALIASES = [
    'jan january janv janvier', 'feb february fev fevr fevrier', 'mar march mars', 'apr april avr avril',
    'may mai', 'jun june juin', 'jul july juil juillet', 'aug august aout', 'sep sept september septembre',
    'oct october octobre', 'nov november novembre', 'dec december decembre',
].map((names) => names.split(' '));

function normalize(word: string) {
    return word.normalize('NFD').replace(/[̀-ͯ.]/g, '').toLowerCase();
}

/** Reads "Sep 2024", "Juin 2025", "2024" or an empty value; null for anything else (e.g. "Expected 2026"). */
function parseDate(value: string): { month: number | null; year: string } | null {
    const match = value.trim().match(/^(?:(\p{L}+\.?)\s*)?(\d{0,4})$/u);
    if (!match) return null;
    if (!match[1]) return { month: null, year: match[2] };
    const month = MONTH_ALIASES.findIndex((aliases) => aliases.includes(normalize(match[1])));
    return month === -1 ? null : { month, year: match[2] };
}

interface DateInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    language: CVLanguage;
}

/** Month and year picker that writes plain text such as "Sep 2024", so templates and old data keep working. */
export function DateInput({ label, value, onChange, language }: DateInputProps) {
    const parsed = parseDate(value);
    const [typing, setTyping] = useState(false);
    const textMode = typing || parsed === null;
    const labelId = useId();

    const compose = (month: number | null, year: string) => {
        onChange(month === null ? year : `${MONTH_LABELS[language][month]} ${year}`.trim());
    };

    return (
        <div role="group" aria-labelledby={labelId}>
            <div className="flex items-baseline justify-between mb-1">
                <span id={labelId} className="text-xs text-zinc-400">{label}</span>
                <button
                    type="button"
                    onClick={() => { if (textMode && parsed === null) onChange(''); setTyping(!textMode); }}
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition"
                >
                    {textMode ? 'Use picker' : 'Type instead'}
                </button>
            </div>
            {textMode ? (
                <input value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} placeholder="e.g. Sep 2024" className={FIELD} />
            ) : (
                <div className="flex gap-1.5">
                    <select
                        value={parsed?.month ?? ''}
                        onChange={(e) => compose(e.target.value === '' ? null : Number(e.target.value), parsed?.year ?? '')}
                        aria-label={`${label} month`}
                        className={`${FIELD} px-2 min-w-0`}
                    >
                        <option value="">Month</option>
                        {MONTH_LABELS[language].map((m, i) => <option key={m} value={i}>{m}</option>)}
                    </select>
                    <input
                        value={parsed?.year ?? ''}
                        onChange={(e) => compose(parsed?.month ?? null, e.target.value.replace(/\D/g, '').slice(0, 4))}
                        inputMode="numeric"
                        aria-label={`${label} year`}
                        placeholder="Year"
                        className={`${FIELD} px-2 w-[4.75rem] shrink-0`}
                    />
                </div>
            )}
        </div>
    );
}
