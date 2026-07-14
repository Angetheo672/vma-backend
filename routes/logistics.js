const express = require('express');
const router = express.Router();
const Logistic = require('../models/Logistic');
const Product = require('../models/Product');
const axios = require('axios');

// @route   GET api/logistics/track/:id
// @desc    Tracking Global avec support Multi-Transporteurs
router.get('/track/:id', async (req, res) => {
    const searchId = req.params.id.toUpperCase();

    try {
        // 1. RECHERCHE INTERNE VMA
        if (searchId.startsWith('VMA-PRD')) {
            const product = await Product.findOne({ vmaId: searchId });
            if (product) {
                return res.json({
                    type: 'product',
                    source: 'VMA Internal',
                    data: { name: product.name, status: product.stock > 0 ? 'En Stock' : 'Pré-commande', price: product.price, vmaId: product.vmaId }
                });
            }
        }

        // 2. RECHERCHE LOGISTIQUE VMA
        const logistic = await Logistic.findOne({ trackingNumber: searchId }).populate('order');
        if (logistic) {
            return res.json({ type: 'logistic', source: 'VMA Logistics', data: logistic });
        }

        // 3. RECHERCHE EXTERNE (FUTURE CONNEXION 17TRACK / AFTERSHIP)
        // Ici, nous préparons le pont vers les APIs mondiales
        // if (process.env.AFTERSHIP_API_KEY) { ... }

        res.status(404).json({ msg: "Numéro introuvable. Vérifiez votre code VMA ou de transporteur." });

    } catch (err) {
        res.status(500).json({ msg: "Erreur serveur lors du tracking global" });
    }
});

// @route   POST api/logistics/calculate-shipping
// @desc    Calculateur de fret Chine/Turquie vers Afrique
router.post('/calculate-shipping', (req, res) => {
    const { weight, volume, type, origin } = req.body;
    let rate = origin === 'china' ? 9500 : 8000; // Prix par kg
    let total = weight * rate;

    res.json({
        totalEstimation: total,
        currency: 'XAF',
        details: `Estimation basée sur le fret aérien ${origin === 'china' ? 'Chine' : 'Turquie'} -> Afrique.`,
        days: origin === 'china' ? '10-14 jours' : '3-5 jours'
    });
});

module.exports = router;
