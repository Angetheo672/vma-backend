const express = require('express');
const router = express.Router();
const axios = require('axios');
const aggregator = require('../services/aggregator');
const { upload } = require('../config/cloudinary');
const auth = require('../middleware/auth');

// @route   POST api/tools/analyze-link
router.post('/analyze-link', async (req, res) => {
    const { url, query } = req.body;
    const searchTerm = query || url;

    try {
        // Lancement d'une recherche globale massive multi-plateforme
        const [alibaba, amazon, aliexpress, pinduoduo, ebay, walmart, etsy, temu] = await Promise.all([
            aggregator.fetchFromAlibaba(searchTerm),
            aggregator.fetchFromAmazon(searchTerm),
            aggregator.fetchFromAliExpress(searchTerm),
            aggregator.fetchFromPinduoduo(searchTerm),
            aggregator.fetchFromEbay(searchTerm),
            aggregator.fetchFromWalmart(searchTerm),
            aggregator.fetchFromEtsy(searchTerm),
            aggregator.fetchFromTemu(searchTerm)
        ]);

        const allResults = [
            ...alibaba, ...amazon, ...aliexpress, ...pinduoduo,
            ...ebay, ...walmart, ...etsy, ...temu
        ];
        res.json(allResults);
    } catch (err) {
        console.error("Global Search Error:", err);
        res.status(500).json({ msg: "Erreur lors de la recherche globale" });
    }
});

/**
 * MASTER CLASS VISUAL SEARCH - MULTI-PLATFORM AGGREGATOR
 * This route uses AI to decrypt the image, then searches on Google, 1688 and Alibaba via APIs
 */
router.post('/visual-search', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ msg: "Aucune image reçue" });

        const imageUrl = req.file.path; // Cloudinary URL
        console.log(`[Visual Search] Decrypting Image: ${imageUrl}`);

        // 1. Identify Product using Google Gemini (Free Tier) or OpenAI Vision
        let keywords = "Produit Premium";

        try {
            if (process.env.GOOGLE_GEMINI_API_KEY && process.env.GOOGLE_GEMINI_API_KEY !== 'votre_cle_gemini_ici') {
                console.log("--> Using Google Gemini for Visual AI...");
                const { GoogleGenerativeAI } = require("@google/generative-ai");
                const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

                // Fetch the image and convert to base64
                const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                const base64Image = Buffer.from(response.data).toString('base64');

                const prompt = "Identify this product with 3 precise keywords for sourcing on Alibaba/1688. Return only the keywords separated by spaces.";
                const result = await model.generateContent([
                    prompt,
                    { inlineData: { data: base64Image, mimeType: "image/jpeg" } }
                ]);
                keywords = result.response.text().trim();
                console.log(`[Gemini Vision] Keywords detected: ${keywords}`);
            } else if (process.env.OPENAI_API_KEY) {
                const OpenAI = require("openai");
                const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

                const response = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: "Identify this product with 3 precise keywords for sourcing on Alibaba/1688. Return only the keywords separated by spaces." },
                                { type: "image_url", image_url: { "url": imageUrl } },
                            ],
                        },
                    ],
                    max_tokens: 50,
                });
                keywords = response.choices[0].message.content.trim();
                console.log(`[AI Vision] Keywords detected: ${keywords}`);
            }
        } catch (e) {
            console.error("AI Vision Error:", e.message);
        }

        // 2. Fetch results from Global Platforms
        const [alibabaResults, amazonResults, aliexpressResults] = await Promise.all([
            aggregator.fetchFromAlibaba(keywords),
            aggregator.fetchFromAmazon(keywords),
            aggregator.fetchFromAliExpress(keywords)
        ]);

        // 3. Construct Google Search Image Link (Deep Search)
        const googleLensUrl = `https://www.google.com/searchbyimage?image_url=${encodeURIComponent(imageUrl)}`;

        // 4. Enhanced Shipping Estimation Logic
        const estimateShipping = (product) => {
            const price = product.price;
            let weight = 0.5; // Default 500g
            if (price > 100000) weight = 2.5;
            if (price > 500000) weight = 5.0;

            const airRate = 9500;
            const seaRate = 2500;

            return {
                air: { cost: Math.round(weight * airRate), days: "10-14" },
                sea: { cost: Math.round(weight * seaRate), days: "45-60" }
            };
        };

        const platformResults = [
            { name: "Alibaba / 1688", results: alibabaResults.map(p => ({ ...p, shipping: estimateShipping(p) })) },
            { name: "AliExpress Global", results: aliexpressResults.map(p => ({ ...p, shipping: estimateShipping(p) })) },
            { name: "Amazon Global", results: amazonResults.map(p => ({ ...p, shipping: estimateShipping(p) })) }
        ];

        res.json({
            imageUrl,
            detectedKeywords: keywords,
            googleLensUrl,
            platforms: platformResults,
            msg: "Analyse globale terminée"
        });

    } catch (err) {
        console.error("Visual Search Error:", err);
        res.status(500).json({ msg: "Erreur lors de la recherche visuelle globale" });
    }
});

module.exports = router;
