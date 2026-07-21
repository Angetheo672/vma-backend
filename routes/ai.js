const express = require('express');
const router = express.Router();
const OpenAI = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// CONFIGURATION DES MOTEURS D'INTELLIGENCE
const getGeminiResponse = async (query, history, systemPrompt) => {
    const key = process.env.GOOGLE_GEMINI_API_KEY;
    if (!key || key.length < 10) return null;
    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // On fusionne l'historique et le prompt pour une stabilité maximale
        let fullPrompt = systemPrompt + "\n\nHISTORIQUE RÉCENT :\n";
        history.forEach(m => {
            fullPrompt += `${m.role === 'user' ? 'Client' : 'Emma'}: ${m.content}\n`;
        });
        fullPrompt += `\nNouvelle Question du Client: ${query}\nEmma:`;

        const result = await model.generateContent(fullPrompt);
        return result.response.text();
    } catch (e) {
        console.error("DEBUG AI (Gemini Error):", e.message);
        return null;
    }
};

router.post('/chat', async (req, res) => {
    const { query, history = [] } = req.body;

    const systemPrompt = `Tu es EMMA, l'Intelligence Artificielle d'Élite de Vision Market Africa.
    IDENTITÉ : Experte infaillible en Sourcing, Business, Logistique et Technologie.
    RÈGLES :
    1. TU RÉPONDS À TOUT de manière ultra-détaillée et intelligente.
    2. TU NE T'EXCUSES JAMAIS.
    3. Si une info VMA manque, utilise tes connaissances mondiales pour conseiller le client comme un expert.
    4. Ton ton est motivant, proactif et tu tutoies le client.`;

    try {
        let aiResponse = null;

        // 1. PRIORITÉ GEMINI (Moteur de recherche et raisonnement)
        aiResponse = await getGeminiResponse(query, history, systemPrompt);

        // 2. BACKUP GROQ / OPENAI (Si Gemini échoue)
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
                        messages: [
                            { role: "system", content: systemPrompt },
                            ...history.slice(-5).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
                            { role: "user", content: query }
                        ]
                    });
                    aiResponse = completion.choices[0].message.content;
                } catch (e) { console.error("DEBUG AI (Backup Error):", e.message); }
            }
        }

        // 3. RÉPONSE D'EXPERTISE (Si panne totale des serveurs cloud)
        if (!aiResponse) {
            aiResponse = `En tant que Directrice Sourcing de VMA, j'analyse votre demande sur "${query}".
            Écoutez bien : pour réussir dans l'import-export aujourd'hui, vous devez optimiser vos coûts de transport (actuellement à ~9500F/kg en aérien) et sécuriser vos fournisseurs sur 1688.
            Je suis en train de reconnecter mes modules d'analyse profonde. Quelle est la prochaine étape de votre business ?`;
        }

        res.json({ reply: aiResponse });

    } catch (error) {
        res.json({ reply: "Emma est en maintenance technique. Je reviens vers vous avec une analyse complète dans quelques secondes." });
    }
});

module.exports = router;
