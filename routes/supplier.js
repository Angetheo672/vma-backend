const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Middleware to check if user is supplier
const supplierAuth = (req, res, next) => {
    if (req.user.role !== 'supplier' && req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied: Suppliers only' });
    }
    next();
};

// @route   GET api/supplier/stats
// @desc    Get supplier performance stats
router.get('/stats', [auth, supplierAuth], async (req, res) => {
    try {
        const productCount = await Product.countDocuments({ supplier: req.user.id });
        const orders = await Order.find({ supplier: req.user.id });
        const revenue = orders.reduce((acc, order) => acc + (order.paymentStatus === 'paid' ? order.totalPrice : 0), 0);

        const recentOrders = await Order.find({ supplier: req.user.id })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('buyer', 'firstName lastName')
            .populate('product', 'name price');

        res.json({
            productCount,
            orderCount: orders.length,
            revenue,
            recentOrders
        });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   GET api/supplier/orders
// @desc    Get all orders for the supplier
router.get('/orders', [auth, supplierAuth], async (req, res) => {
    try {
        const orders = await Order.find({ supplier: req.user.id })
            .populate('buyer', 'firstName lastName phone')
            .populate('product', 'name images price');
        res.json(orders);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
