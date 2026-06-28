// ============================================================
// PrintoKids PH — Cart Manager
// localStorage for persistence; 3-step checkout modal
// ============================================================

const ORDERS_API = (window.API_ROOT || '../api') + '/product_orders.php';
const MY_ACCOUNT = window.MY_ACCOUNT_URL || 'my_account/index.html';

// ── Province → Shipping Zone map ──────────────────────────
const ZONE_MAP = {
    // NCR / Metro Manila
    'metro manila':'ncr','manila':'ncr','quezon city':'ncr','caloocan':'ncr',
    'las piñas':'ncr','las pinas':'ncr','makati':'ncr','malabon':'ncr',
    'mandaluyong':'ncr','marikina':'ncr','muntinlupa':'ncr','navotas':'ncr',
    'parañaque':'ncr','paranaque':'ncr','pasay':'ncr','pasig':'ncr',
    'pateros':'ncr','san juan':'ncr','taguig':'ncr','valenzuela':'ncr',
    // Luzon
    'cavite':'luzon','laguna':'luzon','batangas':'luzon','rizal':'luzon',
    'bulacan':'luzon','pampanga':'luzon','tarlac':'luzon','pangasinan':'luzon',
    'ilocos norte':'luzon','ilocos sur':'luzon','la union':'luzon',
    'bataan':'luzon','nueva ecija':'luzon','zambales':'luzon',
    'aurora':'luzon','quezon':'luzon','batanes':'luzon','cagayan':'luzon',
    'isabela':'luzon','nueva vizcaya':'luzon','quirino':'luzon',
    'albay':'luzon','camarines norte':'luzon','camarines sur':'luzon',
    'catanduanes':'luzon','masbate':'luzon','sorsogon':'luzon',
    'mindoro oriental':'luzon','mindoro occidental':'luzon','occidental mindoro':'luzon',
    'oriental mindoro':'luzon','palawan':'luzon','romblon':'luzon',
    'mountain province':'luzon','benguet':'luzon','ifugao':'luzon',
    'kalinga':'luzon','abra':'luzon','apayao':'luzon','baguio':'luzon',
    // Visayas
    'aklan':'visayas','antique':'visayas','capiz':'visayas','guimaras':'visayas',
    'iloilo':'visayas','negros occidental':'visayas','biliran':'visayas',
    'eastern samar':'visayas','leyte':'visayas','northern samar':'visayas',
    'samar':'visayas','southern leyte':'visayas','bohol':'visayas',
    'cebu':'visayas','negros oriental':'visayas','siquijor':'visayas',
    // Mindanao
    'zamboanga del norte':'mindanao','zamboanga del sur':'mindanao',
    'zamboanga sibugay':'mindanao','bukidnon':'mindanao','camiguin':'mindanao',
    'lanao del norte':'mindanao','misamis occidental':'mindanao',
    'misamis oriental':'mindanao','davao del norte':'mindanao',
    'davao del sur':'mindanao','davao oriental':'mindanao','davao':'mindanao',
    'compostela valley':'mindanao','davao de oro':'mindanao',
    'north cotabato':'mindanao','sarangani':'mindanao',
    'south cotabato':'mindanao','sultan kudarat':'mindanao',
    'agusan del norte':'mindanao','agusan del sur':'mindanao',
    'dinagat islands':'mindanao','surigao del norte':'mindanao',
    'surigao del sur':'mindanao','basilan':'mindanao','lanao del sur':'mindanao',
    'maguindanao':'mindanao','sulu':'mindanao','tawi-tawi':'mindanao',
};

const ZONE_LABELS = {
    ncr:      'Metro Manila (NCR)',
    luzon:    'Luzon',
    visayas:  'Visayas',
    mindanao: 'Mindanao',
};

function getZone(province) {
    return ZONE_MAP[(province || '').trim().toLowerCase()] || 'luzon';
}

// ── CartManager class ──────────────────────────────────────
class CartManager {
    constructor() {
        this.storageKey = 'printokids_cart';
        this.cart       = this.loadCart();
        // Checkout state
        this._settings         = null;
        this._checkoutStep     = 1;
        this._selectedAddrId   = null;
        this._selectedPayment  = null;
        this._proofUrl         = null;
        this._addresses        = [];
    }

