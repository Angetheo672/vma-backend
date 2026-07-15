const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// @route   GET api/products
// @desc    Get all products
router.get('/', async (req, res) => {
    try {
        const products = await Product.find().populate('supplier', 'companyName firstName');
        res.json(products);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   GET api/products/me
// @desc    Get current supplier products
router.get('/me', auth, async (req, res) => {
    try {
        const products = await Product.find({ supplier: req.user.id });
        res.json(products);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   POST api/products
// @desc    Add a product (Supplier only)
router.post('/', [auth, upload.array('images', 5)], async (req, res) => {
    if (req.user.role !== 'supplier' && req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Unauthorized' });
    }
    try {
        const imageUrls = req.files ? req.files.map(file => file.path) : [];

        // Génération automatique du numéro de suivi produit (vmaId)
        const timestamp = Date.now().toString().slice(-4);
        const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
        const vmaId = `VMA-PRD-${timestamp}-${randomStr}`;

        const newProduct = new Product({
            ...req.body,
            images: imageUrls,
            supplier: req.user.id,
            vmaId
        });
        const product = await newProduct.save();
        res.json(product);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
