/**
 * VISION MARKET AFRICA - AUTHENTICATION ENGINE (ELITE v3.0)
 */

const Auth = {
    // Register User (Buyer or Supplier)
    async register(userData) {
        try {
            // Split Full Name into First and Last Name for Backend compatibility
            const nameParts = userData.fullName.split(' ');
            const firstName = nameParts[0] || "Client";
            const lastName = nameParts.slice(1).join(' ') || "VMA";

            const payload = {
                firstName,
                lastName,
                email: userData.email,
                password: userData.password,
                phone: userData.phone,
                role: userData.role || 'buyer'
            };

            const data = await API.register(payload);
            localStorage.setItem('vma_token', data.token);
            localStorage.setItem('vma_user', JSON.stringify(payload));
            localStorage.setItem('vma_logged_in', 'true');
            localStorage.setItem('vma_role', payload.role);

            if(window.Android) Android.showToast("Bienvenue chez l'Elite VMA !");
            location.href = 'gateway.html';
        } catch (error) {
            console.error("Registration Error:", error);
            alert("Erreur d'inscription : " + error.message);
        }
    },

    // Login
    async login(email, password) {
        try {
            const data = await API.login({ email, password });

            // Store Session
            localStorage.setItem('vma_token', data.token);
            localStorage.setItem('vma_logged_in', 'true');
            localStorage.setItem('vma_role', data.role);

            // Get user info and store it
            // Optionnel: On pourrait faire un appel API /auth/me ici pour avoir le profil complet
            localStorage.setItem('vma_user', JSON.stringify({ email, role: data.role }));

            if(window.Android) Android.showToast("Heureux de vous revoir !");
            location.href = 'gateway.html';
        } catch (error) {
            console.error("Login Error:", error);
            // Si le backend renvoie "Invalid Credentials", on affiche un message propre
            const msg = error.message === "Invalid Credentials" ? "Email ou mot de passe incorrect." : error.message;
            alert("Échec de connexion : " + msg);
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

        // On ne redirige pas si on est déjà sur login ou register
        if (currentPath.includes('login.html') || currentPath.includes('register.html') || currentPath.includes('welcome.html')) {
            return;
        }

        if (!isLoggedIn) {
            location.href = 'welcome.html';
        }
    }
};

// INITIALIZE FORM BINDINGS
document.addEventListener('DOMContentLoaded', () => {
    // Handling Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = loginForm.querySelector('button');
            const originalText = btn.innerText;

            btn.innerText = "CONNEXION...";
            btn.disabled = true;
            await Auth.login(email, password);
            btn.innerText = originalText;
            btn.disabled = false;
        };
    }

    // Handling Register Form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.onsubmit = async (e) => {
            e.preventDefault();
            const fullName = document.getElementById('fullName').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role') ? document.getElementById('role').value : 'buyer';

            const btn = registerForm.querySelector('button');
            const originalText = btn.innerText;

            btn.innerText = "CRÉATION...";
            btn.disabled = true;
            await Auth.register({ fullName, email, phone, password, role });
            btn.innerText = originalText;
            btn.disabled = false;
        };
    }

    Auth.checkSession();
});
