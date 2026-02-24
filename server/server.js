import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_api_key_here') {
    console.error('\n❌  GEMINI_API_KEY is missing or not configured.');
    console.error('   Copy server/.env.example to server/.env and add your key.');
    console.error('   Get a free key at: https://aistudio.google.com/apikey\n');
    process.exit(1);
}

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/api/ai/health', (_req, res) => {
    res.json({ status: 'ok' });
});

// AI Chat endpoint
app.post('/api/ai', async (req, res) => {
    try {
        const { messages = [], cvJson, language = 'en' } = req.body;

        if (!cvJson) {
            return res.status(400).json({ error: 'cvJson is required' });
        }

        const langLabel = language === 'fr' ? 'French' : 'English';

        const systemInstruction = `You are a professional CV/resume assistant embedded in an ATS-friendly CV Builder app.
Your job is to help the user write, improve, and fill out their CV.
The CV language is set to ${langLabel}, so produce all CV content suggestions in ${langLabel}.
Reply in the same language the user writes to you.

Current CV data (JSON):
${typeof cvJson === 'string' ? cvJson : JSON.stringify(cvJson, null, 2)}

Guidelines:
- Give concise, actionable advice.
- When suggesting text for the CV (summary, bullets, skills, etc.), format it clearly so the user can copy-paste.
- Use strong action verbs for bullet points (e.g., "Developed", "Implemented", "Managed").
- Keep bullet points to 1-2 lines each, quantified where possible.
- If the user asks to "fill" or "improve" a section, produce ready-to-use text.
- If asked something unrelated to CVs, politely redirect to CV topics.
- Never output markdown code fences for CV text — just plain text the user can paste.`;

        // Build Gemini-format contents from messages
        const contents = messages.map((m) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }],
        }));

        const model = req.body.model || 'gemini-2.0-flash-lite';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

        const geminiRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: systemInstruction }] },
                contents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048,
                },
            }),
        });

        const data = await geminiRes.json();

        if (!geminiRes.ok || data.error) {
            const msg = data.error?.message || `Gemini API error (${geminiRes.status})`;
            console.error('Gemini error:', msg);
            return res.status(geminiRes.status || 500).json({ error: msg });
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
            return res.status(500).json({ error: 'Empty response from Gemini' });
        }

        res.json({ text });
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`\n🚀  AI proxy server running at http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/ai/health`);
    console.log(`   Using model: gemini-2.0-flash-lite (configurable per request)\n`);
});
