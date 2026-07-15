const express = require('express');
const router = express.Router();
const Logistic = require('../models/Logistic');
const Product = require('../models/Product');
const Order = require('../models/Order');
const trackingService = require('../services/trackingService');

// @route   GET api/logistics/track/:id
// @desc    Tracking Global avec support: VMA, DHL, FedEx, UPS, 17TRACK, AfterShip...
router.get('/track/:id', async (req, res) => {
    const searchId = req.params.id.toUpperCase();

    try {
        // 1. RECHERCHE INTERNE VMA (Produits)
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

        // 2. RECHERCHE DIRECTE DANS LES COMMANDES VMA
        const order = await Order.findOne({ trackingNumber: searchId });
        if (order) {
            return res.json({
                type: 'order',
                source: 'VMA Order Tracking',
                data: {
                    orderId: order._id,
                    status: order.orderStatus,
                    payment: order.paymentStatus,
                    trackingNumber: order.trackingNumber,
                    createdAt: order.createdAt
                }
            });
        }

        // 3. RECHERCHE LOGISTIQUE VMA (Transit spécifique)
        const logistic = await Logistic.findOne({ trackingNumber: searchId }).populate('order');
        if (logistic) {
            return res.json({ type: 'logistic', source: 'VMA Logistics', data: logistic });
        }

        // 4. RECHERCHE EXTERNE (AfterShip, 17TRACK, DHL, FedEx, UPS...)
        // Si le numéro ne correspond à rien en interne, on interroge les serveurs mondiaux
        const externalTracking = await trackingService.trackAny(searchId);
        if (externalTracking) {
            return res.json({
                type: 'external',
                source: externalTracking.source,
                data: externalTracking
            });
        }

        res.status(404).json({ msg: "Numéro de suivi introuvable dans le réseau global VMA." });

    } catch (err) {
        console.error("Tracking Error:", err);
        res.status(500).json({ msg: "Erreur serveur lors du tracking global" });
    }
});

module.exports = router;
