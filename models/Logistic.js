const mongoose = require('mongoose');

const LogisticSchema = new mongoose.Schema({
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    trackingNumber: { type: String, required: true, unique: true },
    carrier: { type: String, default: 'VMA Logistics' },
    status: {
        type: String,
        enum: ['received', 'preparing', 'shipped', 'port_arrival', 'customs', 'in_transit', 'out_for_delivery', 'delivered'],
        default: 'received'
    },
    updates: [{
        status: String,
        location: String,
        description: String,
        timestamp: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Logistic', LogisticSchema);
