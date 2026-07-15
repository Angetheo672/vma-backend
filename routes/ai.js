const express = require('express');
const router = express.Router();
const OpenAI = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// CONFIGURATION DES MOTEURS D'INTELLIGENCE
const getDeepSeekClient = () => {
    const key = process.env.DEEPSEEK_API_KEY;
    if (!key || key.includes('votre_cle')) return null;
    return new OpenAI({ baseURL: 'https://api.deepseek.com', apiKey: key });
};

const getOpenAIClient = () => {
    const key = process.env.OPENAI_API_KEY;
    if (!key || key.includes('votre_cle')) return null;
    return new OpenAI({ apiKey: key });
};

const getGroqClient = () => {
    const key = process.env.GROQ_API_KEY;
    if (!key) return null;
    return new OpenAI({ baseURL: 'https://api.groq.com/openai/v1', apiKey: key });
};

/**
 * ENGINE: GOOGLE GEMINI (Multi-turn Support)
 */
const getGeminiResponse = async (query, history, systemPrompt) => {
    const key = process.env.GOOGLE_GEMINI_API_KEY;
    if (!key || key.includes('votre_cle')) return null;
    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Format history for Gemini
        const chat = model.startChat({
            history: history.map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            })),
            generationConfig: { maxOutputTokens: 1000 }
        });

        const result = await chat.sendMessage(`${systemPrompt}\n\n${query}`);
        return result.response.text();
    } catch (e) {
        console.error("Gemini Error:", e.message);
        return null;
    }
};

router.post('/chat', async (req, res) => {
    const { query, history = [], userId } = req.body;

    const GLOBAL_KNOWLEDGE = `
    DÉLAIS DE LIVRAISON MONDIAUX :
    - Chine vers Afrique (Avion) : 7-12 jours. (Bateau) : 35-45 jours.
    - Turquie vers Afrique (Avion) : 3-5 jours.
    TARIFS LOGISTIQUES (ESTIMATIONS) :
    - Fret Aérien : 8000 - 12000 F CFA / kg.
    - Fret Maritime : 450.000 - 600.000 F CFA / CBM.
    PLATEFORMES DE SOURCING :
    - 1688.com : Prix d'usine (Chine), agent VMA requis.
    - Alibaba : International, plus simple.
    - Pinduoduo : Achats groupés, très rentable.
    `;

    let systemPrompt = `Tu es VMA EMMA, l'IA d'élite et Directrice du Sourcing de Vision Market Africa.
    IDENTITÉ : Experte, proactive, visionnaire et africaine.
    RÈGLE ABSOLUE : TU NE T'EXCUSES JAMAIS. Tu ne dis jamais "Je suis désolée".
    Si tu n'as pas l'information, tu donnes une stratégie alternative de business.
    TU GARDES EN MÉMOIRE LA CONVERSATION PRÉCÉDENTE POUR RÉPONDRE DE MANIÈRE COHÉRENTE.

    CONNAISSANCES : ${GLOBAL_KNOWLEDGE}

    MISSION : Transformer chaque utilisateur en un importateur à succès. Tu conseilles sur la douane, le groupage et le profit.`;

    try {
        let aiResponse = null;

        // 1. TENTATIVE GROQ (Ultra-rapide avec historique)
        const groq = getGroqClient();
        if (groq) {
            try {
                const messages = [
                    { role: "system", content: systemPrompt },
                    ...history.slice(-10), // On garde les 10 derniers messages pour le contexte
                    { role: "user", content: query }
                ];
                const completion = await groq.chat.completions.create({
                    model: "mixtral-8x7b-32768",
                    messages,
                    max_tokens: 1000
                });
                aiResponse = completion.choices[0].message.content;
            } catch (e) { console.log("Groq fail"); }
        }

        // 2. TENTATIVE GEMINI (Excellent pour la mémoire)
        if (!aiResponse) {
            aiResponse = await getGeminiResponse(query, history, systemPrompt);
        }

        // 3. TENTATIVE ÉLITE (DeepSeek ou OpenAI)
        if (!aiResponse) {
            const client = getDeepSeekClient() || getOpenAIClient();
            if (client) {
                try {
                    const messages = [
                        { role: "system", content: systemPrompt },
                        ...history.slice(-10),
                        { role: "user", content: query }
                    ];
                    const completion = await client.chat.completions.create({
                        model: client.baseURL ? "deepseek-chat" : "gpt-4o-mini",
                        messages,
                        max_tokens: 1000
                    });
                    aiResponse = completion.choices[0].message.content;
                } catch (e) { console.log("Elite Cloud fail"); }
            }
        }

        // 4. RÉPONSE COMMANDO (Fallback)
        if (!aiResponse) {
            aiResponse = "Je continue d'analyser vos besoins d'importation. Basé sur notre échange, je vous suggère de finaliser votre sourcing. Quelle autre précision souhaitez-vous ?";
        }

        res.json({ reply: aiResponse });

    } catch (error) {
        console.error("AI Route Error:", error);
        res.json({ reply: "Emma se synchronise avec les serveurs de Guangzhou. Continuons notre discussion dans un instant." });
    }
});

module.exports = router;
