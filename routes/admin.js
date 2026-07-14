const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const auth = require('../middleware/auth');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });
    next();
};

// @route   GET api/admin/stats
// @desc    Get global statistics
router.get('/stats', auth, isAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalSuppliers = await User.countDocuments({ role: 'supplier' });
        const totalOrders = await Order.countDocuments();
        const totalProducts = await Product.countDocuments();

        const sales = await Order.aggregate([
            { $match: { paymentStatus: 'paid' } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);

        res.json({
            totalUsers,
            totalSuppliers,
            totalOrders,
            totalProducts,
            totalRevenue: sales.length > 0 ? sales[0].total : 0
        });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
