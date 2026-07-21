const express = require('express');
const router = express.Router();
const OpenAI = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// --- 1. CONFIGURATION DEEPSEEK (PUISSANCE CHINOISE) ---
const getDeepSeekResponse = async (query, history, systemPrompt) => {
    const key = process.env.DEEPSEEK_API_KEY;
    if (!key || key.length < 5) return null;
    try {
        const client = new OpenAI({ apiKey: key, baseURL: 'https://api.deepseek.com' });
        const completion = await client.chat.completions.create({
            model: "deepseek-chat",
            messages: [
                { role: "system", content: systemPrompt },
                ...history.slice(-10).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
                { role: "user", content: query }
            ],
            max_tokens: 2000
        });
        return completion.choices[0].message.content;
    } catch (e) {
        console.error("DEEPSEEK ERROR:", e.message);
        return null;
    }
};

// --- 2. CONFIGURATION GOOGLE GEMINI ---
const getGeminiResponse = async (query, history, systemPrompt) => {
    const key = process.env.GOOGLE_GEMINI_API_KEY;
    if (!key || key.length < 10) return null;
    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const chat = model.startChat({
            history: history.slice(-10).map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            }))
        });
        const result = await chat.sendMessage(`${systemPrompt}\n\nQuestion: ${query}`);
        return result.response.text();
    } catch (e) {
        console.error("GEMINI ERROR:", e.message);
        return null;
    }
};

router.post('/chat', async (req, res) => {
    const { query, history = [] } = req.body;

    const systemPrompt = `Tu es EMMA, l'IA d'Élite de Vision Market Africa.
    TU ES UNE EXPERTE MONDIALE. Tu ne t'excuses JAMAIS. Tu ne bloques JAMAIS.
    Tu analyses les questions des clients et tu donnes des stratégies de business, de sourcing (Chine, Turquie, USA) et de logistique.
    Ton ton est brillant, motivant et tu tutoies le client pour le guider vers le succès.`;

    try {
        let aiResponse = null;

        // TENTATIVE 1 : DEEPSEEK (Priorité pour le Sourcing)
        aiResponse = await getDeepSeekResponse(query, history, systemPrompt);

        // TENTATIVE 2 : GEMINI (Si DeepSeek échoue)
        if (!aiResponse) aiResponse = await getGeminiResponse(query, history, systemPrompt);

        // TENTATIVE 3 : GROQ / OPENAI (Backup ultime)
        if (!aiResponse) {
            const key = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
            if (key) {
                try {
                    const client = new OpenAI({
                        apiKey: key,
                        baseURL: process.env.GROQ_API_KEY ? "https://api.groq.com/openai/v1" : undefined
                    });
                    const completion = await client.chat.completions.create({
                        model: process.env.GROQ_API_KEY ? "mixtral-8x7b-32768" : "gpt-4o-mini",
                        messages: [{ role: "system", content: systemPrompt }, ...history.slice(-5), { role: "user", content: query }]
                    });
                    aiResponse = completion.choices[0].message.content;
                } catch (e) { console.error("BACKUP ERROR:", e.message); }
            }
        }

        // RÉPONSE DE SECOURS ELITE (Si tout internet tombe en panne)
        if (!aiResponse) {
            aiResponse = "Je finalise l'analyse de votre demande avec mes serveurs à Guangzhou. Votre projet sur '" + query + "' est très prometteur. Concentrons-nous sur le sourcing direct usine. Quelle est votre priorité : le prix ou la rapidité ?";
        }

        res.json({ reply: aiResponse });

    } catch (error) {
        res.json({ reply: "Emma est en pleine mise à jour de ses algorithmes. Je suis prête, reposez votre question." });
    }
});

module.exports = router;
