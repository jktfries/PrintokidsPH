// Product Management Module
// Handles loading, displaying, filtering, and managing products from the database

class ProductManager {
    constructor() {
        this.apiUrl = '../../api/inventory.php';
        this.products = [];
        this.filteredProducts = [];
        this.currentCategory = 'all';
    }

    /**
     * Initialize product manager
     */
    async init() {
        await this.loadProducts();
        this.setupEventListeners();
    }

    /**
     * Load all products from API
     */
    async loadProducts() {
        try {
            const response = await fetch(this.apiUrl);
            if (response.ok) {
                this.products = await response.json();
                this.filteredProducts = this.products;
                this.displayProducts();
                this.displayCatalogCategories();
            } else {
                console.error('Failed to load products');
                this.showAlert('Could not load products. Please try again later.', 'error');
            }
        } catch (error) {
            console.error('Error loading products:', error);
            this.showAlert('An error occurred while loading products.', 'error');
        }
    }

    /**
     * Display products in container
     */
    displayProducts() {
        const container = document.getElementById('products-container');
        if (!container) return;

        if (this.filteredProducts.length === 0) {
            container.innerHTML = '<p class="text-center mt-4">No products available.</p>';
            return;
        }

        container.innerHTML = this.filteredProducts.map(product => `
            <div class="col">
                <div class="card h-100 text-center product-card">
                <img src="${this.getProductImage(product)}" class="card-img-top featured-product-img" alt="${this.escapeHtml(product.name)}">
                
                <div class="card-body">
                    <h5 class="card-title">${this.escapeHtml(product.name)}</h5>
                    <p class="card-text text-muted">${this.escapeHtml(product.category)}</p>
                    <p class="card-text fw-bold text-success">₱${parseFloat(product.base_cost).toFixed(2)}</p>
                    </div>

                    <div class="card-footer bg-white border-top-0">
                        <button class="btn btn-primary btn-sm" onclick="productManager.showProductModal(${product.id})">
                            View Details
                        </button>
                        <button class="btn btn-success btn-sm" onclick="cartManager.addItem(${product.id}, 1)">
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Show product detail modal
     */
    showProductModal(productId) {
        const product = this.products.find(p => Number(p.id) === Number(productId));

        if (!product) return;

        const modalHtml = `
            <div class="modal fade" id="productModal" tabindex="-1" aria-labelledby="productModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="productModalLabel">${this.escapeHtml(product.name)}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <p><strong>Category:</strong> ${this.escapeHtml(product.category)}</p>
                            <p><strong>Price:</strong> <span class="text-success fs-5">₱${parseFloat(product.base_cost).toFixed(2)}</span></p>
                            <div class="mb-3">
                                <label for="quantity" class="form-label">Quantity:</label>
                                <input type="number" class="form-control" id="quantity" value="1" min="1" max="100">
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-success" onclick="productManager.addToCartFromModal(${product.id})">
                                Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove old modal if exists
        const oldModal = document.getElementById('productModal');
        if (oldModal) oldModal.remove();

        // Add new modal
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('productModal'));
        modal.show();
    }

    /**
     * Add to cart from modal
     */
    addToCartFromModal(productId) {
        const quantity = parseInt(document.getElementById('quantity')?.value) || 1;
        cartManager.addItem(productId, quantity);

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
        if (modal) modal.hide();
    }

    /**
     * Filter products by category
     */
    filterByCategory(category) {
        this.currentCategory = category;
        if (category === 'all') {
            this.filteredProducts = this.products;
        } else {
            this.filteredProducts = this.products.filter(p =>
                p.category.toLowerCase() === category.toLowerCase()
            );
        }
        this.displayProducts();
    }

    /**
     * Search products by name
     */
    searchProducts(searchTerm) {
        const term = searchTerm.toLowerCase();
        this.filteredProducts = this.products.filter(p =>
            p.name.toLowerCase().includes(term) ||
            p.category.toLowerCase().includes(term)
        );
        this.displayProducts();
    }

    /**
     * Get unique categories from products
     */
    getCategories() {
        return [...new Set(this.products.map(p => p.category))];
    }

