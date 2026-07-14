const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const auth = require('../middleware/auth');
const campay = require('../services/campayService');

// @route   POST api/payments/initiate
// @desc    Initiate a payment (Real Campay Integration)
router.post('/initiate', auth, async (req, res) => {
    const { orderId, method, country, phoneNumber, amount } = req.body;

    try {
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ msg: 'Order not found' });

        const transactionId = `VMA-${Date.now()}`;

        // 1. TENTATIVE PAIEMENT RÉEL VIA CAMPAY (Si configuré)
        if (process.env.CAMPAY_USER && process.env.CAMPAY_USER !== 'votre_user_campay') {
            try {
                const campayRes = await campay.collect(amount, phoneNumber, transactionId);

                const newPayment = new Payment({
                    order: orderId,
                    user: req.user.id,
                    amount,
                    method,
                    country,
                    transactionId: campayRes.reference, // Utilise la réf Campay
                    metaData: { phoneNumber, externalRef: transactionId }
                });
                await newPayment.save();

                return res.json({
                    msg: "Demande de paiement envoyée. Validez sur votre téléphone (Tapez votre code PIN).",
                    reference: campayRes.reference,
                    status: "pending"
                });
            } catch (err) {
                console.error("Campay Real Payment Error:", err.message);
                return res.status(400).json({ msg: "Échec de l'initiation du paiement réel." });
            }
        }

        // 2. SIMULATION (Mode Développement)
        const newPayment = new Payment({
            order: orderId,
            user: req.user.id,
            amount,
            method,
            country,
            transactionId: transactionId + "-SIM",
            metaData: { phoneNumber }
        });
        await newPayment.save();

        console.log(`[PAYMENT SIM] Initiated: ${transactionId} for ${amount} XAF`);

        setTimeout(async () => {
            try {
                await Payment.findOneAndUpdate({ transactionId: transactionId + "-SIM" }, { status: 'completed' });
                await Order.findByIdAndUpdate(orderId, { paymentStatus: 'paid', orderStatus: 'processing' });
                console.log(`[PAYMENT SIM] ✅ Success: ${transactionId}`);
            } catch (err) { console.log("Sim Error"); }
        }, 5000);

        res.json({
            msg: "MODE TEST : Le paiement sera validé automatiquement dans 5 secondes.",
            transactionId,
            status: "pending"
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/payments/status/:reference
// @desc    Check payment status
router.get('/status/:reference', auth, async (req, res) => {
    try {
        if (process.env.CAMPAY_USER && process.env.CAMPAY_USER !== 'votre_user_campay') {
            const status = await campay.checkStatus(req.params.reference);
            if (status.status === 'SUCCESSFUL') {
                const payment = await Payment.findOne({ transactionId: req.params.reference });
                if (payment && payment.status !== 'completed') {
                    payment.status = 'completed';
                    await payment.save();
                    await Order.findByIdAndUpdate(payment.order, { paymentStatus: 'paid', orderStatus: 'processing' });
                }
            }
            return res.json(status);
        }
        res.json({ status: "SIMULATED_SUCCESS" });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
