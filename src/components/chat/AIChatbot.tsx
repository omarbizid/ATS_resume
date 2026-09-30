import { useState, useRef, useEffect } from 'react';
import { ChatCircleText, CheckCircle, Key, WarningCircle } from '@phosphor-icons/react';
import { useCV } from '../../context/CVContext';
import {
    sendMessageViaProxy,
    sendMessageDirect,
    checkProxyAvailable,
    isProxyAvailable,
    getApiKey,
    setApiKey,
    clearApiKey,
    getModel,
    setModel,
    AVAILABLE_MODELS,
} from '../../services/gemini';
import type { GeminiModelId } from '../../services/gemini';
import type { CVData } from '../../types';

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

interface CVUpdate {
    path: string;
    value: unknown;
}

// --- System prompt with auto-apply instructions ---

function buildSystemPrompt(cvData: CVData): string {
    const lang = cvData.cvLanguage === 'fr' ? 'French' : 'English';
    return `You are a professional CV/resume assistant embedded in an ATS-friendly CV Builder app.
Your job is to help the user write, improve, and fill out their CV.
The CV language is set to ${lang}, so produce all CV content suggestions in ${lang}.
Reply in the same language the user writes to you.

Current CV data (JSON):
${JSON.stringify({ ...cvData, design: undefined }, null, 2)}

IMPORTANT — APPLYING CHANGES:
When the user asks you to change, add, improve, or fill a section of their CV, you MUST include a JSON action block so the changes are applied automatically.

To apply changes, output one or more action blocks using this exact format:

<<<CV_UPDATE>>>
{"path": "field.path", "value": "new value"}
<<<END_UPDATE>>>

The "path" uses dot notation matching the CV JSON structure. Examples:
- "summary.text" → updates the summary text
- "personal.fullName" → updates the full name
- "personal.targetTitle" → updates the target title
- "experience.0.bullets" → replaces bullets array for first experience
- "experience.0.role" → updates role of first experience
- "skillGroups.0.skills" → replaces skills array for first skill group
- "projects.0.title" → updates title of first project
- "projects.0.bullets" → replaces bullets of first project
- "languages" → replaces entire languages array

For arrays (bullets, skills, etc.), provide the full array as value.

You can include multiple <<<CV_UPDATE>>> blocks in one response.

ALWAYS include the action block(s) when the user wants a modification. First explain what you changed briefly, then include the action block(s).

Guidelines:
- Give concise, actionable advice.
- Use strong action verbs for bullet points (e.g., "Developed", "Implemented", "Managed").
- Keep bullet points to 1-2 lines each, quantified where possible.
- If the user asks to "fill" or "improve" a section, produce ready-to-use text AND the action blocks.
- If asked something unrelated to CVs, politely redirect to CV topics.`;
}

// --- Parse CV_UPDATE blocks from AI response ---

// The backend proxy only exists when running the app locally.
const IS_LOCAL_DEV = ['localhost', '127.0.0.1'].includes(window.location.hostname);

/** Sections the AI may change, with the names shown to the user. */
const EDITABLE_SECTIONS: Record<string, string> = {
    personal: 'Personal information',
    summary: 'Summary',
    experience: 'Work experience',
    education: 'Education',
    skillGroups: 'Skills',
    certifications: 'Certifications',
    languages: 'Languages',
    extracurriculars: 'Extracurriculars',
    projects: 'Projects',
};

// AI output is untrusted: only CV content may change, never settings, the photo or object internals.
function isEditablePath(path: unknown): path is string {
    if (typeof path !== 'string') return false;
    const keys = path.split('.');
    return Object.hasOwn(EDITABLE_SECTIONS, keys[0]) && keys.every((k) => k !== '' && k !== '__proto__' && k !== 'prototype' && k !== 'constructor');
}

function changedSections(updates: CVUpdate[]): string {
    return [...new Set(updates.map((u) => EDITABLE_SECTIONS[u.path.split('.')[0]]))].join(', ');
}

function parseUpdates(text: string): { cleanText: string; updates: CVUpdate[] } {
    const updates: CVUpdate[] = [];
    let cleanText = text;

    const regex = /<<<CV_UPDATE>>>\s*\n?([\s\S]*?)\n?<<<END_UPDATE>>>/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
        try {
            const parsed = JSON.parse(match[1].trim());
            if (isEditablePath(parsed.path) && parsed.value !== undefined) {
                updates.push({ path: parsed.path, value: parsed.value });
            }
        } catch {
            // Skip malformed JSON
        }
        cleanText = cleanText.replace(match[0], '');
    }

    // Clean up extra whitespace
    cleanText = cleanText.replace(/\n{3,}/g, '\n\n').trim();

    return { cleanText, updates };
}

