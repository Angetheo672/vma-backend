const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'XAF' },
    method: { type: String, enum: ['orange_money', 'mtn_momo', 'bank_transfer', 'card'], required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
    transactionId: { type: String, unique: true },
    country: { type: String, enum: ['CM', 'NG', 'CI', 'GA'], required: true }, // Initial focus CM, NG
    metaData: Object,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', PaymentSchema);
