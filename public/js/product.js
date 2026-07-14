/* ===========================================
   Vision Market Africa
   product.js
=========================================== */

let currentProduct = null;

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));

    if (productId) {
        loadProductDetails(productId);
    } else {
        // Rediriger vers marketplace si aucun ID n'est fourni
        console.warn("Aucun ID de produit trouvé dans l'URL");
    }

    const cartBtn = document.getElementById('cartBtn');
    const buyBtn = document.getElementById('buyBtn');

    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            if (currentProduct) {
                addToCart(currentProduct);
            }
        });
    }

    if (buyBtn) {
        buyBtn.addEventListener('click', () => {
            alert("Redirection vers le paiement...");
        });
    }
});

async function loadProductDetails(id) {
    try {
        currentProduct = await API.getProductById(id);
        if (currentProduct) {
            updateUI(currentProduct);
        } else {
            document.querySelector('.product-details').innerHTML = "<h2>Produit non trouvé</h2>";
        }
    } catch (error) {
        console.error("Erreur:", error);
        // Fallback or error message
    }
}

function updateUI(product) {
    document.getElementById('productName').innerText = product.name;
    document.getElementById('productPrice').innerText = product.price.toLocaleString() + " FCFA";
    document.getElementById('productCategory').innerText = product.category;
    document.getElementById('productImage').src = product.image;

    if (product.rating) {
        document.getElementById('productRating').innerText = `(${product.rating})`;
    }
}

function addToCart(product) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.push(product);
    localStorage.setItem("cart", JSON.stringify(cart));
    alert(product.name + " a été ajouté à votre panier !");
}
