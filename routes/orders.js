const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const auth = require('../middleware/auth');
const sendEmail = require('../config/nodemailer');

// @route   POST api/orders
// @desc    Create a new order
router.post('/', auth, async (req, res) => {
    try {
        const { items, totalAmount, shippingAddress } = req.body;
        const newOrder = new Order({
            customer: req.user.id,
            items,
            totalAmount,
            shippingAddress
        });
        const order = await newOrder.save();

        // Send Confirmation Email
        const user = await User.findById(req.user.id);
        if (user) {
            const subject = `Confirmation de commande - Vision Market Africa #${order._id.toString().slice(-6).toUpperCase()}`;
            const html = `
                <h1>Merci pour votre commande !</h1>
                <p>Bonjour ${user.firstName},</p>
                <p>Votre commande a été reçue avec succès et est en cours de traitement.</p>
                <p><strong>Total:</strong> ${totalAmount} XAF</p>
                <p>Nous vous tiendrons informé de l'évolution de la livraison.</p>
                <br>
                <p>L'équipe Vision Market Africa</p>
            `;
            await sendEmail(user.email, subject, '', html);
        }

        res.json(order);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/orders
// @desc    Get user orders
router.get('/', auth, async (req, res) => {
    try {
        let orders;
        if (req.user.role === 'admin') {
            orders = await Order.find().populate('customer', 'firstName lastName email');
        } else {
            orders = await Order.find({ customer: req.user.id });
        }
        res.json(orders);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   GET api/orders/:id
// @desc    Get order by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('items.product');
        if (!order) return res.status(404).json({ msg: 'Order not found' });

        // Security check
        if (order.customer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ msg: 'Not authorized' });
        }
        res.json(order);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/orders/:id/status
// @desc    Update order status (Admin/Logistics only)
router.put('/:id/status', auth, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'logistics') {
        return res.status(403).json({ msg: 'Unauthorized' });
    }
    const { orderStatus, trackingNumber } = req.body;
    try {
        let order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ msg: 'Order not found' });

        order.orderStatus = orderStatus || order.orderStatus;
        order.trackingNumber = trackingNumber || order.trackingNumber;
        await order.save();

        res.json(order);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
