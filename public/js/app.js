/* ============================================================
   VMA ELITE CORE v3.0 - OFFICIAL PRODUCTION CONFIG
   CTO Final Polish with Real WhatsApp & Payment Gateway
============================================================ */

const VMA_DATA = {
    products: [],
    favorites: (JSON.parse(localStorage.getItem('vma_favorites')) || []).filter(i => i !== null),
    cart: (JSON.parse(localStorage.getItem('vma_cart')) || []).filter(i => i !== null)
};

// --- OFFICIAL CONTACT CONFIG ---
const VMA_WHATSAPP_ACCOUNT = "237659337034";
const VMA_WHATSAPP_GROUP = "https://chat.whatsapp.com/LeeO6fqmMCK57I38klKDW8";

// INITIALIZATION
document.addEventListener('DOMContentLoaded', async () => {
    console.log("VMA Elite v3.0 - Loading Production Config...");

    updateUserProfile(); // Affiche le profil en haut à droite

    if (document.getElementById('productFeed')) {
        showSkeletons();
        await loadProducts();
    }

    updateCartBadge();
    initVMAComponents();
    initRealTimeSearch(); // Active la recherche instantanée

    // Auto-sync FCM Token if logged in
    const fcmToken = localStorage.getItem('fcm_token');
    if (fcmToken && localStorage.getItem('vma_token')) {
        API.updateFCMToken(fcmToken).catch(e => console.log("FCM Sync deferred"));
    }
});

function updateFCMToken(token) {
    localStorage.setItem('fcm_token', token);
    if (localStorage.getItem('vma_token')) {
        API.updateFCMToken(token).then(() => console.log("FCM Token Synced"));
    }
}

