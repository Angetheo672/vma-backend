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
require('dotenv').config();

const app = express();

// MIDDLEWARE
app.use(express.json());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-auth-token']
}));
app.use(helmet({
    crossOriginResourcePolicy: false,
}));
app.use(morgan('dev'));

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

app.get('/', (req, res) => {
    res.json({ message: "Welcome to Vision Market Africa API v1.0" });
});

// START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`VMA Server running at http://192.168.1.86:${PORT}`);
    console.log(`Accessible from your phone on the same WiFi`);

    // AUTO-WAKEUP STRATEGY (CTO Master Class)
    // Pinger le serveur toutes les 10 minutes pour éviter la mise en veille de Render
    const axios = require('axios');
    setInterval(() => {
        axios.get('https://vma-backend.onrender.com/health')
            .then(() => console.log('Self-ping: VMA Server is Awake ✅'))
            .catch(err => console.log('Self-ping failed, but that is okay.'));
    }, 600000); // 600 000 ms = 10 minutes
});
