/* ===========================================
   Vision Market Africa
   marketplace.js
=========================================== */

let allProducts = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    initSearch();
    initSort();
});

async function fetchProducts() {
    const container = document.getElementById("marketProducts");
    if (!container) return;

    try {
        const products = await API.getProducts();
        allProducts = products;
        displayProducts(products);
    } catch (error) {
        console.error("Erreur de chargement des produits:", error);
        container.innerHTML = "<p>Erreur lors du chargement des produits. Veuillez réessayer plus tard.</p>";
    }
}

function displayProducts(products) {
    const container = document.getElementById("marketProducts");
    if (!container) return;

    container.innerHTML = "";
    if (products.length === 0) {
        container.innerHTML = "<p>Aucun produit trouvé.</p>";
        return;
    }

    products.forEach(product => {
        container.innerHTML += `
            <div class="product-card">
                <a href="product.html?id=${product.id}" style="text-decoration: none; color: inherit;">
                    <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x200?text=${product.name}'">
                </a>
                <div class="product-info">
                    <span class="category">${product.category}</span>
                    <a href="product.html?id=${product.id}" style="text-decoration: none; color: inherit;">
                        <h3>${product.name}</h3>
                    </a>
                    <p class="price">${product.price.toLocaleString()} FCFA</p>
                    <div class="buttons">
                        <button class="buy-btn" onclick="buyNow(${product.id})">Acheter</button>
                        <button class="cart-btn" onclick="addToCart(${product.id})">
                            <i class="fa fa-cart-shopping"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
}

function filterCategory(category) {
    const categoryTitle = document.getElementById("categoryTitle");
    categoryTitle.textContent = category === 'Tous' ? "Tous les Produits" : category;

    if (category === 'Tous') {
        displayProducts(allProducts);
    } else {
        const filtered = allProducts.filter(p => p.category === category || (category === 'Mode' && (p.category === 'Mode' || p.category === 'Mode Femme' || p.category === 'Mode Homme')));
        displayProducts(filtered);
    }
}

function initSearch() {
    const searchInput = document.getElementById("marketSearch");
    if (!searchInput) return;

    searchInput.addEventListener("keyup", function() {
        const keyword = this.value.toLowerCase();
        const filtered = allProducts.filter(p =>
            p.name.toLowerCase().includes(keyword) ||
            p.category.toLowerCase().includes(keyword)
        );
        displayProducts(filtered);
    });
}

function initSort() {
    const sortSelect = document.getElementById("sortProducts");
    if (!sortSelect) return;

    sortSelect.addEventListener("change", function() {
        let sorted = [...allProducts];
        switch(this.value) {
            case "price-asc":
                sorted.sort((a, b) => a.price - b.price);
                break;
            case "price-desc":
                sorted.sort((a, b) => b.price - a.price);
                break;
            case "popular":
                sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
        }
        displayProducts(sorted);
    });
}

function addToCart(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.push(product);
    localStorage.setItem("cart", JSON.stringify(cart));
    alert(product.name + " ajouté au panier.");
}

function buyNow(id) {
    alert("Redirection vers le paiement...");
}
