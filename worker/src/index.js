/**
 * CV Studio AI proxy: forwards chat requests to Google Gemini with a key kept as a
 * Cloudflare secret, so visitors don't need their own. Deployed with `npx wrangler deploy`.
 *
 * It's public, so it only accepts small CV-assistant requests from the app's own origins,
 * with a per-visitor rate limit.
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MAX_BODY_BYTES = 100_000;
const MAX_MESSAGES = 30;
const MAX_MESSAGE_CHARS = 4_000;
const MAX_SYSTEM_CHARS = 60_000;

function list(value) {
    return (value ?? '').split(',').map((s) => s.trim()).filter(Boolean);
}

function json(body, status, headers) {
    return new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } });
}

function corsHeaders(origin) {
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
        Vary: 'Origin',
    };
}

/** Returns an error message, or null when the request body is acceptable. */
function validate(body) {
    if (!body || typeof body !== 'object') return 'Invalid request.';
    const { messages, systemInstruction } = body;
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) return 'Too many or no messages.';
    for (const m of messages) {
        if (!m || (m.role !== 'user' && m.role !== 'model') || typeof m.text !== 'string' || m.text.length > MAX_MESSAGE_CHARS) {
            return 'Invalid message.';
        }
    }
    if (typeof systemInstruction !== 'string' || systemInstruction.length > MAX_SYSTEM_CHARS) return 'Invalid instructions.';
    return null;
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const origin = request.headers.get('Origin') ?? '';
        const allowed = list(env.ALLOWED_ORIGINS);

        // Browsers always send Origin on these cross-site calls; anything else isn't the app.
        if (!allowed.includes(origin)) return json({ error: 'Origin not allowed.' }, 403, {});
        const cors = corsHeaders(origin);
        if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

        if (url.pathname === '/api/ai/health' && request.method === 'GET') {
            return json({ status: env.GEMINI_API_KEY ? 'ok' : 'unconfigured' }, 200, cors);
        }
        if (url.pathname !== '/api/ai' || request.method !== 'POST') return json({ error: 'Not found.' }, 404, cors);
        if (!env.GEMINI_API_KEY) return json({ error: 'The AI server is not configured yet.' }, 503, cors);

        if (env.RATE_LIMITER) {
            const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
            const { success } = await env.RATE_LIMITER.limit({ key: ip });
            if (!success) return json({ error: 'Too many requests. Please wait a minute and try again.' }, 429, cors);
        }

        const raw = await request.text();
        if (raw.length > MAX_BODY_BYTES) return json({ error: 'Request too large.' }, 413, cors);
        let body;
        try { body = JSON.parse(raw); } catch { return json({ error: 'Invalid JSON.' }, 400, cors); }
        const problem = validate(body);
        if (problem) return json({ error: problem }, 400, cors);

        // Only the models the free tier supports well; anything else falls back to the default.
        const models = list(env.ALLOWED_MODELS);
        const model = models.includes(body.model) ? body.model : models[0];

        const geminiRes = await fetch(`${GEMINI_API_BASE}/${encodeURIComponent(model)}:generateContent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: body.systemInstruction }] },
                contents: body.messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
                generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
            }),
        });

        const data = await geminiRes.json().catch(() => ({}));
        if (geminiRes.status === 429) {
            return json({ error: 'The free AI quota is used up for now. Try again later, or use your own API key.' }, 429, cors);
        }
        if (!geminiRes.ok || data.error) {
            // Don't pass Google's raw errors (they can mention the key's project) back to visitors.
            const reason = data.error?.details?.find((d) => d.reason)?.reason ?? '';
            console.error('Gemini error', geminiRes.status, data.error?.status, reason);
            return json({ error: 'The AI service returned an error. Please try again.' }, 502, cors);
        }
        const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('');
        if (!text) return json({ error: 'The AI returned an empty answer. Please try again.' }, 502, cors);
        return json({ text }, 200, cors);
    },
};
