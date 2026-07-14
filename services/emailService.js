const axios = require('axios');

/**
 * VISION MARKET AFRICA - PREMIER EMAIL SERVICE
 * Powered by Brevo API
 */
const sendEmail = async (to, subject, htmlContent) => {
    if (!process.env.BREVO_API_KEY) {
        console.log("⚠️ Brevo API Key manquante. Email simulé pour :", to);
        return;
    }

    try {
        await axios.post('https://api.brevo.com/v3/smtp/email', {
            sender: { name: "Vision Market Africa", email: "noreply@visionmarketafrica.com" },
            to: [{ email: to }],
            subject: subject,
            htmlContent: htmlContent
        }, {
            headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' }
        });
        console.log("✅ Email envoyé avec succès à", to);
    } catch (error) {
        console.error("❌ Erreur Brevo Email:", error.response ? error.response.data : error.message);
    }
};

module.exports = { sendEmail };
