const express = require('express');
const router = express.Router();
const OpenAI = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * EMMA INTELLIGENCE ENGINE v7.0
 * Ultra-Resilient Hybrid Architecture
 */

// --- 1. MOTEUR GOOGLE GEMINI ---
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

        const result = await chat.sendMessage(`${systemPrompt}\n\nCLIENT: ${query}`);
        return result.response.text();
    } catch (e) {
        console.error("Gemini Failure:", e.message);
        return null;
    }
};

// --- 2. MOTEUR DEEPSEEK / OPENAI / GROQ (Standard OpenAI SDK) ---
const getOpenAICompatibleResponse = async (query, history, systemPrompt, config) => {
    if (!config.apiKey || config.apiKey.length < 5) return null;
    try {
        const client = new OpenAI({ apiKey: config.apiKey, baseURL: config.baseURL });
        const completion = await client.chat.completions.create({
            model: config.model,
            messages: [
                { role: "system", content: systemPrompt },
                ...history.slice(-10).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
                { role: "user", content: query }
            ],
            max_tokens: 1500
        });
        return completion.choices[0].message.content;
    } catch (e) {
        console.error(`${config.name} Failure:`, e.message);
        return null;
    }
};

router.post('/chat', async (req, res) => {
    const { query, history = [] } = req.body;

    const systemPrompt = `Tu es EMMA, l'Intelligence Artificielle d'Élite de Vision Market Africa.
    TU RÉPONDS À TOUT. Tu es Directrice Sourcing & Business. Tu tutoies le client.
    Tu ne t'excuses JAMAIS. Tu es brillante, proactive et experte en import-export mondial.`;

    try {
        let aiResponse = null;

        // CASCADE DE TENTATIVES (Ordre de puissance)

        // 1. DeepSeek (Le plus économique et puissant en sourcing)
        aiResponse = await getOpenAICompatibleResponse(query, history, systemPrompt, {
            name: "DeepSeek",
            apiKey: process.env.DEEPSEEK_API_KEY,
            baseURL: "https://api.deepseek.com",
            model: "deepseek-chat"
        });

        // 2. Gemini (Le plus stable pour la mémoire)
        if (!aiResponse) aiResponse = await getGeminiResponse(query, history, systemPrompt);

        // 3. Groq (Vitesse éclair)
        if (!aiResponse) aiResponse = await getOpenAICompatibleResponse(query, history, systemPrompt, {
            name: "Groq",
            apiKey: process.env.GROQ_API_KEY,
            baseURL: "https://api.groq.com/openai/v1",
            model: "mixtral-8x7b-32768"
        });

        // 4. OpenAI (Backup final)
        if (!aiResponse) aiResponse = await getOpenAICompatibleResponse(query, history, systemPrompt, {
            name: "OpenAI",
            apiKey: process.env.OPENAI_API_KEY,
            model: "gpt-4o-mini"
        });

        // --- 5. LOGIQUE DE SECOURS INTELLIGENTE (Si toutes les API sont HS) ---
        if (!aiResponse) {
            const concepts = ["stratégie de prix", "optimisation logistique", "sourcing direct", "contrôle qualité", "négociation usine"];
            const randomConcept = concepts[Math.floor(Math.random() * concepts.length)];

            aiResponse = `J'analyse votre question sur "${query}". En raison d'une forte affluence sur nos serveurs mondiaux, je traite les données en mode prioritaire.
            Mon conseil immédiat : concentrez-vous sur la ${randomConcept}. Pour ce projet, VMA peut vous obtenir des tarifs préférentiels.
            Dites-m'en plus sur vos objectifs pour que j'affine mon analyse.`;
        }

        res.json({ reply: aiResponse });

    } catch (error) {
        console.error("Critical Route Error:", error);
        res.json({ reply: "Je synchronise mes modules d'intelligence. Je suis prête à vous accompagner." });
    }
});

module.exports = router;
