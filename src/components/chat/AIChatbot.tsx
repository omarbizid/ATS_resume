import { useState, useRef, useEffect } from 'react';
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

function buildSystemPrompt(cvData: CVData): string {
    const lang = cvData.cvLanguage === 'fr' ? 'French' : 'English';
    return `You are a professional CV/resume assistant embedded in an ATS-friendly CV Builder app.
Your job is to help the user write, improve, and fill out their CV.
The CV language is set to ${lang}, so produce all CV content suggestions in ${lang}.
Reply in the same language the user writes to you.

Current CV data (JSON):
${JSON.stringify(cvData, null, 2)}

Guidelines:
- Give concise, actionable advice.
- When suggesting text for the CV (summary, bullets, skills, etc.), format it clearly so the user can copy-paste.
- Use strong action verbs for bullet points (e.g., "Developed", "Implemented", "Managed").
- Keep bullet points to 1-2 lines each, quantified where possible.
- If the user asks to "fill" or "improve" a section, produce ready-to-use text.
- If asked something unrelated to CVs, politely redirect to CV topics.
- Never output markdown code fences for CV text — just plain text the user can paste.`;
}

export default function AIChatbot() {
    const { cvData } = useCV();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [modelId, setModelId] = useState<GeminiModelId>(getModel);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Proxy / key state
    const [proxyMode, setProxyMode] = useState<boolean | null>(null); // null = checking
    const [apiKey, setApiKeyState] = useState(getApiKey);
    const [showKeyInput, setShowKeyInput] = useState(false);
    const [keyDraft, setKeyDraft] = useState('');

    // Check proxy on mount
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

    const removeKey = () => {
        clearApiKey();
        setApiKeyState('');
        if (!isProxyAvailable()) {
            setShowKeyInput(true);
        }
        setMessages([]);
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
                // Proxy mode: send everything to /api/ai
                const allMessages = [...messages, userMsg];
                reply = await sendMessageViaProxy(
                    allMessages,
                    cvData,
                    cvData.cvLanguage ?? 'en',
                    modelId
                );
            } else {
                // Direct mode: call Gemini API with user's key
                const history = messages.map((m) => ({
                    role: m.role as 'user' | 'model',
                    parts: [{ text: m.text }],
                }));
                const systemPrompt = buildSystemPrompt(cvData);
                reply = await sendMessageDirect(apiKey, modelId, history, trimmed, systemPrompt);
            }

            setMessages((prev) => [...prev, { role: 'model', text: reply }]);
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

    // API key setup screen (only in direct mode when no key)
    if (showKeyInput && !proxyMode) {
        return (
            <div className="flex flex-col h-full">
                <div className="px-4 py-3 border-b border-zinc-700/50">
                    <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                        <span className="text-lg">✨</span> AI Assistant
                    </h2>
                </div>
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="max-w-sm w-full space-y-4 text-center">
                        <div className="text-3xl">🔑</div>
                        <h3 className="text-sm font-semibold text-zinc-200">Enter your Gemini API Key</h3>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            The backend proxy is not running. You can either start it
                            (<code className="text-zinc-300">cd server && npm run dev</code>)
                            or enter your API key below.
                        </p>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            Get a free key from{' '}
                            <a
                                href="https://aistudio.google.com/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 underline"
                            >
                                Google AI Studio
                            </a>
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="password"
                                value={keyDraft}
                                onChange={(e) => setKeyDraft(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && saveKey()}
                                placeholder="AIzaSy..."
                                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition"
                            />
                            <button
                                onClick={saveKey}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition"
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
                        <span className="text-lg">✨</span> AI Assistant
                        {proxyMode && (
                            <span className="text-[9px] bg-emerald-900/50 text-emerald-400 px-1.5 py-0.5 rounded-full font-normal">
                                proxy
                            </span>
                        )}
                    </h2>
                    {!proxyMode && apiKey && (
                        <button
                            onClick={removeKey}
                            className="text-[10px] text-zinc-500 hover:text-red-400 transition"
                            title="Remove API key"
                        >
                            Remove key
                        </button>
                    )}
                </div>
                <select
                    value={modelId}
                    onChange={(e) => { const m = e.target.value as GeminiModelId; setModelId(m); setModel(m); }}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-[11px] text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                >
                    {AVAILABLE_MODELS.map((m) => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                </select>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {messages.length === 0 && (
                    <div className="space-y-3 pt-4">
                        <p className="text-xs text-zinc-400 text-center">Ask the AI to help you fill or improve your CV</p>
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
                    <div
                        key={i}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                                    ? 'bg-blue-600/80 text-white rounded-br-sm'
                                    : 'bg-zinc-800 text-zinc-200 border border-zinc-700/50 rounded-bl-sm'
                                }`}
                        >
                            {msg.text}
                        </div>
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
                        ⚠ {error}
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
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition resize-none"
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium rounded-lg transition"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
