const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const auth = require('../middleware/auth');

// @route   POST api/payments/initiate
// @desc    Initiate a payment
router.post('/initiate', auth, async (req, res) => {
    const { orderId, method, country, phoneNumber, amount } = req.body;

    try {
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ msg: 'Order not found' });

        const transactionId = `VMA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const newPayment = new Payment({
            order: orderId,
            user: req.user.id,
            amount,
            method,
            country,
            transactionId,
            metaData: { phoneNumber }
        });

        await newPayment.save();

        console.log(`[PAYMENT] Initiated: ${transactionId} via ${method} for ${amount} XAF`);

        // SIMULATION: Automatically approve payment after 2 seconds for demo purposes
        setTimeout(async () => {
            try {
                const p = await Payment.findOne({ transactionId });
                if (p) {
                    p.status = 'completed';
                    await p.save();
                    await Order.findByIdAndUpdate(orderId, { paymentStatus: 'paid', orderStatus: 'processing' });
                    console.log(`[PAYMENT] ✅ Success: ${transactionId} approved (Simulated)`);
                }
            } catch (err) { console.error("Simulated payment error:", err); }
        }, 3000);

        res.json({
            msg: "Paiement initié avec succès. Veuillez confirmer sur votre téléphone.",
            transactionId,
            status: "pending"
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
