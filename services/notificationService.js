const admin = require('firebase-admin');

/**
 * VISION MARKET AFRICA - FIREBASE NOTIFICATION SERVICE
 */
const initFirebase = () => {
    if (!admin.apps.length) {
        try {
            // Tentative de chargement du fichier de config Firebase
            // Si absent, le service fonctionnera en mode simulation
            const serviceAccount = require("../config/firebase-auth.json");
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log("✅ Firebase Admin initialisé");
        } catch (e) {
            console.log("⚠️ Firebase Config absent. Notifications en mode simulation.");
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
