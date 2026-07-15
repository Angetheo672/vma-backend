const express = require('express');
const router = express.Router();
const OpenAI = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");
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

const getGroqClient = () => {
    const key = process.env.GROQ_API_KEY;
    if (!key) return null;
    return new OpenAI({ baseURL: 'https://api.groq.com/openai/v1', apiKey: key });
};

const getGeminiResponse = async (query, systemPrompt) => {
    const key = process.env.GOOGLE_GEMINI_API_KEY;
    if (!key || key.includes('votre_cle')) return null;
    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(`${systemPrompt}\n\nUtilisateur: ${query}`);
        return result.response.text();
    } catch (e) {
        console.error("Gemini Error:", e.message);
        return null;
    }
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
    - 1688.com : Prix d'usine (Chine), nécessite un agent (VMA).
    - Alibaba : Prix international, plus simple.
    - Pinduoduo : Achats groupés, très rentable.
    - Amazon SP-API : Import USA possible via VMA.
    `;

    let systemPrompt = `Tu es VMA EMMA, l'IA d'élite et Directrice du Sourcing de Vision Market Africa.
    IDENTITÉ : Experte, proactive, visionnaire et africaine.
    RÈGLE ABSOLUE : TU NE T'EXCUSES JAMAIS. Tu ne dis jamais "Je suis désolée" ou "Je ne peux pas".
    Si tu n'as pas l'information, tu donnes une stratégie alternative de business.

    CONNAISSANCES : ${GLOBAL_KNOWLEDGE}

    STYLE : Direct, motivant, professionnel. Tu tutoies l'utilisateur pour créer une relation de mentorat (ou vouvoies si tu préfères un ton plus formel, mais sois assertive).
    MISSION : Transformer chaque utilisateur en un importateur à succès. Tu parles de douane, de groupage, de transit et de profitabilité.`;

    try {
        let aiResponse = null;

        // 1. TENTATIVE ULTRA-RAPIDE (Groq)
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

        // 2. TENTATIVE GOOGLE GEMINI (Très performant et stable)
        if (!aiResponse || aiResponse.includes("excuse") || aiResponse.includes("désolé")) {
            const geminiRes = await getGeminiResponse(query, systemPrompt);
            if (geminiRes) aiResponse = geminiRes;
        }

        // 3. TENTATIVE ÉLITE (DeepSeek ou OpenAI)
        if (!aiResponse || aiResponse.includes("excuse") || aiResponse.includes("désolé")) {
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

        // 4. RÉPONSE COMMANDO (Si tout le reste échoue ou si l'IA s'excuse encore)
        if (!aiResponse || aiResponse.toLowerCase().includes("désolé") || aiResponse.toLowerCase().includes("excuse")) {
            const q = query.toLowerCase();
            if (q.includes("prix") || q.includes("combien") || q.includes("1688") || q.includes("chine")) {
                aiResponse = "Analyse en cours... Sur 1688, ce type de produit se négocie entre 2 et 15 USD l'unité selon la quantité. Avec VMA, nous optimisons votre transport pour descendre sous les 9000F/kg. Voulez-vous que je calcule votre prix de revient à Douala ?";
            } else if (q.includes("délai") || q.includes("arriver") || q.includes("temps")) {
                aiResponse = "Les flux actuels Guangzhou-Afrique sont de 10 jours en moyenne. Pour la Turquie, c'est du 72h chrono. Je vous conseille de valider votre commande avant vendredi pour entrer dans le prochain conteneur aérien.";
            } else if (q.includes("argent") || q.includes("riche") || q.includes("rentable")) {
                aiResponse = "L'importation est le levier le plus rapide pour bâtir un empire en Afrique. Avec VMA Emma, vous achetez au prix usine. Ma recommandation : misez sur les accessoires tech ou la mode turque ce mois-ci. On commence ?";
            } else {
                aiResponse = "Votre question sur '" + query + "' est excellente. En tant qu'IA VMA Elite, je vous confirme que cette opportunité est viable. Focalisez-vous sur le sourcing direct et laissez VMA gérer la logistique. Quelle est l'étape suivante de votre projet ?";
            }
        }

        res.json({ reply: aiResponse });

    } catch (error) {
        console.error("Critical AI Error:", error);
        res.json({ reply: "L'IA Emma est en cours de synchronisation avec les serveurs mondiaux. Posez votre question sur l'import, je suis là pour booster votre business." });
    }
});

module.exports = router;

module.exports = router;
