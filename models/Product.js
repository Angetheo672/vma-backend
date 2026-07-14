const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: 'XAF' },
    category: { type: String, required: true },
    images: [String], // Cloudinary URLs
    stock: { type: Number, default: 0 },
    moq: { type: Number, default: 1 }, // Minimum Order Quantity
    rating: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    isPromo: { type: Boolean, default: false },
    discountPrice: Number,
    vmaId: { type: String, unique: true }, // Le numéro de suivi du produit
    attributes: {
        color: [String],
        size: [String],
        weight: Number
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', ProductSchema);