    /**
 * Get product image based on category/name
 */
getProductImage(product) {
    const name = (product.name || '').toLowerCase();
    const category = (product.category || '').toLowerCase();

    if (name.includes('tote') || name.includes('bag') || category.includes('bag')) {
        return 'printokids_images/totebag_TEMP.jpg';
    }

    if (name.includes('sticker') || category.includes('sticker')) {
        return 'printokids_images/Product_TEMP.png';
    }

    if (name.includes('jacket') || name.includes('shirt') || category.includes('apparel')) {
        return 'printokids_images/Product_TEMP.png';
    }

    if (name.includes('lanyard') || category.includes('lanyard')) {
        return 'printokids_images/Product_TEMP.png';
    }

    if (name.includes('tumbler') || name.includes('mug') || category.includes('drinkware')) {
        return 'printokids_images/Product_TEMP.png';
    }

    if (name.includes('cap') || category.includes('accessories')) {
        return 'printokids_images/Product_TEMP.png';
    }

    return 'printokids_images/Product_TEMP.png';
}

/**
 * Get category display image
 */
getCategoryImage(category) {
    const categoryName = (category || '').toLowerCase();

    if (categoryName.includes('bag')) {
        return 'printokids_images/totebag_TEMP.jpg';
    }

    if (categoryName.includes('apparel')) {
        return 'printokids_images/Product_TEMP.png';
    }

    if (categoryName.includes('sticker')) {
        return 'printokids_images/Product_TEMP.png';
    }

    if (categoryName.includes('lanyard')) {
        return 'printokids_images/Product_TEMP.png';
    }

    if (categoryName.includes('drinkware')) {
        return 'printokids_images/Product_TEMP.png';
    }

    if (categoryName.includes('accessories')) {
        return 'printokids_images/Product_TEMP.png';
    }

    return 'printokids_images/Product_TEMP.png';
}

/**
 * Display category cards inside Product Catalog modal
 */
displayCatalogCategories() {
    const container = document.getElementById('catalogCategoriesContainer');
    if (!container) return;

    const categories = this.getCategories().filter(category => category && category.trim() !== '');

    if (categories.length === 0) {
        container.innerHTML = '<p class="text-center text-white">No categories available.</p>';
        return;
    }

    container.innerHTML = categories.map(category => {
        const productCount = this.products.filter(product =>
            (product.category || '').toLowerCase() === category.toLowerCase()
        ).length;

        return `
            <div class="col">
                <div class="card h-100 catalog-category-card text-center">
                    <img src="${this.getCategoryImage(category)}" class="card-img-top catalog-category-img" alt="${this.escapeHtml(category)}">
                    <div class="card-body">
                        <h5 class="card-title">${this.escapeHtml(category)}</h5>
                        <p class="card-text text-muted">${productCount} product(s)</p>
                        <button type="button" class="btn btn-success btn-sm" onclick="productManager.showCatalogProducts('${this.escapeHtml(category)}')">
                            View Products
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Show products under selected catalog category
 */
showCatalogProducts(category) {
    const categoryView = document.getElementById('catalogCategoryView');
    const productsView = document.getElementById('catalogProductsView');
    const selectedCategoryTitle = document.getElementById('catalogSelectedCategory');
    const productsContainer = document.getElementById('catalogProductsContainer');

    if (!categoryView || !productsView || !selectedCategoryTitle || !productsContainer) return;

    const selectedProducts = this.products.filter(product =>
        (product.category || '').toLowerCase() === category.toLowerCase()
    );

    selectedCategoryTitle.textContent = category;

    if (selectedProducts.length === 0) {
        productsContainer.innerHTML = '<p class="text-center text-white">No products found in this category.</p>';
    } else {
        productsContainer.innerHTML = selectedProducts.map(product => `
            <div class="col">
                <div class="card h-100 text-center catalog-product-card">
                    <img src="${this.getProductImage(product)}" class="card-img-top catalog-product-img" alt="${this.escapeHtml(product.name)}">
                    
                    <div class="card-body">
                        <h5 class="card-title">${this.escapeHtml(product.name)}</h5>
                        <p class="card-text text-muted">${this.escapeHtml(product.category || 'General')}</p>
                        <p class="card-text fw-bold text-success">₱${parseFloat(product.base_cost).toFixed(2)}</p>
                    </div>

                    <div class="card-footer bg-white border-top-0">
                        <button class="btn btn-primary btn-sm" onclick="productManager.showProductModal(${Number(product.id)})">
                            View Details
                        </button>
                        <button class="btn btn-success btn-sm" onclick="cartManager.addItem(${Number(product.id)}, 1)">
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    categoryView.style.display = 'none';
    productsView.style.display = 'block';
}

/**
 * Return to category view in Product Catalog modal
 */
showCatalogCategories() {
    const categoryView = document.getElementById('catalogCategoryView');
    const productsView = document.getElementById('catalogProductsView');

    if (categoryView) categoryView.style.display = 'block';
    if (productsView) productsView.style.display = 'none';

    this.displayCatalogCategories();
}

    /**
     * Setup event listeners for filters/search
     */
    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('productSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchProducts(e.target.value);
            });
        }

        // Category filter buttons
        const categoryBtns = document.querySelectorAll('[data-filter-category]');
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Update active state
                document.querySelectorAll('[data-filter-category]').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                // Filter
                this.filterByCategory(e.target.dataset.filterCategory);
            });
        });
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
     * Show alert notification
     */
    showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} alert-dismissible fade show`;
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
    window.productManager = new ProductManager();
    productManager.init();
});
