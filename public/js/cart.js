/* ===========================================
   Vision Market Africa
   cart.js - Harmonized with VMA Elite Engine
=========================================== */

let cart = JSON.parse(localStorage.getItem("vma_cart")) || [];

document.addEventListener('DOMContentLoaded', () => {
    if(typeof renderCart === 'function') renderCart();
});

// Logic moved to inline scripts in cart.html for reactivity,
// but keeping shared utilities here.

function formatPrice(price) {
    return new Intl.NumberFormat('fr-FR').format(price);
}
