const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const PROXY_URL = '/api/ai';
const PROXY_HEALTH_URL = '/api/ai/health';
const STORAGE_KEY = 'cv-builder-gemini-key';
const MODEL_KEY = 'cv-builder-gemini-model';
const PROXY_STATUS_KEY = 'cv-builder-proxy-available';

export const AVAILABLE_MODELS = [
    { id: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite (recommended)' },
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
] as const;

export type GeminiModelId = typeof AVAILABLE_MODELS[number]['id'];

// --- API Key management (fallback mode) ---

export function getApiKey(): string {
    return localStorage.getItem(STORAGE_KEY) || '';
}

export function setApiKey(key: string) {
    localStorage.setItem(STORAGE_KEY, key);
}

export function clearApiKey() {
    localStorage.removeItem(STORAGE_KEY);
}

// --- Model selection ---

export function getModel(): GeminiModelId {
    return (localStorage.getItem(MODEL_KEY) as GeminiModelId) || 'gemini-2.0-flash-lite';
}

export function setModel(model: GeminiModelId) {
    localStorage.setItem(MODEL_KEY, model);
}

// --- Proxy detection ---

let proxyChecked = false;
let proxyAvailable = false;

export async function checkProxyAvailable(): Promise<boolean> {
    if (proxyChecked) return proxyAvailable;

    // Quick check from sessionStorage to avoid repeated network calls
    const cached = sessionStorage.getItem(PROXY_STATUS_KEY);
    if (cached !== null) {
        proxyAvailable = cached === 'true';
        proxyChecked = true;
        return proxyAvailable;
    }

    try {
        const res = await fetch(PROXY_HEALTH_URL, { signal: AbortSignal.timeout(2000) });
        const data = await res.json();
        proxyAvailable = data.status === 'ok';
    } catch {
        proxyAvailable = false;
    }
    proxyChecked = true;
    sessionStorage.setItem(PROXY_STATUS_KEY, String(proxyAvailable));
    return proxyAvailable;
}

export function isProxyAvailable(): boolean {
    return proxyAvailable;
}

// --- Message types ---

interface GeminiMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

interface GeminiResponse {
    candidates?: {
        content: {
            parts: { text: string }[];
        };
    }[];
    error?: {
        message: string;
    };
}

// --- Send message (proxy-first, fallback to direct) ---

export async function sendMessageViaProxy(
    messages: ChatMessage[],
    cvJson: unknown,
    language: string,
    model: GeminiModelId
): Promise<string> {
    const res = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, cvJson, language, model }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
        throw new Error(data.error || `Proxy error (${res.status})`);
    }

    if (!data.text) throw new Error('Empty response from AI');
    return data.text;
}

export async function sendMessageDirect(
    apiKey: string,
    model: GeminiModelId,
    history: GeminiMessage[],
    userMessage: string,
    systemInstruction: string
): Promise<string> {
    const contents: GeminiMessage[] = [
        ...history,
        { role: 'user', parts: [{ text: userMessage }] },
    ];

    const body = {
        system_instruction: {
            parts: [{ text: systemInstruction }],
        },
        contents,
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
        },
    };

    const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    const data: GeminiResponse = await res.json();

    if (!res.ok || data.error) {
        throw new Error(data.error?.message || `API error (${res.status})`);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response from Gemini');

    return text;
}
