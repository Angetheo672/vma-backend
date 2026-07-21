const express = require('express');
const router = express.Router();
const OpenAI = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');

/**
 * EMMA SOUVERAINE v9.0 - DIRECTRICE GÉNÉRALE DU SOURCING
 * Intelligence Contextuelle & Accès aux Données Temps Réel
 */

const getGeminiResponse = async (query, history, systemPrompt) => {
    const key = process.env.GOOGLE_GEMINI_API_KEY;
    if (!key || key.length < 10) return null;
    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const chat = model.startChat({
            history: history.slice(-15).map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            }))
        });
        const result = await chat.sendMessage(`${systemPrompt}\n\nCLIENT: ${query}`);
        return result.response.text();
    } catch (e) { console.error("Gemini Fail:", e.message); return null; }
};

const getDeepSeekResponse = async (query, history, systemPrompt) => {
    const key = process.env.DEEPSEEK_API_KEY;
    if (!key || key.length < 5) return null;
    try {
        const client = new OpenAI({ apiKey: key, baseURL: 'https://api.deepseek.com' });
        const completion = await client.chat.completions.create({
            model: "deepseek-chat",
            messages: [{ role: "system", content: systemPrompt }, ...history.slice(-10), { role: "user", content: query }],
            max_tokens: 2000
        });
        return completion.choices[0].message.content;
    } catch (e) { console.error("DeepSeek Fail:", e.message); return null; }
};

router.post('/chat', async (req, res) => {
    const { query, history = [], userId } = req.body;

    // 1. INJECTION DE CONTEXTE PERSONNALISÉ & DONNÉES TEMPS RÉEL
    let userContext = "Utilisateur : Visiteur anonyme.";
    let dynamicData = "";

    if (userId) {
        try {
            const user = await User.findById(userId);
            if (user) {
                userContext = `Utilisateur : ${user.firstName} ${user.lastName}, Rôle : ${user.role}.`;

                // Récupérer les dernières commandes pour aider au suivi
                const recentOrders = await Order.find({ buyer: userId })
                    .sort({ createdAt: -1 })
                    .limit(3)
                    .populate('product', 'name');

                if (recentOrders.length > 0) {
                    dynamicData += "\nCOMMANDES RÉCENTES DE L'UTILISATEUR :\n";
                    recentOrders.forEach(o => {
                        dynamicData += `- ${o.product.name}: Statut ${o.orderStatus}, Tracking: ${o.trackingNumber || 'En attente'}\n`;
                    });
                }
            }
        } catch (err) {
            console.error("Context Error:", err);
        }
    }

    // 2. RECHERCHE DE PRODUITS SI NÉCESSAIRE (Auto-détection simple)
    const keywords = ["cherche", "trouve", "prix de", "combien coûte", "acheter", "produit"];
    if (keywords.some(k => query.toLowerCase().includes(k))) {
        const searchTerms = query.split(' ').filter(w => w.length > 3).join(' ');
        const matchedProducts = await Product.find({
            $or: [
                { name: { $regex: searchTerms, $options: 'i' } },
                { category: { $regex: searchTerms, $options: 'i' } }
            ]
        }).limit(3);

        if (matchedProducts.length > 0) {
            dynamicData += "\nPRODUITS DISPONIBLES DANS NOTRE BASE :\n";
            matchedProducts.forEach(p => {
                dynamicData += `- ${p.name}: ${p.price} F CFA (ID: ${p._id})\n`;
            });
        }
    }

    // 3. BASE DE CONNAISSANCES SOUVERAINE
    const PLATFORM_KNOWLEDGE = `
    CONNAISSANCES VMA :
    - Sourcing: 1688 (Prix usine), Alibaba (Global), Pinduoduo (Groupbuy), Amazon, Temu.
    - Logistique VMA: Aérien (8500-12000F/kg, 7-12j), Maritime (450k-600k/CBM, 35-45j).
    - Incoterms: EXW, FOB, DDP (VMA gère tout en DDP).
    - Taxes: Douane incluse dans les tarifs VMA Elite.
    - Paiements: MoMo, Orange Money, Stripe, Campay.
    `;

    const systemPrompt = `Tu es EMMA, l'Intelligence Artificielle Souveraine de Vision Market Africa.

    TON RÔLE : Guide Suprême, Directrice Sourcing & Business.
    TA PERSONNALITÉ : Brillante, proactive, mentor, africaine et internationale.

    CONTEXTE UTILISATEUR : ${userContext}
    ${dynamicData}

    RÈGLES D'OR :
    1. ANALYSE : Utilise les données fournies sur les commandes ou produits pour répondre précisément.
    2. SOURCING : Si on te demande un produit, cite les prix de notre base si présents, sinon propose un sourcing 1688/Alibaba.
    3. SUIVI : Si on te demande "où est ma commande", utilise les COMMANDES RÉCENTES listées ci-dessus.
    4. SAVOIR : Voici tes données VMA : ${PLATFORM_KNOWLEDGE}.
    5. RAISONNEMENT : Analyse la demande. Si elle est floue, demande des précisions (Budget ? Quantité ?).
    6. TONS : Professionnel mais chaleureux.
    7. MULTILINGUE : Réponds toujours dans la langue du client (FR, EN, ZH).`;

    try {
        // ESSAI 1 : DEEPSEEK (Expertise Sourcing)
        let reply = await getDeepSeekResponse(query, history, systemPrompt);

        // ESSAI 2 : GEMINI (Raisonnement & Mémoire)
        if (!reply) reply = await getGeminiResponse(query, history, systemPrompt);

        // ESSAI 3 : GROQ / OPENAI (Vitesse)
        if (!reply) {
            const key = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
            if (key) {
                const client = new OpenAI({ apiKey: key, baseURL: process.env.GROQ_API_KEY ? "https://api.groq.com/openai/v1" : undefined });
                const completion = await client.chat.completions.create({
                    model: process.env.GROQ_API_KEY ? "mixtral-8x7b-32768" : "gpt-4o-mini",
                    messages: [{ role: "system", content: systemPrompt }, ...history.slice(-5), { role: "user", content: query }]
                });
                reply = completion.choices[0].message.content;
            }
        }

        // FALLBACK ELITE
        if (!reply) {
            reply = `Je traite votre demande avec une priorité maximale. Concernant "${query}", ma recommandation d'experte est d'optimiser votre sourcing sur 1688 pour garantir vos marges. Dites-moi, quel est votre objectif de profit pour ce projet ?`;
        }

        res.json({ reply });

    } catch (error) {
        res.json({ reply: "Emma se synchronise. Je suis prête à vous guider, quelle est votre question ?" });
    }
});

module.exports = router;

