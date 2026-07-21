/**
 * VISION MARKET AFRICA - BACKEND CORE
 * Author: VMA CTO Team
 * Version: 1.0.0
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();

// MIDDLEWARE
app.use(express.json());
app.use(cors());
app.use(helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false, // Nécessaire pour charger des ressources externes en mode WebApp
}));
app.use(morgan('dev'));

// SERVIR LES FICHIERS STATIQUES (La Méthode B)
app.use(express.static(path.join(__dirname, 'public')));

// Logger for debugging 404s
app.use((req, res, next) => {
    console.log(`Incoming Request: ${req.method} ${req.url}`);
    next();
});

// DATABASE CONNECTION
const connectDB = require('./config/db');
const Product = require('./models/Product');
const Order = require('./models/Order');

connectDB().then(async () => {
    console.log("Vérification des numéros de suivi (Produits & Commandes)...");
    try {
        // Migration Produits
        const productsToUpdate = await Product.find({ vmaId: { $exists: false } });
        if (productsToUpdate.length > 0) {
            console.log(`${productsToUpdate.length} produits sans ID trouvés. Génération...`);
            for (let product of productsToUpdate) {
                const timestamp = Date.now().toString().slice(-4);
                const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
                product.vmaId = `VMA-PRD-${timestamp}-${randomStr}`;
                await product.save();
            }
        }

        // Migration Commandes
        const ordersToUpdate = await Order.find({ trackingNumber: { $exists: false } });
        if (ordersToUpdate.length > 0) {
            console.log(`${ordersToUpdate.length} commandes sans tracking trouvées. Génération...`);
            for (let order of ordersToUpdate) {
                const year = new Date().getFullYear().toString().slice(-2);
                const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
                order.trackingNumber = `VMA-TRK-${year}${randomStr}`;
                await order.save();
            }
        }
        console.log("Système de suivi à jour ✅");
    } catch (err) {
        console.error("Erreur migration Suivi :", err);
    }
});

// Health Check
app.get('/health', (req, res) => {
    res.json({
        status: 'UP',
        db: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        time: new Date()
    });
});

// ROUTES
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/tools', require('./routes/tools'));
app.use('/api/logistics', require('./routes/logistics'));
app.use('/api/supplier', require('./routes/supplier'));

app.get('/', (req, res) => {
    res.json({ message: "Welcome to Vision Market Africa API v1.0" });
});

// START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`VMA Server is running on port ${PORT}`);

    // AUTO-WAKEUP STRATEGY (Only if a URL is provided)
    if (process.env.APP_URL) {
        const axios = require('axios');
        setInterval(() => {
            axios.get(`${process.env.APP_URL}/health`)
                .then(() => console.log('Self-ping: VMA Server is Awake ✅'))
                .catch(err => console.log('Self-ping skipped.'));
        }, 600000); // 10 minutes
    }
});
