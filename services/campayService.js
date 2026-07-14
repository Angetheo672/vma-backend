const axios = require('axios');

/**
 * VISION MARKET AFRICA - CAMPAY SERVICE (Mobile Money Cameroon)
 */
class CampayService {
    constructor() {
        this.baseUrl = 'https://www.campay.net/api';
        this.token = null;
    }

    async authenticate() {
        try {
            const response = await axios.post(`${this.baseUrl}/token/`, {
                username: process.env.CAMPAY_USER,
                password: process.env.CAMPAY_PASSWORD
            });
            this.token = response.data.token;
            return this.token;
        } catch (error) {
            console.error("❌ Campay Auth Error:", error.response ? error.response.data : error.message);
            throw new Error("Campay Authentication Failed");
        }
    }

    async collect(amount, phoneNumber, externalReference) {
        if (!this.token) await this.authenticate();

        try {
            const response = await axios.post(`${this.baseUrl}/collect/`, {
                amount: amount,
                currency: 'XAF',
                from: phoneNumber,
                description: `Commande VMA ${externalReference}`,
                external_reference: externalReference
            }, {
                headers: { 'Authorization': `Token ${this.token}` }
            });
            return response.data; // { reference, status }
        } catch (error) {
            console.error("❌ Campay Collect Error:", error.response ? error.response.data : error.message);
            throw error;
        }
    }

    async checkStatus(reference) {
        if (!this.token) await this.authenticate();
        try {
            const response = await axios.get(`${this.baseUrl}/transaction/${reference}/`, {
                headers: { 'Authorization': `Token ${this.token}` }
            });
            return response.data;
        } catch (error) {
            console.error("❌ Campay Status Error:", error.response ? error.response.data : error.message);
            throw error;
        }
    }
}

module.exports = new CampayService();
