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
connectDB();

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
