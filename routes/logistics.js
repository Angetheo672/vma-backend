const express = require('express');
const router = express.Router();
const Logistic = require('../models/Logistic');
const Product = require('../models/Product');

// @route   GET api/logistics/track/:id
// @desc    Public tracking for Order Tracking Number OR VMA Product ID
router.get('/track/:id', async (req, res) => {
    const searchId = req.params.id.toUpperCase();

    try {
        // 1. Check if it's a Product VMA-ID
        if (searchId.startsWith('VMA-PRD')) {
            const product = await Product.findOne({ vmaId: searchId });
            if (product) {
                return res.json({
                    type: 'product',
                    data: {
                        name: product.name,
                        vmaId: product.vmaId,
                        status: product.stock > 0 ? 'Disponible en stock' : 'Sur commande (Chine)',
                        image: product.images[0],
                        price: product.price
                    }
                });
            }
        }

        // 2. Check if it's a Tracking Number for an Order
        const logistic = await Logistic.findOne({ trackingNumber: searchId })
            .populate('order', 'orderStatus createdAt totalAmount');

        if (logistic) {
            return res.json({
                type: 'logistic',
                data: logistic
            });
        }

        res.status(404).json({ msg: "Numéro introuvable. Vérifiez votre code VMA-ID ou de suivi." });

    } catch (err) {
        res.status(500).json({ msg: "Erreur serveur lors du tracking" });
    }
});

module.exports = router;
