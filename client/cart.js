// ============================================================
// PrintoKids PH — Cart Manager
// localStorage for persistence; checkout POSTs to API
// ============================================================

const ORDERS_API    = (window.API_ROOT || '../api') + '/product_orders.php';
const MY_ACCOUNT    = window.MY_ACCOUNT_URL || 'my_account/index.html';

class CartManager {
    constructor() {
        this.storageKey = 'printokids_cart';
        this.cart       = this.loadCart();
    }

    init() {
        this.updateBadge();
        document.getElementById('cartBtn')
            ?.addEventListener('click', () => this.showCartModal());
    }

    // ── Add item ───────────────────────────────────────────
    // customizationNotes and mediaUrl are optional (set from product details page)
    addItem(productId, quantity = 1, customizationNotes = '', mediaUrl = '') {
        if (!window.productManager) { this.showAlert('Products not loaded yet.', 'warning'); return; }

        const product = window.productManager.products.find(p => Number(p.id) === Number(productId));
        if (!product)  { this.showAlert('Product not found.', 'danger'); return; }

        const existing = this.cart.find(i => Number(i.id) === Number(productId));
        if (existing) {
            existing.quantity += quantity;
            // Update customization if provided
            if (customizationNotes) existing.customization_notes = customizationNotes;
            if (mediaUrl)           existing.media_upload_url    = mediaUrl;
        } else {
            this.cart.push({
                id:                 Number(product.id),
                name:               product.name,
                price:              parseFloat(product.base_cost),
                quantity:           quantity,
                customization_notes: customizationNotes || '',
                media_upload_url:    mediaUrl           || '',
            });
        }

        this.save();
        this.updateBadge();
        this.showAlert(`${product.name} added to cart!`, 'success');
    }

    removeItem(productId) {
        this.cart = this.cart.filter(i => Number(i.id) !== Number(productId));
        this.save();
        this.updateBadge();
        this.showCartModal(); // refresh modal
    }

    updateQuantity(productId, qty) {
        qty = parseInt(qty);
        if (qty <= 0) { this.removeItem(productId); return; }
        const item = this.cart.find(i => Number(i.id) === Number(productId));
        if (item) { item.quantity = qty; this.save(); this.updateBadge(); }
    }

    clearCart() {
        this.cart = [];
        this.save();
        this.updateBadge();
    }

    getTotal()     { return this.cart.reduce((t, i) => t + i.price * i.quantity, 0); }
    getItemCount() { return this.cart.reduce((t, i) => t + i.quantity, 0); }

    save()      { localStorage.setItem(this.storageKey, JSON.stringify(this.cart)); }
    loadCart()  {
        try { return JSON.parse(localStorage.getItem(this.storageKey) || '[]'); }
        catch { return []; }
    }

    updateBadge() {
        const badge = document.getElementById('cartBadge');
        if (!badge) return;
        const count = this.getItemCount();
        badge.textContent    = count;
        badge.style.display  = count > 0 ? 'inline-block' : 'none';
    }

    // ── Cart modal ─────────────────────────────────────────
    showCartModal() {
        const oldModal = document.getElementById('cartModal');
        if (oldModal) {
            bootstrap.Modal.getInstance(oldModal)?.hide();
            oldModal.remove();
        }

        const emptyMsg = '<p class="text-center text-muted py-3">Your cart is empty.</p>';
        const tableHtml = this.cart.length === 0 ? emptyMsg : `
            <div class="table-responsive">
                <table class="table table-sm align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Product</th>
                            <th>Price</th>
                            <th style="width:90px">Qty</th>
                            <th>Subtotal</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.cart.map(item => `
                            <tr>
                                <td>
                                    <strong>${this.esc(item.name)}</strong>
                                    ${item.customization_notes
                                        ? `<br><small class="text-muted">Note: ${this.esc(item.customization_notes)}</small>`
                                        : ''}
                                </td>
                                <td>₱${item.price.toFixed(2)}</td>
                                <td>
                                    <input type="number" class="form-control form-control-sm"
                                           value="${item.quantity}" min="1" max="100"
                                           onchange="cartManager.updateQuantity(${item.id}, this.value)">
                                </td>
                                <td>₱${(item.price * item.quantity).toFixed(2)}</td>
                                <td>
                                    <button class="btn btn-outline-danger btn-sm"
                                            onclick="cartManager.removeItem(${item.id})">✕</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="d-flex justify-content-end align-items-center border-top pt-3">
                <strong class="fs-5">Total: <span class="text-success">₱${this.getTotal().toFixed(2)}</span></strong>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal fade" id="cartModal" tabindex="-1" aria-label="Shopping cart">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Shopping Cart
                                <span class="badge bg-secondary ms-2">${this.getItemCount()} item${this.getItemCount() !== 1 ? 's' : ''}</span>
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">${tableHtml}</div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Continue Shopping</button>
                            ${this.cart.length > 0 ? `
                                <button type="button" class="btn btn-outline-danger" onclick="cartManager.clearCart()">Clear Cart</button>
                                <button type="button" class="btn btn-success" onclick="cartManager.checkout()">Proceed to Checkout</button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `);

        new bootstrap.Modal(document.getElementById('cartModal')).show();
    }

    // ── Checkout ───────────────────────────────────────────
    async checkout() {
        if (!window.authManager?.isLoggedIn()) {
            this.showAlert('Please sign in to place an order.', 'warning');
            bootstrap.Modal.getInstance(document.getElementById('cartModal'))?.hide();
            new bootstrap.Modal(document.getElementById('signInModal')).show();
            return;
        }

        const customerId = window.authManager.getUserId();
        if (!customerId) { this.showAlert('Session error. Please sign in again.', 'danger'); return; }

        const btn = document.querySelector('#cartModal .btn-success');
        if (btn) { btn.disabled = true; btn.textContent = 'Placing order…'; }

        try {
            const res  = await fetch(ORDERS_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_id: customerId,
                    items: this.cart.map(i => ({
                        product_id:          i.id,
                        quantity:            i.quantity,
                        customization_notes: i.customization_notes || '',
                        media_upload_url:    i.media_upload_url    || '',
                    }))
                })
            });
            const data = await res.json();

            if (data.success) {
                this.clearCart();
                bootstrap.Modal.getInstance(document.getElementById('cartModal'))?.hide();
                this.showAlert('Order placed successfully! Check My Account for status updates.', 'success');
                // Redirect to My Account after a short delay
                setTimeout(() => { window.location.href = MY_ACCOUNT; }, 2000);
            } else {
                this.showAlert(data.error || 'Could not place order. Please try again.', 'danger');
                if (btn) { btn.disabled = false; btn.textContent = 'Proceed to Checkout'; }
            }
        } catch {
            this.showAlert('Connection error. Please try again.', 'danger');
            if (btn) { btn.disabled = false; btn.textContent = 'Proceed to Checkout'; }
        }
    }

    // ── Helpers ────────────────────────────────────────────
    esc(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g,'&amp;').replace(/</g,'&lt;')
            .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    showAlert(message, type = 'info') {
        const div = document.createElement('div');
        div.className = `alert alert-${type} alert-dismissible fade show pk-toast`;
        div.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 5000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.cartManager = new CartManager();
    cartManager.init();
});
