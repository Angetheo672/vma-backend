const express = require('express');
const router = express.Router();
const OpenAI = require("openai");
const User = require('../models/User');

// CONFIGURATION DES MOTEURS D'INTELLIGENCE (MULTI-SOURCES)
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

// NOUVEAU : Moteur Turbo (Groq ou similaire si configuré)
const getGroqClient = () => {
    const key = process.env.GROQ_API_KEY;
    if (!key) return null;
    return new OpenAI({ baseURL: 'https://api.groq.com/openai/v1', apiKey: key });
};

router.post('/chat', async (req, res) => {
    const { query, userId } = req.body;

    // BASE DE CONNAISSANCES MONDIALE INJECTÉE (Le "Crack" de connaissances)
    const GLOBAL_KNOWLEDGE = `
    DÉLAIS DE LIVRAISON MONDIAUX :
    - Chine vers Afrique (Avion) : 7-12 jours. (Bateau) : 35-45 jours.
    - Turquie vers Afrique (Avion) : 3-5 jours.
    TARIFS LOGISTIQUES (ESTIMATIONS) :
    - Fret Aérien : 8000 - 12000 F CFA / kg.
    - Fret Maritime : 450.000 - 600.000 F CFA / CBM.
    PLATEFORMES DE SOURCING :
    - 1688.com : Prix d'usine (Chine), nécessite un agent.
    - Alibaba : International, plus cher mais plus simple.
    - Pinduoduo : Achats groupés, prix imbattables.
    `;

    let systemPrompt = `Tu es VMA EMMA, l'IA d'élite de Vision Market Africa.
    TU NE T'EXCUSES JAMAIS. Tu as accès aux données de 1688, Alibaba et Amazon.

    CONNAISSANCES MONDIALES : ${GLOBAL_KNOWLEDGE}

    MISSION : Tu aides les entrepreneurs africains à devenir riches par l'import-export.
    Si tu n'as pas la réponse exacte, tu donnes une estimation professionnelle basée sur le marché actuel.
    Tu parles de douane, de transit, de groupage et de sourcing direct aux usines de Guangzhou et Yiwu.`;

    try {
        let aiResponse = null;

        // 1. TENTATIVE TURBO (Groq - Le plus rapide du monde)
        const groq = getGroqClient();
        if (groq) {
            try {
                const completion = await groq.chat.completions.create({
                    model: "mixtral-8x7b-32768",
                    messages: [{ role: "system", content: systemPrompt }, { role: "user", content: query }],
                    max_tokens: 1000
                });
                aiResponse = completion.choices[0].message.content;
            } catch (e) { console.log("Groq fail"); }
        }

        // 2. TENTATIVE ÉLITE (DeepSeek ou OpenAI)
        if (!aiResponse) {
            const client = getDeepSeekClient() || getOpenAIClient();
            if (client) {
                try {
                    const completion = await client.chat.completions.create({
                        model: client.baseURL ? "deepseek-chat" : "gpt-4o-mini",
                        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: query }],
                        max_tokens: 1000
                    });
                    aiResponse = completion.choices[0].message.content;
                } catch (e) { console.log("Elite Cloud fail"); }
            }
        }

        // 3. RÉPONSE COMMANDO (Si les clés sont absentes ou expirées sur Railway)
        if (!aiResponse) {
            const q = query.toLowerCase();
            if (q.includes("prix") || q.includes("combien") || q.includes("1688") || q.includes("chine")) {
                aiResponse = "En tant qu'IA VMA, j'ai analysé les tendances de Guangzhou. Pour un import depuis 1688, comptez environ 15% de frais d'agent et un fret aérien de 9500F/kg. Voulez-vous que je simule un calcul de rentabilité ?";
            } else if (q.includes("délai") || q.includes("arriver") || q.includes("temps")) {
                aiResponse = "Nos flux logistiques actuels indiquent 10 jours par avion depuis la Chine et 4 jours depuis la Turquie. Le maritime prend environ 40 jours vers Douala ou Abidjan.";
            } else {
                aiResponse = "Je suis connectée aux serveurs de sourcing mondiaux de VMA. Votre question sur '" + query + "' est pertinente. Voici ce qu'un expert en import vous conseillerait : Concentrez-vous sur la marge nette et le sourcing direct usine. Comment puis-je vous aider à finaliser cette opération ?";
            }
        }

        res.json({ reply: aiResponse });

    } catch (error) {
        res.json({ reply: "Je suis Emma. Je mets à jour mes bases de données mondiales. Posez-moi votre question sur le sourcing ou la logistique, je suis prête." });
    }
});

module.exports = router;

module.exports = router;
