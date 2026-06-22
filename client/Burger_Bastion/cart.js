// Shopping Cart Manager - Burger Bastion Version
// Handles cart operations: add, remove, update quantities, persist to localStorage

class CartManager {
    constructor() {
        this.storageKey = 'printokids_cart';
        this.cart = this.loadCart();
    }

    /**
     * Initialize cart manager
     */
    init() {
        this.updateCartDisplay();
        this.setupEventListeners();
    }

    /**
     * Add item to cart
     */
    addItem(productId, quantity = 1) {
        // Get product details from product manager
        if (!window.productManager) {
            this.showAlert('Product manager not initialized', 'error');
            return;
        }

        const product = window.productManager.products.find(p => p.id === productId);
        if (!product) {
            this.showAlert('Product not found', 'error');
            return;
        }

        // Check if item already in cart
        const existingItem = this.cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({
                id: product.id,
                name: product.name,
                price: product.base_cost,
                quantity: quantity
            });
        }

        this.saveCart();
        this.updateCartDisplay();
        this.showAlert(`${product.name} added to cart!`, 'success');
    }

    /**
     * Remove item from cart
     */
    removeItem(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartDisplay();
    }

    /**
     * Update item quantity
     */
    updateQuantity(productId, quantity) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            if (quantity <= 0) {
                this.removeItem(productId);
            } else {
                item.quantity = quantity;
                this.saveCart();
                this.updateCartDisplay();
            }
        }
    }

    /**
     * Get cart total
     */
    getTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    /**
     * Get item count
     */
    getItemCount() {
        return this.cart.reduce((count, item) => count + item.quantity, 0);
    }

    /**
     * Clear entire cart
     */
    clearCart() {
        this.cart = [];
        this.saveCart();
        this.updateCartDisplay();
    }

    /**
     * Save cart to localStorage
     */
    saveCart() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.cart));
    }

    /**
     * Load cart from localStorage
     */
    loadCart() {
        const saved = localStorage.getItem(this.storageKey);
        return saved ? JSON.parse(saved) : [];
    }

    /**
     * Update cart display (badge count)
     */
    updateCartDisplay() {
        const cartBadge = document.getElementById('cartBadge');
        const itemCount = this.getItemCount();
        
        if (cartBadge) {
            if (itemCount > 0) {
                cartBadge.textContent = itemCount;
                cartBadge.style.display = 'inline-block';
            } else {
                cartBadge.style.display = 'none';
            }
        }
    }

    /**
     * Display cart modal
     */
    showCartModal() {
        const cartContent = this.cart.length === 0 
            ? '<p class="text-center text-white">Your cart is empty</p>'
            : `
                <div class="table-responsive">
                    <table class="table table-sm table-dark">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Price</th>
                                <th>Qty</th>
                                <th>Subtotal</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.cart.map(item => `
                                <tr>
                                    <td>${this.escapeHtml(item.name)}</td>
                                    <td>₱${parseFloat(item.price).toFixed(2)}</td>
                                    <td>
                                        <input type="number" class="form-control form-control-sm" style="width: 70px;" 
                                               value="${item.quantity}" min="1" max="100"
                                               onchange="cartManager.updateQuantity(${item.id}, this.value)">
                                    </td>
                                    <td>₱${(item.price * item.quantity).toFixed(2)}</td>
                                    <td>
                                        <button class="btn btn-danger btn-sm" onclick="cartManager.removeItem(${item.id})">
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="border-top pt-3">
                    <h6 class="text-end text-white">Total: <span class="text-success fs-5">₱${this.getTotal().toFixed(2)}</span></h6>
                </div>
            `;

        const modalHtml = `
            <div class="modal fade" id="cartModal" tabindex="-1" aria-labelledby="cartModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content bg-dark text-white">
                        <div class="modal-header">
                            <h5 class="modal-title" id="cartModalLabel">Shopping Cart</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            ${cartContent}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Continue Shopping</button>
                            ${this.cart.length > 0 ? `
                                <button type="button" class="btn btn-danger" onclick="cartManager.clearCart()">Clear Cart</button>
                                <button type="button" class="btn btn-success" onclick="cartManager.checkout()">Proceed to Checkout</button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove old modal if exists
        const oldModal = document.getElementById('cartModal');
        if (oldModal) oldModal.remove();

        // Add new modal
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('cartModal'));
        modal.show();
    }

    /**
     * Proceed to checkout (creates order)
     */
    async checkout() {
        // For now, just show message
        this.showAlert('Checkout feature coming soon! Cart items will be saved.', 'info');
        console.log('Current cart:', this.cart);
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const cartBtn = document.getElementById('cartBtn');
        if (cartBtn) {
            cartBtn.addEventListener('click', () => this.showCartModal());
        }
    }

    /**
     * Show alert notification
     */
    showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type === 'warning' ? 'warning' : type === 'success' ? 'success' : 'info'} alert-dismissible fade show`;
        alertDiv.setAttribute('role', 'alert');
        alertDiv.style.position = 'fixed';
        alertDiv.style.top = '20px';
        alertDiv.style.right = '20px';
        alertDiv.style.zIndex = '9999';
        alertDiv.style.minWidth = '300px';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 5000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.cartManager = new CartManager();
    cartManager.init();
});
