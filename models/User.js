const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: String, enum: ['buyer', 'supplier', 'logistics', 'admin'], default: 'buyer' },
    isSuspended: { type: Boolean, default: false },
    stats: {
        totalSpent: { type: Number, default: 0 },
        totalOrders: { type: Number, default: 0 },
        sellerRating: { type: Number, default: 5.0 }
    },

    // Supplier Specific
    companyName: String,
    address: String,
    city: String,
    country: String,
    isVerified: { type: Boolean, default: false },
    documents: [String],
    paymentInfo: {
        mobileMoney: String,
        bankDetails: String
    },

    fcmToken: { type: String }, // Pour les notifications push

    createdAt: { type: Date, default: Date.now }
});

// Password Hashing Middleware
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', UserSchema);
