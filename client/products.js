// ============================================================
// PrintoKids PH — Product Manager
// Loads active products from api/products.php
// "View Details" navigates to product_details/index.html?id=X
// ============================================================

const PRODUCTS_API          = (window.API_ROOT || '../api') + '/products.php';
const PRODUCTS_IMG_FALLBACK = window.PRODUCTS_IMG_FALLBACK || 'images/Product_TEMP.png';
const PRODUCTS_DETAIL_URL   = window.PRODUCTS_DETAIL_URL   || 'product_details/index.html';

class ProductManager {
    constructor() {
        this.products         = [];
        this.filteredProducts = [];
        this.currentCategory  = 'all';
        this.currentSearch    = '';
        this.displayLimit     = window.PRODUCTS_DISPLAY_LIMIT || null;
    }

    async init() {
        await this.loadProducts();
        this.setupEventListeners();
    }

    // ── Load from API ──────────────────────────────────────
    async loadProducts() {
        const container = document.getElementById('products-container');
        if (!container) return;

        try {
            // products.php returns only is_active=1 by default
            const res  = await fetch(PRODUCTS_API);
            const data = await res.json();

            if (!Array.isArray(data)) throw new Error('Invalid response');

            this.products        = data;
            this.filteredProducts = data;
            this.renderProducts();
        } catch (e) {
            console.error('Error loading products:', e);
            if (container) container.innerHTML =
                '<p class="text-center text-muted py-4">Could not load products. Please try again later.</p>';
        }
    }

    // ── Render product grid ────────────────────────────────
    renderProducts() {
        const container = document.getElementById('products-container');
        if (!container) return;

        if (!this.filteredProducts.length) {
            container.innerHTML = '<p class="text-center text-muted py-4">No products found.</p>';
            const btn = document.getElementById('viewMoreBtn');
            if (btn) btn.style.display = 'none';
            return;
        }

        const toShow = this.displayLimit
            ? this.filteredProducts.slice(0, this.displayLimit)
            : this.filteredProducts;

        container.innerHTML = toShow.map((p, i) => {
            const oos = p.stock_status === 'Out of Stock';
            const delay = (i % 4) * 80;
            return `
            <div class="col" data-aos="fade-up" data-aos-delay="${delay}">
                <div class="card h-100 text-center product-card${oos ? ' oos-card' : ''}"
                     onclick="window.location.href='${PRODUCTS_DETAIL_URL}?id=${p.id}'">
                    <div class="position-relative">
                        <img src="${p.primary_image || PRODUCTS_IMG_FALLBACK}"
                             class="card-img-top"
                             alt="${this.esc(p.name)}"
                             onerror="this.src='${PRODUCTS_IMG_FALLBACK}'">
                        ${oos ? `<span class="position-absolute top-0 start-0 w-100 text-center py-1 small fw-bold text-white" style="background:rgba(220,38,38,0.88);letter-spacing:0.05em;">Out of Stock</span>` : ''}
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title mb-1">${this.esc(p.name)}</h5>
                        <p class="card-text text-muted small mb-1">${this.esc(p.category || 'General')}</p>
                        ${p.description
                            ? `<p class="card-text description mb-2">${this.esc(p.description)}</p>`
                            : ''}
                        <p class="card-text fw-bold text-success mt-auto">₱${parseFloat(p.base_cost).toFixed(2)}</p>
                    </div>
                    <div class="card-footer bg-white border-top-0 pb-3">
                        <button class="btn btn-outline-secondary btn-sm me-1"
                            onclick="event.stopPropagation(); window.location.href='${PRODUCTS_DETAIL_URL}?id=${p.id}'">
                            View Details
                        </button>
                        <button class="btn btn-success btn-sm"
                            ${oos ? 'disabled' : ''}
                            onclick="event.stopPropagation(); ${oos ? '' : `cartManager.addItem(${p.id}, 1)`}">
                            ${oos ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                    </div>
                </div>
            </div>
            `;
        }).join('');

        // Show/hide "View All" button
        const btn = document.getElementById('viewMoreBtn');
        if (btn) {
            btn.style.display = (this.displayLimit && this.filteredProducts.length > this.displayLimit)
                ? 'block' : 'none';
        }
    }

    // ── Filters ────────────────────────────────────────────
    filterByCategory(category) {
        this.currentCategory = category;
        this.applyFilters();
    }

    search(term) {
        this.currentSearch = term.toLowerCase();
        this.applyFilters();
    }

    applyFilters() {
        let list = [...this.products];

        if (this.currentCategory !== 'all') {
            list = list.filter(p =>
                (p.category || '').toLowerCase() === this.currentCategory
            );
        }
        if (this.currentSearch) {
            list = list.filter(p =>
                (p.name + ' ' + (p.category || '') + ' ' + (p.description || ''))
                    .toLowerCase().includes(this.currentSearch)
            );
        }

        this.filteredProducts = list;
        this.renderProducts();
    }

    // ── Event listeners ────────────────────────────────────
    setupEventListeners() {
        document.getElementById('productSearch')
            ?.addEventListener('input', e => this.search(e.target.value));

        document.querySelectorAll('[data-filter-category]').forEach(btn => {
            btn.addEventListener('click', e => {
                document.querySelectorAll('[data-filter-category]')
                    .forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filterByCategory(e.target.dataset.filterCategory);
            });
        });
    }

    esc(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g,'&amp;').replace(/</g,'&lt;')
            .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.productManager = new ProductManager();
    productManager.init();
});
