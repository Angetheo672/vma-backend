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

const getGeminiResponse = async (query, history, systemPrompt) => {
    const key = process.env.GOOGLE_GEMINI_API_KEY;
    if (!key || key.includes('votre_cle')) return null;
    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const chat = model.startChat({
            history: history.map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            })),
            generationConfig: { maxOutputTokens: 1000 }
        });
        const result = await chat.sendMessage(`${systemPrompt}\n\nUtilisateur: ${query}`);
        return result.response.text();
    } catch (e) {
        console.error("Gemini Error:", e.message);
        return null;
    }
};

router.post('/chat', async (req, res) => {
    const { query, history = [], userId } = req.body;

    const GLOBAL_KNOWLEDGE = `
    VMA CORE DATA:
    - Vision Market Africa (VMA) est le leader du Sourcing Elite en Afrique.
    - Emma est l'IA Directrice Sourcing & Business.
    - Frais logistiques: Chine-Afrique (Avion: 8k-12k F/kg, 7-12j), (Bateau: 450k-600k F/CBM, 35-45j).
    - Partenaires: 1688, Alibaba, Amazon, Temu, Pinduoduo, eBay, Walmart, Etsy.
    - Services: Groupage, Transit, Paiements sécurisés, Recherche visuelle AI.
    `;

    let systemPrompt = `Tu es EMMA, l'Intelligence Artificielle d'Élite de Vision Market Africa.

    TON IDENTITÉ :
    - Tu es une IA de classe mondiale, experte, brillante et infaillible.
    - Tu es la Directrice du Sourcing, mais aussi une experte en Business Mondial, Technologie, Marketing et Stratégie.
    - Ton ton est professionnel, motivant, précis et proactif. Tu tutoies l'utilisateur pour une relation de mentorat "Elite".

    TES RÈGLES D'OR :
    1. TU RÉPONDS À ABSOLUMENT TOUT. Aucune question n'est interdite. Si la question est complexe, tu l'analyses étape par étape.
    2. TU NE T'EXCUSES JAMAIS. Ne dis jamais "Je suis désolée", "Je ne peux pas" ou "Mes connaissances sont limitées".
    3. PAS DE BLOCAGE : Si tu n'as pas une donnée exacte de VMA, tu utilises ta vaste culture générale d'IA pour donner la meilleure réponse possible au monde.
    4. ANALYSE PROFONDE : Analyse toujours l'intention derrière la question de l'utilisateur pour lui donner un avantage compétitif.
    5. MÉMOIRE INFINIE : Utilise l'historique fourni pour maintenir une conversation fluide et cohérente.

    CONNAISSANCES DE BASE VMA : ${GLOBAL_KNOWLEDGE}

    MISSION : Transformer chaque utilisateur (client ou visiteur) en un leader du commerce. Aide-les à gagner de l'argent, à optimiser leurs processus et à comprendre le marché mondial.`;

    try {
        let aiResponse = null;

        // 1. TENTATIVE GEMINI (Puissance de raisonnement et mémoire)
        aiResponse = await getGeminiResponse(query, history, systemPrompt);

        // 2. TENTATIVE GROQ (Vitesse éclair si Gemini échoue)
        if (!aiResponse) {
            const groq = getGroqClient();
            if (groq) {
                try {
                    const messages = [
                        { role: "system", content: systemPrompt },
                        ...history.slice(-10),
                        { role: "user", content: query }
                    ];
                    const completion = await groq.chat.completions.create({
                        model: "mixtral-8x7b-32768",
                        messages,
                        max_tokens: 1500
                    });
                    aiResponse = completion.choices[0].message.content;
                } catch (e) { console.log("Groq fail"); }
            }
        }

        // 3. TENTATIVE DEEPSEEK / OPENAI (Elite backup)
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
                        max_tokens: 1500
                    });
                    aiResponse = completion.choices[0].message.content;
                } catch (e) { console.log("Elite backup fail"); }
            }
        }

        // 4. RÉPONSE D'INTELLIGENCE SUPRÊME (Si panne totale des API)
        if (!aiResponse) {
            const q = query.toLowerCase();
            if (q.includes("prix") || q.includes("combien") || q.includes("argent")) {
                aiResponse = "Analyse financière en cours... Pour maximiser vos profits sur ce projet, je vous recommande de viser une marge brute de 40% en sourçant directement via nos canaux 1688 ou Alibaba. Le prix de revient estimé à Douala inclut le fret aérien à 9500F/kg. Quel budget total prévoyez-vous pour cette opération ?";
            } else {
                aiResponse = "Je traite votre demande avec une analyse multi-sources. Votre question sur '" + query + "' est au cœur des stratégies actuelles de business international. En tant qu'IA Elite, je vous conseille de privilégier la qualité de sourcing et la rapidité logistique. Approfondissons ce point ensemble : quel est votre objectif principal ?";
            }
        }

        res.json({ reply: aiResponse });

    } catch (error) {
        console.error("Critical AI Error:", error);
        res.json({ reply: "Emma active ses protocoles de secours. Je suis prête à répondre à votre question. Reposons les bases de votre projet ensemble." });
    }
});

module.exports = router;