    init() {
        this.updateBadge();
        document.getElementById('cartBtn')
            ?.addEventListener('click', () => this.showCartModal());
    }

    // ── Add item ───────────────────────────────────────────
    addItem(productId, quantity = 1, customizationNotes = '', mediaUrl = '') {
        if (!window.productManager) { this.showAlert('Products not loaded yet.', 'warning'); return; }

        const product = window.productManager.products.find(p => Number(p.id) === Number(productId));
        if (!product)  { this.showAlert('Product not found.', 'danger'); return; }

        const existing = this.cart.find(i => Number(i.id) === Number(productId));
        if (existing) {
            existing.quantity += quantity;
            if (customizationNotes) existing.customization_notes = customizationNotes;
            if (mediaUrl)           existing.media_upload_url    = mediaUrl;
        } else {
            this.cart.push({
                id:                  Number(product.id),
                name:                product.name,
                price:               parseFloat(product.base_cost),
                quantity:            quantity,
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
        this.showCartModal();
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

    getSubtotal()  { return this.cart.reduce((t, i) => t + i.price * i.quantity, 0); }
    getItemCount() { return this.cart.reduce((t, i) => t + i.quantity, 0); }

    save()     { localStorage.setItem(this.storageKey, JSON.stringify(this.cart)); }
    loadCart() {
        try { return JSON.parse(localStorage.getItem(this.storageKey) || '[]'); }
        catch { return []; }
    }

    updateBadge() {
        const badge = document.getElementById('cartBadge');
        if (!badge) return;
        const count = this.getItemCount();
        badge.textContent   = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    }

    // ── Cart modal ─────────────────────────────────────────
    showCartModal() {
        const oldModal = document.getElementById('cartModal');
        if (oldModal) { bootstrap.Modal.getInstance(oldModal)?.hide(); oldModal.remove(); }

        const emptyMsg   = '<p class="text-center text-muted py-3">Your cart is empty.</p>';
        const tableHtml  = this.cart.length === 0 ? emptyMsg : `
            <div class="table-responsive">
                <table class="table table-sm align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Product</th><th>Price</th>
                            <th style="width:90px">Qty</th><th>Subtotal</th><th></th>
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
                <strong class="fs-5">Subtotal: <span class="text-success">₱${this.getSubtotal().toFixed(2)}</span></strong>
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
                                <button type="button" class="btn btn-outline-danger"
                                    onclick="cartManager.clearCart()">Clear Cart</button>
                                <button type="button" class="btn btn-success"
                                    onclick="cartManager.checkout()">Proceed to Checkout</button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `);

        new bootstrap.Modal(document.getElementById('cartModal')).show();
    }

    // ── Checkout — opens 3-step modal ──────────────────────
    async checkout() {
        if (!window.authManager?.isLoggedIn()) {
            this.showAlert('Please sign in to place an order.', 'warning');
            bootstrap.Modal.getInstance(document.getElementById('cartModal'))?.hide();
            bootstrap.Modal.getOrCreateInstance(document.getElementById('signInModal')).show();
            return;
        }

        // Close cart modal first
        bootstrap.Modal.getInstance(document.getElementById('cartModal'))?.hide();

        // Fetch settings + addresses in parallel
        try {
            const apiBase = window.API_ROOT || '../api';
            const [settingsRes, addrRes] = await Promise.all([
                fetch(`${apiBase}/settings.php`),
                fetch(`${apiBase}/addresses.php`),
            ]);
            this._settings   = await settingsRes.json();
            this._addresses  = await addrRes.json();
        } catch {
            this.showAlert('Could not load checkout data. Check your connection.', 'danger');
            return;
        }

        // Reset state
        this._checkoutStep    = 1;
        this._selectedAddrId  = null;
        this._selectedPayment = null;
        this._proofUrl        = null;

        // Pre-select default address
        const def = this._addresses.find(a => Number(a.is_default));
        if (def) this._selectedAddrId = def.id;

        this._buildCheckoutModal();
    }

    // ── Build / refresh the checkout modal ────────────────
    _buildCheckoutModal() {
        const old = document.getElementById('checkoutModal');
        if (old) { bootstrap.Modal.getInstance(old)?.hide(); old.remove(); }

        const subtotal    = this.getSubtotal();
        const shippingFee = this._computeShipping();
        const orderTotal  = subtotal + shippingFee;

        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal fade" id="checkoutModal" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-dark text-white">
                            <h5 class="modal-title">Checkout
                                <span class="badge bg-secondary ms-2 fs-6" id="coStepBadge">
                                    Step ${this._checkoutStep} of 3
                                </span>
                            </h5>
                            <button type="button" class="btn-close btn-close-white"
                                data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body" id="coBody">
                            ${this._renderStep()}
                        </div>
                        <div class="modal-footer" id="coFooter">
                            ${this._renderFooter()}
                        </div>
                    </div>
                </div>
            </div>
        `);

        new bootstrap.Modal(document.getElementById('checkoutModal')).show();
    }

    // ── Refresh just body + footer (no modal rebuild) ─────
    _refreshCheckout() {
        document.getElementById('coBody').innerHTML   = this._renderStep();
        document.getElementById('coFooter').innerHTML = this._renderFooter();
        document.getElementById('coStepBadge').textContent = `Step ${this._checkoutStep} of 3`;
    }

    // ── Compute shipping from selected address ─────────────
    _computeShipping() {
        if (!this._selectedAddrId || !this._settings) return 0;
        const addr = this._addresses.find(a => Number(a.id) === Number(this._selectedAddrId));
        if (!addr) return 0;
        const zone    = getZone(addr.province);
        const rateKey = `shipping_${zone}`;
        return parseFloat(this._settings[rateKey] || 0);
    }

    // ── Render step content ────────────────────────────────
    _renderStep() {
        if (this._checkoutStep === 1) return this._renderStep1();
        if (this._checkoutStep === 2) return this._renderStep2();
        return this._renderStep3();
    }

    _renderFooter() {
        if (this._checkoutStep === 1) return `
            <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button class="btn btn-dark" onclick="cartManager._goStep(2)">
                Next: Payment Method →
            </button>
        `;
        if (this._checkoutStep === 2) return `
            <button class="btn btn-secondary" onclick="cartManager._goStep(1)">← Back</button>
            <button class="btn btn-dark" onclick="cartManager._goStep(3)">
                Next: Confirm Order →
            </button>
        `;
        return `
            <button class="btn btn-secondary" onclick="cartManager._goStep(2)">← Back</button>
            <button class="btn btn-success fw-bold" id="placeOrderBtn"
                onclick="cartManager._placeOrder()">Place Order</button>
        `;
    }

    // ── Step 1: Delivery ───────────────────────────────────
    _renderStep1() {
        const subtotal    = this.getSubtotal();
        const shippingFee = this._computeShipping();
        const orderTotal  = subtotal + shippingFee;

        let addrSection;
        if (!this._addresses.length) {
            addrSection = `
                <div class="alert alert-warning">
                    You have no saved addresses.
                    <a href="${MY_ACCOUNT}" class="alert-link">Add an address in My Account</a>
                    before checking out.
                </div>
            `;
        } else {
            const options = this._addresses.map(a => `
                <option value="${a.id}" ${Number(a.id) === Number(this._selectedAddrId) ? 'selected' : ''}>
                    ${this.esc(a.address_label || 'Address')} —
                    ${this.esc(a.street_address)}, ${this.esc(a.city)}, ${this.esc(a.province)}
                    ${Number(a.is_default) ? '(Default)' : ''}
                </option>
            `).join('');

            const selAddr = this._addresses.find(a => Number(a.id) === Number(this._selectedAddrId));
            const zone    = selAddr ? getZone(selAddr.province) : 'luzon';
            const zoneLbl = ZONE_LABELS[zone] || zone;

            addrSection = `
                <div class="mb-3">
                    <label class="form-label fw-bold">Delivery Address</label>
                    <select class="form-select" id="coAddrSelect"
                        onchange="cartManager._onAddrChange(this.value)">
                        ${options}
                    </select>
                    ${selAddr ? `
                    <div class="mt-2 p-2 border rounded bg-light small text-muted">
                        ${this.esc(selAddr.street_address)},
                        ${this.esc(selAddr.city)},
                        ${this.esc(selAddr.province)}
                        ${selAddr.postal_code ? this.esc(selAddr.postal_code) : ''}
                    </div>` : ''}
                </div>
                <p class="text-muted small mb-3">
                    Need a different address?
                    <a href="${MY_ACCOUNT}">Manage addresses in My Account</a>
                </p>
            `;
        }

        return `
            <h6 class="fw-bold text-uppercase text-muted mb-3">Step 1 — Delivery Details</h6>
            ${addrSection}
            <hr>
            <div class="d-flex justify-content-between small text-muted">
                <span>Products subtotal</span>
                <span>₱${subtotal.toFixed(2)}</span>
            </div>
            <div class="d-flex justify-content-between small text-muted mt-1">
                <span>Shipping fee
                    ${this._selectedAddrId && this._addresses.length
                        ? `<span class="badge bg-secondary ms-1" style="font-size:0.7rem">${this.esc(ZONE_LABELS[getZone((this._addresses.find(a=>Number(a.id)===Number(this._selectedAddrId))?.province)||'')] || '')}</span>`
                        : ''}
                </span>
                <span>${this._addresses.length ? '₱' + shippingFee.toFixed(2) : '—'}</span>
            </div>
            <div class="d-flex justify-content-between fw-bold mt-2 border-top pt-2">
                <span>Order Total</span>
                <span class="text-success fs-5">₱${orderTotal.toFixed(2)}</span>
            </div>
        `;
    }

    _onAddrChange(id) {
        this._selectedAddrId = Number(id);
        this._refreshCheckout();
    }

    // ── Step 2: Payment ────────────────────────────────────
    _renderStep2() {
        const s    = this._settings || {};
        const codOn  = s.payment_cod_enabled  !== '0';
        const qrOn   = s.payment_qr_enabled   !== '0';
        const cardOn = s.payment_card_enabled  !== '0';

        const methods = [
            { key: 'Cash on Delivery', label: 'Cash on Delivery',   icon: '💵', enabled: codOn,  desc: 'Pay in cash when your order arrives.' },
            { key: 'QR Pay',           label: 'Pay via QR Code',     icon: '📱', enabled: qrOn,   desc: 'Scan our QR code and upload your payment confirmation.' },
            { key: 'Card',             label: 'Pay via Card',        icon: '💳', enabled: cardOn, desc: 'Credit / Debit card payment.' },
        ];

        const cards = methods.map(m => {
            const isSelected = this._selectedPayment === m.key;
            const disabled   = !m.enabled;
            return `
                <div class="border rounded p-3 mb-2 d-flex align-items-start gap-3
                     ${isSelected && !disabled ? 'border-success bg-light' : ''}
                     ${disabled ? 'opacity-50' : 'cursor-pointer'}"
                     style="${disabled ? '' : 'cursor:pointer'}"
                     onclick="${disabled ? '' : `cartManager._selectPayment('${m.key}')`}">
                    <div class="form-check mt-1 flex-shrink-0">
                        <input class="form-check-input" type="radio" name="payMethod"
                               id="pay_${m.key.replace(/\s/g,'_')}"
                               ${isSelected && !disabled ? 'checked' : ''}
                               ${disabled ? 'disabled' : ''}
                               onchange="${disabled ? '' : `cartManager._selectPayment('${m.key}')`}">
                    </div>
                    <div class="flex-grow-1">
                        <strong>${m.icon} ${this.esc(m.label)}</strong>
                        ${disabled
                            ? `<span class="badge bg-secondary ms-2" style="font-size:0.7rem">Not available at the moment</span>`
                            : ''}
                        <p class="mb-0 small text-muted">${m.desc}</p>
                    </div>
                </div>
            `;
        }).join('');

        // QR + proof upload section
        let qrSection = '';
        if (this._selectedPayment === 'QR Pay' && qrOn) {
            const qrUrl = s.qr_code_url;
            qrSection = `
                <div class="mt-3 p-3 border rounded bg-light">
                    <p class="fw-bold mb-2">Scan the QR code below to pay:</p>
                    ${qrUrl
                        ? `<div class="text-center mb-3">
                               <img src="${this.esc(qrUrl)}" alt="Payment QR Code"
                                    style="max-width:220px;border:1px solid #ddd;border-radius:8px">
                           </div>`
                        : `<p class="text-muted small">QR code not yet configured. Please contact us directly.</p>`
                    }
                    <label class="form-label fw-bold">Upload Proof of Payment *</label>
                    <input type="file" class="form-control" id="proofUploadInput"
                           accept="image/jpeg,image/png,image/webp"
                           onchange="cartManager._uploadProof(this)">
                    <div id="proofUploadStatus" class="mt-2 small"></div>
                    ${this._proofUrl
                        ? `<div class="mt-2 text-success small">✔ Proof uploaded
                               <a href="${this.esc(this._proofUrl)}" target="_blank">(view)</a>
                           </div>`
                        : ''}
                </div>
            `;
        }

        return `
            <h6 class="fw-bold text-uppercase text-muted mb-3">Step 2 — Payment Method</h6>
            ${cards}
            ${qrSection}
        `;
    }

    _selectPayment(key) {
        this._selectedPayment = key;
        if (key !== 'QR Pay') this._proofUrl = null;
        this._refreshCheckout();
    }

    async _uploadProof(input) {
        const file = input.files[0];
        if (!file) return;
        const statusEl = document.getElementById('proofUploadStatus');
        statusEl.innerHTML = '<span class="text-muted">Uploading…</span>';

        const formData = new FormData();
        formData.append('file', file);

        try {
            const apiBase = window.API_ROOT || '../api';
            const res  = await fetch(`${apiBase}/upload.php`, { method: 'POST', body: formData });
            const data = await res.json();
            if (data.url) {
                this._proofUrl = data.url;
                statusEl.innerHTML = `<span class="text-success">✔ Uploaded — <a href="${this.esc(data.url)}" target="_blank">view file</a></span>`;
            } else {
                statusEl.innerHTML = `<span class="text-danger">${this.esc(data.error || 'Upload failed.')}</span>`;
            }
        } catch {
            statusEl.innerHTML = '<span class="text-danger">Upload error. Please try again.</span>';
        }
    }

    // ── Step 3: Confirm ────────────────────────────────────
    _renderStep3() {
        const subtotal    = this.getSubtotal();
        const shippingFee = this._computeShipping();
        const orderTotal  = subtotal + shippingFee;

        const addr    = this._addresses.find(a => Number(a.id) === Number(this._selectedAddrId));
        const zone    = addr ? getZone(addr.province) : 'luzon';
        const zoneLbl = ZONE_LABELS[zone] || zone;

        const addrHtml = addr
            ? `${addr.address_label ? `<strong>${this.esc(addr.address_label)}</strong><br>` : ''}
               ${this.esc(addr.street_address)}, ${this.esc(addr.city)},
               ${this.esc(addr.province)} ${addr.postal_code ? this.esc(addr.postal_code) : ''}`
            : '<span class="text-danger">No address selected</span>';

        const itemRows = this.cart.map(i => `
            <tr>
                <td>${this.esc(i.name)}</td>
                <td class="text-end">₱${i.price.toFixed(2)}</td>
                <td class="text-center">${i.quantity}</td>
                <td class="text-end">₱${(i.price * i.quantity).toFixed(2)}</td>
            </tr>
        `).join('');

        return `
            <h6 class="fw-bold text-uppercase text-muted mb-3">Step 3 — Confirm Your Order</h6>

            <div class="row g-3 mb-3">
                <div class="col-md-6">
                    <p class="mb-1 fw-bold small text-muted text-uppercase">Delivery Address</p>
                    <p class="mb-0 small">${addrHtml}</p>
                </div>
                <div class="col-md-6">
                    <p class="mb-1 fw-bold small text-muted text-uppercase">Payment Method</p>
                    <p class="mb-0 small">${this.esc(this._selectedPayment || '—')}</p>
                    ${this._proofUrl
                        ? `<p class="mb-0 small text-success">✔ Proof of payment uploaded</p>`
                        : ''}
                </div>
            </div>

            <table class="table table-sm table-bordered small">
                <thead class="table-light">
                    <tr>
                        <th>Product</th>
                        <th class="text-end">Unit Price</th>
                        <th class="text-center">Qty</th>
                        <th class="text-end">Subtotal</th>
                    </tr>
                </thead>
                <tbody>${itemRows}</tbody>
            </table>

            <div class="d-flex justify-content-between small text-muted">
                <span>Products subtotal</span>
                <span>₱${subtotal.toFixed(2)}</span>
            </div>
            <div class="d-flex justify-content-between small text-muted mt-1">
                <span>Shipping fee <span class="badge bg-secondary ms-1" style="font-size:0.7rem">${this.esc(zoneLbl)}</span></span>
                <span>₱${shippingFee.toFixed(2)}</span>
            </div>
            <div class="d-flex justify-content-between fw-bold mt-2 border-top pt-2">
                <span class="fs-6">Order Total</span>
                <span class="text-success fs-5">₱${orderTotal.toFixed(2)}</span>
            </div>
            <div id="placeOrderError" class="alert alert-danger mt-3 py-2 small" style="display:none"></div>
        `;
    }

    // ── Navigate between steps ─────────────────────────────
    _goStep(step) {
        // Validate before advancing
        if (step > this._checkoutStep) {
            if (this._checkoutStep === 1) {
                if (!this._selectedAddrId) {
                    this.showAlert('Please select a delivery address.', 'warning');
                    return;
                }
            }
            if (this._checkoutStep === 2) {
                if (!this._selectedPayment) {
                    this.showAlert('Please select a payment method.', 'warning');
                    return;
                }
                if (this._selectedPayment === 'QR Pay' && !this._proofUrl) {
                    this.showAlert('Please upload your proof of payment for QR Pay.', 'warning');
                    return;
                }
            }
        }
        this._checkoutStep = step;
        this._refreshCheckout();
    }

    // ── Place the order ────────────────────────────────────
    async _placeOrder() {
        if (!this._selectedAddrId) {
            this.showAlert('Please select a delivery address.', 'warning'); return;
        }
        if (!this._selectedPayment) {
            this.showAlert('Please select a payment method.', 'warning'); return;
        }
        if (this._selectedPayment === 'QR Pay' && !this._proofUrl) {
            this.showAlert('Please upload your proof of payment.', 'warning'); return;
        }

        const btn = document.getElementById('placeOrderBtn');
        if (btn) { btn.disabled = true; btn.textContent = 'Placing order…'; }

        const errEl = document.getElementById('placeOrderError');
        if (errEl) errEl.style.display = 'none';

        try {
            const res  = await fetch(ORDERS_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_id:          window.authManager.getUserId(),
                    shipping_address_id:  this._selectedAddrId,
                    payment_method:       this._selectedPayment,
                    shipping_fee:         this._computeShipping(),
                    proof_of_payment_url: this._proofUrl || null,
                    items: this.cart.map(i => ({
                        product_id:          i.id,
                        quantity:            i.quantity,
                        customization_notes: i.customization_notes || '',
                        media_upload_url:    i.media_upload_url    || '',
                    })),
                }),
            });
            const data = await res.json();

            if (data.success) {
                this.clearCart();
                bootstrap.Modal.getInstance(document.getElementById('checkoutModal'))?.hide();
                this.showAlert(
                    `Order #${String(data.id).padStart(3,'0')} placed successfully! Check My Account for updates.`,
                    'success'
                );
                setTimeout(() => { window.location.href = MY_ACCOUNT; }, 2500);
            } else {
                if (errEl) {
                    errEl.textContent   = data.error || 'Could not place order. Please try again.';
                    errEl.style.display = 'block';
                }
                if (btn) { btn.disabled = false; btn.textContent = 'Place Order'; }
            }
        } catch {
            if (errEl) {
                errEl.textContent   = 'Connection error. Please try again.';
                errEl.style.display = 'block';
            }
            if (btn) { btn.disabled = false; btn.textContent = 'Place Order'; }
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
        div.style.cssText = 'position:fixed;top:16px;right:16px;z-index:9999;min-width:280px;max-width:380px';
        div.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 5000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.cartManager = new CartManager();
    cartManager.init();
});
