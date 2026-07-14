const mongoose = require('mongoose');

const LogisticSchema = new mongoose.Schema({
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    carrier: { type: String, required: true }, // ex: VMA Air Cargo, VMA Sea
    trackingNumber: { type: String, required: true, unique: true },
    status: {
        type: String,
        enum: ['en_attente', 'collecte', 'en_transit', 'douane', 'arrive', 'livre'],
        default: 'en_attente'
    },
    location: { type: String, default: 'Entrepôt Guangzhou, Chine' },
    estimatedDelivery: Date,
    deliveryNotes: String,
    history: [{
        status: String,
        location: String,
        timestamp: { type: Date, default: Date.now }
    }],
    createdBy: { type: String }, // Admin ID
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Logistic', LogisticSchema);
