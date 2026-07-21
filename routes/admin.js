const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const auth = require('../middleware/auth');

// Middleware to check if user is admin
const adminAuth = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied: Admins only' });
    }
    next();
};

// @route   GET api/admin/stats
// @desc    Get global statistics
router.get('/stats', [auth, adminAuth], async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const productCount = await Product.countDocuments();
        const orderCount = await Order.countDocuments();
        const orders = await Order.find();
        const totalRevenue = orders.reduce((acc, order) => acc + (order.paymentStatus === 'paid' ? order.totalPrice : 0), 0);

        res.json({
            users: userCount,
            products: productCount,
            orders: orderCount,
            revenue: totalRevenue
        });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/admin/verify-supplier/:id
// @desc    Approve a supplier
router.put('/verify-supplier/:id', [auth, adminAuth], async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || user.role !== 'supplier') return res.status(404).json({ msg: 'Supplier not found' });

        user.isVerified = true;
        await user.save();
        res.json({ msg: 'Supplier verified successfully' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/admin/suspend-user/:id
// @desc    Suspend a user account
router.put('/suspend-user/:id', [auth, adminAuth], async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        user.isSuspended = !user.isSuspended;
        await user.save();
        res.json({ msg: user.isSuspended ? 'User suspended' : 'User reactivated' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
