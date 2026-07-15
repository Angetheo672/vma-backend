const admin = require('firebase-admin');

/**
 * VISION MARKET AFRICA - FIREBASE NOTIFICATION SERVICE
 */
const initFirebase = () => {
    if (!admin.apps.length) {
        try {
            let serviceAccount;

            // 1. Priorité à la variable d'environnement (Railway)
            if (process.env.FIREBASE_CONFIG_JSON) {
                serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG_JSON);
                console.log("✅ Firebase initialisé via variable d'environnement");
            }
            // 2. Repli sur le fichier local (Développement)
            else {
                serviceAccount = require("../config/firebase-auth.json");
                console.log("✅ Firebase initialisé via fichier local");
            }

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        } catch (e) {
            console.log("⚠️ Firebase Config absent ou invalide. Mode simulation actif.");
            console.error("Détail erreur Firebase:", e.message);
        }
    }
};

const sendPushNotification = async (token, title, body) => {
    initFirebase();
    if (!admin.apps.length) return;

    const message = {
        notification: { title, body },
        token: token
    };

    try {
        const response = await admin.messaging().send(message);
        console.log("✅ Notification envoyée:", response);
    } catch (error) {
        console.error("❌ Erreur d'envoi notification:", error);
    }
};

module.exports = { sendPushNotification };
