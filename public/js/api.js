/**
 * VISION MARKET AFRICA - API SERVICE LAYER (OPTIMIZED)
 */

const BASE_URL = "https://vma-backend-production.up.railway.app";
const API_BASE_URL = `${BASE_URL}/api`;

const API = {
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('vma_token');
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { 'x-auth-token': token }),
            ...options.headers
        };

        // Créer un indicateur de chargement visuel s'il n'existe pas
        if (!document.getElementById('vma-loader')) {
            const loader = document.createElement('div');
            loader.id = 'vma-loader';
            loader.style.cssText = "position:fixed; top:0; left:0; width:100%; height:3px; background:transparent; z-index:9999;";
            loader.innerHTML = "<div id='vma-progress' style='width:0; height:100%; background:var(--vma-gold); transition: width 0.3s;'></div>";
            document.body.appendChild(loader);
        }

        try {
            document.getElementById('vma-progress').style.width = '30%';

            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers
            });

            document.getElementById('vma-progress').style.width = '100%';
            setTimeout(() => { document.getElementById('vma-progress').style.width = '0'; }, 500);

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.msg || `Erreur ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            document.getElementById('vma-progress').style.width = '0';
            console.error('API Error:', error);

            if (error.message === "Failed to fetch") {
                // Au lieu d'une erreur, on simule une attente professionnelle
                if(window.Android) Android.showToast("Initialisation sécurisée de VMA Cloud... Veuillez patienter.");
            }
            throw error;
        }
    },

    login: (credentials) => API.request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (userData) => API.request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
    getProducts: () => API.request('/products'),
    getProductById: (id) => API.request(`/products/${id}`),
    createOrder: (order) => API.request('/orders', { method: 'POST', body: JSON.stringify(order) }),
    getOrders: () => API.request('/orders'),
    askBuddy: (query) => API.request('/ai/chat', { method: 'POST', body: JSON.stringify({ query }) }),
    analyzeLink: (url) => API.request('/tools/analyze-link', { method: 'POST', body: JSON.stringify({ url }) }),
    initiatePayment: (paymentData) => API.request('/payments/initiate', { method: 'POST', body: JSON.stringify(paymentData) })
};
