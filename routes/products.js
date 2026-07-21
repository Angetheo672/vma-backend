const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// @route   GET api/products
// @desc    Get all products
router.get('/', async (req, res) => {
    try {
        const { category, search, promo } = req.query;
        let query = {};
        if (category) query.category = category;
        if (search) query.name = { $regex: search, $options: 'i' };
        if (promo === 'true') query.isPromo = true;

        const products = await Product.find(query)
            .populate('supplier', 'companyName firstName isVerified')
            .sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   GET api/products/marketplace/home
// @desc    Get sections for marketplace home
router.get('/marketplace/home', async (req, res) => {
    try {
        const popular = await Product.find().sort({ rating: -1 }).limit(6);
        const news = await Product.find().sort({ createdAt: -1 }).limit(6);
        const promos = await Product.find({ isPromo: true }).limit(6);
        const flashSales = await Product.find({ isPromo: true }).sort({ discountPrice: 1 }).limit(4);

        // Simuler des catégories populaires
        const categories = ["Électronique", "Mode", "Maison", "Sourcing 1688", "Turquie Direct"];

        res.json({
            popular,
            news,
            promos,
            flashSales,
            categories
        });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   GET api/products/:id
// @desc    Get product by ID
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('supplier', 'companyName firstName isVerified stats');
        if (!product) return res.status(404).json({ msg: 'Product not found' });
        res.json(product);
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
router.post('/', [auth, upload.array('images', 10)], async (req, res) => {
    if (req.user.role !== 'supplier' && req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Unauthorized: Only suppliers can add products' });
    }

    try {
        // Vérification si le fournisseur est validé
        const user = await User.findById(req.user.id);
        if (!user.isVerified && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Votre compte doit être validé par un administrateur avant de publier.' });
        }

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

// @route   PUT api/products/:id
// @desc    Update a product
router.put('/:id', [auth, upload.array('images', 10)], async (req, res) => {
    try {
        let product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ msg: 'Product not found' });

        // Check ownership
        if (product.supplier.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        const updates = { ...req.body };
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => file.path);
            updates.images = [...(product.images || []), ...newImages];
        }

        product = await Product.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
        res.json(product);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/products/:id
// @desc    Delete a product
router.delete('/:id', auth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ msg: 'Product not found' });

        // Check ownership
        if (product.supplier.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await product.deleteOne();
        res.json({ msg: 'Product removed' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;

