const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
        };

        console.log('Connexion à la base de données Vision Market Africa...');
        const conn = await mongoose.connect(process.env.MONGO_URI, options);
        console.log(`✅ MongoDB connecté : ${conn.connection.host}`);
    } catch (err) {
        console.error(`❌ Erreur DB : ${err.message}`);
        console.log('⚠️ Mode Dégradé : Le serveur continue sans base de données (Fonctionnalités limitées).');
        // Don't exit in production if you want the app to at least show the UI
    }
};

module.exports = connectDB;
