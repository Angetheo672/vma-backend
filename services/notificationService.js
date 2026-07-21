const admin = require('firebase-admin');
const serviceAccount = require('../config/firebase-auth.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

/**
 * VMA NOTIFICATION SERVICE
 * Sends push notifications to mobile devices
 */
class NotificationService {
    async sendPushNotification(token, title, body, data = {}) {
        if (!token) return;

        const message = {
            notification: { title, body },
            data: { ...data, click_action: 'FLUTTER_NOTIFICATION_CLICK' },
            token: token
        };

        try {
            const response = await admin.messaging().send(message);
            console.log('Successfully sent message:', response);
            return response;
        } catch (error) {
            console.error('Error sending message:', error);
            return null;
        }
    }

    // Special: Notify all admins
    async notifyAdmins(title, body, data = {}) {
        // Logic to fetch all admin tokens and send
    }
}

module.exports = new NotificationService();
