/**
 * VISION MARKET AFRICA - SELLER DASHBOARD LOGIC
 */

document.addEventListener('DOMContentLoaded', async () => {
    console.log("VMA Seller Dashboard Engine Started...");
    await loadSellerStats();
    await loadSellerProducts();
    await loadSellerOrders();
});

async function loadSellerStats() {
    try {
        if (typeof API !== 'undefined') {
            const stats = await API.request('/admin/stats'); // We can reuse or create specific seller stats
            // Update UI elements if they exist
            // document.getElementById('total-revenue').innerText = formatPrice(stats.totalRevenue) + ' F';
        }
    } catch (error) {
        console.error("Stats Error:", error);
    }
}

async function loadSellerProducts() {
    const container = document.getElementById('sellerProductList');
    if (!container) return;

    try {
        const myProducts = await API.request('/products/me');

        if (myProducts.length === 0) {
            container.innerHTML = '<p style="padding: 20px; text-align: center; font-size: 12px; color: var(--text-muted);">Aucun produit en vente.</p>';
            return;
        }

        container.innerHTML = myProducts.map(p => `
            <div class="seller-prod-row">
                <img src="${(p.images && p.images[0]) || 'https://via.placeholder.com/50'}" alt="${p.name}">
                <div style="flex: 1;">
                    <div style="font-size: 13px; font-weight: 500;">${p.name}</div>
                    <div style="font-size: 11px; color: var(--text-muted);">Stock: ${p.stock || 0} units</div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <i class="fa fa-pen-to-square" style="color: var(--vma-blue);" onclick="editProduct('${p._id}')"></i>
                    <i class="fa fa-trash" style="color: var(--vma-accent-red);" onclick="deleteProduct('${p._id}')"></i>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error("Products Error:", error);
    }
}

async function loadSellerOrders() {
    const container = document.getElementById('sellerOrderList');
    if (!container) return;

    try {
        const orders = await API.getOrders();
        // For suppliers, we'd only show orders containing their products

        container.innerHTML = orders.slice(0, 5).map(o => `
            <div class="order-item">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="font-size: 11px; font-weight: 700;">#${o._id.toString().slice(-6).toUpperCase()}</span>
                    <span class="status-badge ${o.paymentStatus === 'paid' ? 'status-paid' : 'status-pending'}">
                        ${o.paymentStatus === 'paid' ? 'Payé' : 'En attente'}
                    </span>
                </div>
                <div style="display: flex; gap: 10px;">
                    <div style="flex: 1;">
                        <div style="font-size: 13px; font-weight: 500;">${o.items.length} article(s)</div>
                        <div style="font-size: 12px; color: var(--vma-gold);">${formatPrice(o.totalAmount)} F</div>
                    </div>
                    <button class="btn-sm" style="background: var(--vma-gold); color: #000;" onclick="location.href='order_details.html?id=${o._id}'">Détails</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error("Orders Error:", error);
    }
}

function formatPrice(price) {
    return new Intl.NumberFormat('fr-FR').format(price);
}
