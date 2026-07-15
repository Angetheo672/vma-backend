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

        // Fonction pour envoyer le reçu (Utilisée en SIM et en RÉEL)
        const sendReceipt = async (orderId, amount, transactionId) => {
            const Order = require('../models/Order');
            const User = require('../models/User');
            const { sendEmail } = require('../services/emailService');

            try {
                const order = await Order.findById(orderId);
                const user = await User.findById(order.customer);
                if (user) {
                    const subject = `REÇU DE PAIEMENT VMA ELITE - #${transactionId.slice(-6)}`;
                    const html = `
                        <div style="font-family: Arial, sans-serif; background: #000; color: #fff; padding: 20px; border-radius: 15px;">
                            <h1 style="color: #FFD700;">Vision Market Africa</h1>
                            <h2>REÇU DE PAIEMENT OFFICIEL</h2>
                            <p>Merci <strong>${user.firstName}</strong> pour votre confiance.</p>
                            <div style="background: #111; padding: 15px; border-radius: 10px; border: 1px solid #FFD700;">
                                <p><strong>Transaction ID:</strong> ${transactionId}</p>
                                <p><strong>Montant Payé:</strong> ${amount} XAF</p>
                                <p><strong>Statut:</strong> Confirmé ✅</p>
                                <p><strong>Commande:</strong> #${orderId.toString().slice(-6).toUpperCase()}</p>
                            </div>
                            <p style="font-size: 12px; color: #888; margin-top: 20px;">VMA Elite v3.0 - Votre passerelle vers le commerce mondial.</p>
                        </div>
                    `;
                    await sendEmail(user.email, subject, html);
                }
            } catch (e) { console.error("Receipt error:", e.message); }
        };

        setTimeout(async () => {
            try {
                await Payment.findOneAndUpdate({ transactionId: transactionId + "-SIM" }, { status: 'completed' });
                await Order.findByIdAndUpdate(orderId, { paymentStatus: 'paid', orderStatus: 'processing' });
                console.log(`[PAYMENT SIM] ✅ Success: ${transactionId}`);

                // Envoi du reçu automatique
                await sendReceipt(orderId, amount, transactionId + "-SIM");
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