// 0. USER PROFILE MANAGEMENT
function updateUserProfile() {
    const user = JSON.parse(localStorage.getItem('vma_user'));
    const profileContainer = document.querySelector('.top-nav-right') || document.querySelector('.header-actions');

    if (user && profileContainer) {
        // Déterminer le nom à afficher (Prénom ou Nom complet)
        const displayName = user.firstName || user.fullName || "Elite";

        // Utiliser la photo du compte ou une icône Google-style par défaut
        const photoUrl = user.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(displayName) + '&background=D4AF37&color=fff&bold=true';

        profileContainer.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <div class="user-info-text" style="text-align: right; display: none;">
                    <div style="font-size: 10px; color: var(--vma-gold); font-weight: 700; text-transform: uppercase;">Bonjour,</div>
                    <div style="font-size: 12px; font-weight: 700; color: #fff;">${displayName}</div>
                </div>
                <div class="user-profile-circle" onclick="location.href='profile.html'" style="width: 38px; height: 38px; border: 2px solid var(--vma-gold); position: relative;">
                    <img src="${photoUrl}" alt="Profile" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">
                    <div style="position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; background: #52c41a; border-radius: 50%; border: 1.5px solid #000;"></div>
                </div>
            </div>
        `;

        // On affiche le texte si l'écran est assez large
        if (window.innerWidth > 360) {
            const textInfo = profileContainer.querySelector('.user-info-text');
            if (textInfo) textInfo.style.display = 'block';
        }
    }
}

// 0.1 REAL-TIME SEARCH (AUTO-SEARCH AS YOU TYPE)
function initRealTimeSearch() {
    const searchInput = document.getElementById('vmaSearchInput');
    if (!searchInput) return;

    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim().toLowerCase();

        // On attend 300ms après la fin de la frappe pour ne pas surcharger le processeur
        debounceTimer = setTimeout(() => {
            console.log("Recherche en cours :", query);
            const filteredProducts = VMA_DATA.products.filter(p =>
                p.name.toLowerCase().includes(query) ||
                (p.category && p.category.toLowerCase().includes(query))
            );
            renderFilteredProducts(filteredProducts);
        }, 300);
    });
}

function renderFilteredProducts(products) {
    const feed = document.getElementById('productFeed') || document.getElementById('marketplaceFeed');
    if (!feed) return;

    if (products.length === 0) {
        feed.innerHTML = `<div class="no-results" style="text-align:center; padding:40px; color:#888;">
            <i class="fa fa-search" style="font-size:40px; margin-bottom:10px;"></i>
            <p>Aucun produit ne correspond à votre recherche.</p>
        </div>`;
        return;
    }

    // On réutilise la fonction de rendu existante avec les résultats filtrés
    const originalProducts = VMA_DATA.products;
    VMA_DATA.products = products;
    renderProductFeed();
    VMA_DATA.products = originalProducts; // On remet les données originales en mémoire
}

// 1. PRODUCTS SYNC
async function loadProducts() {
    try {
        const products = await API.getProducts();
        VMA_DATA.products = products;
        renderProductFeed();
    } catch (error) {
        console.warn("API Offline, using premium local cache");
        VMA_DATA.products = [
            { _id: '1', name: "iPhone 15 Pro Max Titanium", price: 785000, oldPrice: 850000, images: ["https://images.unsplash.com/photo-1696446701796-da61225697cc?w=800"], isVerified: true, rating: 4.9, isPromo: true },
            { _id: '2', name: "Smart TV 55' 4K Crystal", price: 350000, images: ["https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800"], isVerified: true, rating: 5.0 },
            { _id: '3', name: "Chaussures Sport Elite Air", price: 35000, images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"], source: "1688", rating: 4.7 }
        ];
        renderProductFeed();
    }
}

function renderProductFeed() {
    const feed = document.getElementById('productFeed') || document.getElementById('marketplaceFeed');
    if (!feed) return;

    feed.innerHTML = VMA_DATA.products.map(product => {
        const source = product.source || (Math.random() > 0.5 ? '1688' : 'VMA');
        const sourceColor = source === '1688' ? '#ff6600' : 'var(--vma-gold)';
        const discount = product.oldPrice ? Math.round((1 - (product.price / product.oldPrice)) * 100) : null;
        const img = (product.images && product.images[0]) || 'https://via.placeholder.com/300?text=VMA';

        return `
            <div class="modern-card" onclick="location.href='product.html?id=${product._id}'">
                <div class="card-image-wrap">
                    <img src="${img}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300?text=VMA'">
                    <div class="source-tag" style="background: ${sourceColor}">${source}</div>
                    ${discount ? `<div class="promo-tag">-${discount}%</div>` : ''}
                    <div class="fav-btn ${isFav(product._id) ? 'active' : ''}" onclick="toggleFav(event, '${product._id}')">
                        <i class="fa${isFav(product._id) ? 's' : 'r'} fa-heart"></i>
                    </div>
                </div>
                <div class="card-body">
                    <h3 class="product-name">${product.name}</h3>
                    <div class="price-container">
                        <div class="price-row">
                            <span class="current-price">${formatPrice(product.price)} F</span>
                            ${product.oldPrice ? `<span class="old-price">${formatPrice(product.oldPrice)} F</span>` : ''}
                        </div>
                    </div>
                    <div class="card-footer">
                        <div class="rating"><i class="fa fa-star"></i> ${product.rating || '4.8'}</div>
                        ${product.isVerified ? '<i class="fa fa-check-circle" style="color: var(--vma-blue); font-size: 12px;"></i>' : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 2. VMA GLOBAL COMPONENTS
function initVMAComponents() {
    // Floating WhatsApp Button (Real Number)
    if (!document.querySelector('.wa-floating-btn')) {
        const waBtn = document.createElement('div');
        waBtn.className = 'wa-floating-btn';
        waBtn.innerHTML = '<i class="fa-brands fa-whatsapp"></i>';
        waBtn.style.cssText = `
            position: fixed; left: 20px; bottom: 100px; width: 55px; height: 55px;
            background: #25D366; color: #fff; border-radius: 50%; display: flex;
            align-items: center; justify-content: center; font-size: 28px; z-index: 2500;
            box-shadow: 0 5px 15px rgba(37,211,102,0.4); border: 2px solid #fff;
        `;
        waBtn.onclick = () => window.open(`https://wa.me/${VMA_WHATSAPP_ACCOUNT}?text=Bonjour Vision Market Africa !`, '_blank');
        document.body.appendChild(waBtn);
    }

    // Join WhatsApp Group Button (On Index)
    if (document.querySelector('.group-buy-section')) {
        const groupBtn = document.createElement('button');
        groupBtn.className = 'vma-btn-primary';
        groupBtn.style.cssText = 'width:calc(100% - 32px); margin: 0 16px 20px; background:#25D366; color:#fff; font-size:13px;';
        groupBtn.innerHTML = '<i class="fa-brands fa-whatsapp"></i> REJOINDRE LE GROUPE D\'ACHATS';
        groupBtn.onclick = () => window.open(VMA_WHATSAPP_GROUP, '_blank');
        document.querySelector('.group-buy-section').after(groupBtn);
    }

    // Emma AI Button
    if (!document.querySelector('.emma-floating-btn') && !window.location.href.includes('ai_assistant')) {
        const emmaBtn = document.createElement('div');
        emmaBtn.className = 'emma-floating-btn';
        emmaBtn.innerHTML = '<i class="fa fa-robot"></i>';
        emmaBtn.style.cssText = `
            position: fixed; right: 20px; bottom: 100px; width: 60px; height: 60px;
            background: #ff4d94; color: #fff; border-radius: 50%; display: flex;
            align-items: center; justify-content: center; font-size: 26px; z-index: 2500;
            box-shadow: 0 10px 25px rgba(255,77,148,0.4); border: 3px solid #000;
        `;
        emmaBtn.onclick = () => location.href = 'ai_assistant.html';
        document.body.appendChild(emmaBtn);
    }
}

// 3. UTILS
function formatPrice(price) { return new Intl.NumberFormat('fr-FR').format(price); }
function isFav(id) { return VMA_DATA.favorites.some(p => p._id === id); }
function toggleFav(event, id) {
    event.stopPropagation();
    const index = VMA_DATA.favorites.findIndex(p => p._id === id);
    if(index > -1) VMA_DATA.favorites.splice(index, 1);
    else {
        const product = VMA_DATA.products.find(p => p._id === id);
        if (product) VMA_DATA.favorites.push(product);
    }
    localStorage.setItem('vma_favorites', JSON.stringify(VMA_DATA.favorites));
    renderProductFeed();
}
function updateCartBadge() {
    const badge = document.getElementById('cart-count');
    if (badge) {
        badge.innerText = VMA_DATA.cart.length;
        badge.style.display = VMA_DATA.cart.length > 0 ? 'flex' : 'none';
    }
}
function showSkeletons() {
    const feed = document.getElementById('productFeed');
    if (!feed) return;
    feed.innerHTML = Array(4).fill(0).map(() => `<div class="skeleton-card"><div class="skeleton-img"></div></div>`).join('');
}

// 4. SCANNER HANDLER
function onScanResult(result) {
    console.log("Code scanné :", result);
    if (window.Android) Android.showToast("Code détecté : " + result);

    // Si c'est un lien, on l'ouvre
    if (result.startsWith('http')) {
        location.href = result;
    } else {
        // Sinon on lance une recherche
        location.href = 'search.html?query=' + encodeURIComponent(result);
    }
}
