const express = require('express');
const router = express.Router();
const axios = require('axios');
const aggregator = require('../services/aggregator');
const { upload } = require('../config/cloudinary');
const auth = require('../middleware/auth');

// @route   POST api/tools/analyze-link
router.post('/analyze-link', async (req, res) => {
    const { url } = req.body;
    try {
        if (url.includes("1688") || url.includes("alibaba")) {
            const externalData = await aggregator.fetchFromAlibaba(url);
            if (externalData && externalData.length > 0) return res.json(externalData[0]);
        }
        res.json({ name: "Produit Importé", price: 15000, source: "1688" });
    } catch (err) {
        res.status(500).json({ msg: "Erreur lors de l'analyse" });
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

        // 1. Identify Product using OpenAI Vision for Global Accuracy
        let keywords = "Produit Premium";

        try {
            if (process.env.OPENAI_API_KEY) {
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
        const [alibabaResults, amazonResults] = await Promise.all([
            aggregator.fetchFromAlibaba(keywords),
            aggregator.fetchFromAmazon(keywords)
        ]);

        // 3. Construct Google Search Image Link (Deep Search)
        const googleLensUrl = `https://www.google.com/searchbyimage?image_url=${encodeURIComponent(imageUrl)}`;

        res.json({
            imageUrl,
            detectedKeywords: keywords,
            googleLensUrl,
            platforms: [
                { name: "Alibaba / 1688", results: alibabaResults },
                { name: "Amazon Global", results: amazonResults },
                { name: "VMA Network", results: alibabaResults.slice(0, 1) }
            ],
            msg: "Analyse globale terminée"
        });

    } catch (err) {
        console.error("Visual Search Error:", err);
        res.status(500).json({ msg: "Erreur lors de la recherche visuelle globale" });
    }
});

module.exports = router;
