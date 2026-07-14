const express = require('express');
const router = express.Router();
const OpenAI = require("openai");
const User = require('../models/User');
const Order = require('../models/Order');

// Initialisation des clients IA
const getDeepSeekClient = () => {
    if (!process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY.includes('votre_cle')) return null;
    return new OpenAI({
        baseURL: 'https://api.deepseek.com',
        apiKey: process.env.DEEPSEEK_API_KEY,
    });
};

const getOpenAIClient = () => {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('votre_cle')) return null;
    return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
};

router.post('/chat', async (req, res) => {
    const { query, userId } = req.body;
    console.log(`[AI Emma] Nouvelle question: "${query}"`);

    try {
        let context = "Tu es VMA Emma, l'IA experte de Vision Market Africa. Aide l'utilisateur avec précision sur l'e-commerce, le sourcing en Chine (Alibaba, 1688) et la logistique en Afrique. Ton ton est professionnel, accueillant et efficace.";

        // Tentative de récupération du contexte utilisateur
        try {
            if (userId && userId.length === 24) {
                const user = await User.findById(userId);
                if (user) {
                    context += ` L'utilisateur s'appelle ${user.firstName}.`;
                }
            }
        } catch (e) { console.log("Context ignored"); }

        let aiResponse = null;

        // 1. PRIORITÉ : DEEPSEEK
        const deepseek = getDeepSeekClient();
        if (deepseek) {
            try {
                console.log("--> Appel à DeepSeek...");
                const completion = await deepseek.chat.completions.create({
                    model: "deepseek-chat",
                    messages: [
                        { role: "system", content: context },
                        { role: "user", content: query }
                    ],
                    max_tokens: 500,
                    timeout: 15000
                });
                aiResponse = completion.choices[0].message.content;
                console.log("✅ Réponse DeepSeek reçue.");
            } catch (err) {
                console.error("❌ Échec DeepSeek:", err.message);
            }
        }

        // 2. REPLI : OPENAI
        if (!aiResponse) {
            const openai = getOpenAIClient();
            if (openai) {
                try {
                    console.log("--> Appel à OpenAI (Fallback)...");
                    const completion = await openai.chat.completions.create({
                        model: "gpt-3.5-turbo",
                        messages: [
                            { role: "system", content: context },
                            { role: "user", content: query }
                        ],
                        max_tokens: 500,
                        timeout: 15000
                    });
                    aiResponse = completion.choices[0].message.content;
                    console.log("✅ Réponse OpenAI reçue.");
                } catch (err) {
                    console.error("❌ Échec OpenAI:", err.message);
                }
            }
        }

        // 3. FALLBACK : SIMULATION INTELLIGENTE (Emma Offline)
        if (!aiResponse) {
            console.log("--> Utilisation du mode Emma Offline (Simulation).");
            aiResponse = "Je suis Emma. Je rencontre actuellement une petite difficulté de connexion avec mes serveurs centraux, mais je peux quand même vous aider ! ";

            const q = query.toLowerCase();
            if (q.includes("colis") || q.includes("suivi") || q.includes("tracking")) {
                aiResponse += "Pour suivre un colis, entrez votre numéro VMA dans l'onglet 'Logistique'. Nos délais actuels depuis la Chine sont de 10 à 14 jours par avion.";
            } else if (q.includes("acheter") || q.includes("produit") || q.includes("prix")) {
                aiResponse += "Vous pouvez explorer nos produits certifiés dans le 'Marketplace'. Les prix affichés sont en FCFA (XAF).";
            } else if (q.includes("vendre") || q.includes("compte") || q.includes("fournisseur")) {
                aiResponse += "Pour vendre sur VMA, créez un compte fournisseur. Nous validons votre identité en moins de 24h.";
            } else {
                aiResponse += "Je suis spécialisée dans l'importation Chine-Afrique et la logistique. Que souhaitez-vous savoir sur nos services ?";
            }
        }

        return res.json({ reply: aiResponse });

    } catch (error) {
        console.error("CRITICAL AI ERROR:", error);
        return res.json({ reply: "Bonjour, c'est Emma. Je suis en train de mettre à jour mes systèmes. Posez-moi votre question à nouveau dans quelques instants !" });
    }
});

module.exports = router;
