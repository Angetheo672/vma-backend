/**
 * VISION MARKET AFRICA - AUTHENTICATION ENGINE
 */

const Auth = {
    // Register User (Buyer or Supplier)
    async register(userData) {
        try {
            const data = await API.register(userData);
            localStorage.setItem('vma_token', data.token);
            localStorage.setItem('vma_user', JSON.stringify(userData));
            localStorage.setItem('vma_logged_in', 'true');
            if(window.Android) Android.showToast("Compte créé avec succès !");
            location.href = 'gateway.html';
        } catch (error) {
            alert("Erreur d'inscription : " + error.message);
        }
    },

    // Login
    async login(email, password) {
        try {
            const data = await API.login({ email, password });
            localStorage.setItem('vma_token', data.token);
            localStorage.setItem('vma_logged_in', 'true');
            localStorage.setItem('vma_role', data.role);

            if(window.Android) Android.showToast("Bienvenue sur VMA !");
            location.href = 'gateway.html';
        } catch (error) {
            alert("Échec de connexion : " + error.message);
        }
    },

    // Logout
    logout() {
        localStorage.clear();
        location.href = 'login.html';
    },

    // Check if session exists
    checkSession() {
        const isLoggedIn = localStorage.getItem('vma_logged_in');
        const currentPath = window.location.pathname;

        if (!isLoggedIn && !currentPath.includes('login.html') && !currentPath.includes('register.html')) {
            location.href = 'login.html';
        }
    }
};

// Auto-check on load
document.addEventListener('DOMContentLoaded', () => {
    Auth.checkSession();
});