function describeUpdates(updates: CVUpdate[]): string {
    return updates.length === 1 ? 'AI updated 1 field' : `AI updated ${updates.length} fields`;
}

export default function AIChatbot() {
    const { cvData, updateFields } = useCV();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [modelId, setModelId] = useState<GeminiModelId>(getModel);
    const [pendingUpdates, setPendingUpdates] = useState<Map<number, CVUpdate[]>>(new Map());
    const [appliedUpdates, setAppliedUpdates] = useState<Set<number>>(new Set());
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Proxy / key state
    const [proxyMode, setProxyMode] = useState<boolean | null>(null);
    const [apiKey, setApiKeyState] = useState(getApiKey);
    const [showKeyInput, setShowKeyInput] = useState(false);
    const [keyDraft, setKeyDraft] = useState('');

    useEffect(() => {
        checkProxyAvailable().then((available) => {
            setProxyMode(available);
            if (!available && !getApiKey()) {
                setShowKeyInput(true);
            }
        });
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const saveKey = () => {
        const trimmed = keyDraft.trim();
        if (!trimmed) return;
        setApiKey(trimmed);
        setApiKeyState(trimmed);
        setShowKeyInput(false);
        setKeyDraft('');
        setError('');
    };

    const switchToOwnKey = () => {
        setProxyMode(false);
        setShowKeyInput(!getApiKey());
        setError('');
    };

    const switchToFreeAI = () => {
        setProxyMode(true);
        setShowKeyInput(false);
        setError('');
    };

    const removeKey = () => {
        clearApiKey();
        setApiKeyState('');
        if (!isProxyAvailable()) {
            setShowKeyInput(true);
        }
        setMessages([]);
    };

    const applyUpdates = (messageIndex: number) => {
        const updates = pendingUpdates.get(messageIndex);
        if (!updates) return;

        updateFields(updates, describeUpdates(updates));
        setAppliedUpdates((prev) => new Set(prev).add(messageIndex));
    };

    const handleSend = async () => {
        const trimmed = input.trim();
        if (!trimmed || loading) return;

        const userMsg: ChatMessage = { role: 'user', text: trimmed };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setLoading(true);
        setError('');

        try {
            let reply: string;

            if (proxyMode) {
                const allMessages = [...messages, userMsg];
                reply = await sendMessageViaProxy(
                    allMessages,
                    { ...cvData, design: undefined },
                    cvData.cvLanguage ?? 'en',
                    modelId,
                    buildSystemPrompt(cvData)
                );
            } else {
                const history = messages.map((m) => ({
                    role: m.role as 'user' | 'model',
                    parts: [{ text: m.text }],
                }));
                const systemPrompt = buildSystemPrompt(cvData);
                reply = await sendMessageDirect(apiKey, modelId, history, trimmed, systemPrompt);
            }

            // Parse any CV_UPDATE blocks from the response
            const { cleanText, updates } = parseUpdates(reply);
            const newMsgIndex = messages.length + 1; // +1 because userMsg was added

            setMessages((prev) => [...prev, { role: 'model', text: cleanText }]);

            if (updates.length > 0) {
                setPendingUpdates((prev) => new Map(prev).set(newMsgIndex, updates));

                // Auto-apply as one undoable step; the toast offers Undo.
                updateFields(updates, describeUpdates(updates));
                setAppliedUpdates((prev) => new Set(prev).add(newMsgIndex));
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const quickPrompts = [
        'Improve my summary',
        'Suggest better bullet points for my experience',
        'What skills should I add?',
        'Review my CV for ATS compatibility',
    ];

    // Loading state while checking proxy
    if (proxyMode === null) {
        return (
            <div className="flex flex-col h-full items-center justify-center">
                <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <p className="text-xs text-zinc-500 mt-2">Connecting...</p>
            </div>
        );
    }

    // API key setup screen
    if (showKeyInput && !proxyMode) {
        return (
            <div className="flex flex-col h-full">
                <div className="px-4 py-3 border-b border-zinc-700/50">
                    <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                        <ChatCircleText size={18} className="text-accent-400" /> AI assistant
                    </h2>
                </div>
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="max-w-sm w-full space-y-4 text-center">
                        <Key size={28} className="mx-auto text-accent-400" />
                        <h3 className="text-sm font-semibold text-zinc-200">Enter your Gemini API key</h3>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            The assistant uses Google Gemini with your own free API key. The key is saved only in this
                            browser, and your CV text (not your photo) is sent to Google when you ask a question.
                        </p>
                        {IS_LOCAL_DEV && (
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                Or start the backend proxy (<code className="text-zinc-300">cd server && npm run dev</code>) to use a server-side key.
                            </p>
                        )}
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            Get a free key from{' '}
                            <a
                                href="https://aistudio.google.com/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent-400 hover:text-accent-300 underline"
                            >
                                Google AI Studio
                            </a>
                        </p>
                        {isProxyAvailable() && (
                            <button onClick={switchToFreeAI} className="text-xs text-accent-400 hover:text-accent-300 underline">
                                Use the free AI instead
                            </button>
                        )}
                        <div className="flex gap-2">
                            <input
                                type="password"
                                value={keyDraft}
                                onChange={(e) => setKeyDraft(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && saveKey()}
                                placeholder="AIzaSy..."
                                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500 transition"
                            />
                            <button
                                onClick={saveKey}
                                className="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white text-sm font-medium rounded-lg transition"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-4 py-3 border-b border-zinc-700/50 space-y-2">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                        <ChatCircleText size={18} className="text-accent-400" /> AI assistant
                        {proxyMode && (
                            <span className="text-xs bg-accent-500/15 text-accent-300 px-1.5 py-0.5 rounded font-medium">
                                Free
                            </span>
                        )}
                    </h2>
                    <div className="flex items-center gap-3">
                        {proxyMode ? (
                            <button onClick={switchToOwnKey} className="text-xs text-zinc-500 hover:text-zinc-300 transition">
                                Use my own key
                            </button>
                        ) : (
                            isProxyAvailable() && (
                                <button onClick={switchToFreeAI} className="text-xs text-zinc-500 hover:text-zinc-300 transition">
                                    Use free AI
                                </button>
                            )
                        )}
                        {!proxyMode && apiKey && (
                            <button
                                onClick={removeKey}
                                className="text-xs text-zinc-500 hover:text-red-400 transition"
                                title="Remove API key"
                            >
                                Remove key
                            </button>
                        )}
                    </div>
                </div>
                {proxyMode ? (
                    <p className="text-xs text-zinc-500">Gemini 2.5 Flash, shared free quota: if it's busy, wait a minute or use your own key.</p>
                ) : (
                    <select
                        aria-label="AI model"
                        value={modelId}
                        onChange={(e) => { const m = e.target.value as GeminiModelId; setModelId(m); setModel(m); }}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-accent-500/50"
                    >
                        {AVAILABLE_MODELS.map((m) => (
                            <option key={m.id} value={m.id}>{m.label}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {messages.length === 0 && (
                    <div className="space-y-3 pt-4">
                        <p className="text-xs text-zinc-400 text-center">Ask the AI to help you fill or improve your CV. Changes are applied automatically, and you can undo them.</p>
                        <p className="text-xs text-zinc-500 text-center">
                            Your CV text (not your photo) is sent to Google Gemini to answer.{' '}
                            {proxyMode
                                ? 'On this free service Google may use it to improve its products, so leave out anything you would not want to share.'
                                : 'How Google handles it depends on your API key’s plan.'}
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                            {quickPrompts.map((prompt, i) => (
                                <button
                                    key={i}
                                    onClick={() => setInput(prompt)}
                                    className="text-left px-3 py-2 bg-zinc-800/60 border border-zinc-700/50 rounded-lg text-xs text-zinc-300 hover:bg-zinc-700/60 hover:text-zinc-100 transition"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i}>
                        <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div
                                className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                                    ? 'bg-accent-600 text-white rounded-br-sm'
                                    : 'bg-zinc-800 text-zinc-200 border border-zinc-700/50 rounded-bl-sm'
                                    }`}
                            >
                                {msg.text}
                            </div>
                        </div>
                        {/* Applied indicator for AI messages with updates */}
                        {msg.role === 'model' && appliedUpdates.has(i) && (
                            <div className="flex justify-start mt-1 ml-1">
                                <span className="text-xs text-emerald-400 flex items-center gap-1">
                                    <CheckCircle /> Updated: {changedSections(pendingUpdates.get(i) ?? [])}
                                </span>
                            </div>
                        )}
                        {/* Manual apply button if updates exist but weren't auto-applied */}
                        {msg.role === 'model' && pendingUpdates.has(i) && !appliedUpdates.has(i) && (
                            <div className="flex justify-start mt-1.5 ml-1">
                                <button
                                    onClick={() => applyUpdates(i)}
                                    className="px-3 py-1 bg-accent-600 hover:bg-accent-700 text-white text-xs font-medium rounded-lg transition flex items-center gap-1"
                                >
                                    Apply changes
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-zinc-800 border border-zinc-700/50 rounded-xl rounded-bl-sm px-4 py-3">
                            <div className="flex gap-1.5">
                                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="px-3 py-2 bg-red-900/30 border border-red-700/50 rounded-lg text-xs text-red-300">
                        <WarningCircle className="inline -mt-0.5 mr-1" />{error}
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-zinc-700/50">
                <div className="flex gap-2">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about your CV..."
                        rows={1}
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500 transition resize-none"
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className="px-3 py-2 bg-accent-600 hover:bg-accent-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium rounded-lg transition"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
