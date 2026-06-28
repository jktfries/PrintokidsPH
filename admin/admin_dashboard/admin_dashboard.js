// ============================================================
// PrintoKids PH — Admin Dashboard
// ============================================================
// API path: ../../api  (relative from admin/admin_dashboard/)
// ============================================================

const API = '../../api';

// ── Global state ────────────────────────────────────────────
let allProducts       = [];
let allOrders         = [];
let allEventBookings  = [];
let allUsers          = [];
let allStaff          = [];
let allSettings       = {};

let currentProductFilter      = 'All';
let currentProductSearch      = '';
let currentOrderFilter        = 'All';
let currentEventFilter        = 'All';
let currentEventSearch        = '';

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    // Session guard — redirect to login if not a staff member
    let isAdminUser = false;
    try {
        const res  = await fetch(`${API}/auth.php?action=check`);
        const data = await res.json();
        if (!data.logged_in || data.user_type !== 'admin') {
            window.location.href = '../admin_login/index.html';
            return;
        }
        isAdminUser = !!data.is_admin;

        // Hide admin-only tabs for non-admin staff
        if (!isAdminUser) {
            ['#products', '#inventory', '#users', '#settings'].forEach(sel => {
                document.querySelector(`.tab-trigger[data-bs-target="${sel}"]`)
                    ?.closest('li')?.style.setProperty('display', 'none');
            });
        }
    } catch {
        window.location.href = '../admin_login/index.html';
        return;
    }

    setupTabListeners();
    setupFormListeners();

    // Load all data in parallel so dashboard can aggregate immediately
    await Promise.all([
        loadInventory(),
        loadOrders(),
        loadEventBookings(),
        loadUsers(),
        loadStaff(),
        loadSettings(),
    ]);

    loadDashboardOverview();
});

// ============================================================
// LOGOUT
// ============================================================
function handleLogout() {
    fetch(`${API}/auth.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' })
    }).finally(() => {
        window.location.href = '../admin_login/index.html';
    });
}

// ============================================================
// TAB NAVIGATION
// ============================================================
function setupTabListeners() {
    document.querySelectorAll('.tab-trigger').forEach(trigger => {
        trigger.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelectorAll('.tab-trigger').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('show', 'active'));

            this.classList.add('active');
            const target = document.querySelector(this.getAttribute('data-bs-target'));
            if (target) target.classList.add('show', 'active');

            const id = this.getAttribute('data-bs-target');
            if      (id === '#dashboard')     loadDashboardOverview();
            else if (id === '#products')      applyProductCatalogFilters();
            else if (id === '#inventory')     displayInventory(allProducts);
            else if (id === '#orders')        displayOrders(applyOrderFilter(allOrders));
            else if (id === '#eventBookings') loadEventBookings();
            else if (id === '#users')         { displayUsers(allUsers); displayStaff(allStaff); }
            else if (id === '#settings')      renderSettingsTab();
        });
    });
}

// ============================================================
// FORM LISTENERS
// ============================================================
function setupFormListeners() {
    document.getElementById('inventoryForm')?.addEventListener('submit', e => { e.preventDefault(); saveInventoryForm(); });
    document.getElementById('orderForm')?.addEventListener('submit', e => { e.preventDefault(); saveOrderForm(); });
    document.getElementById('userForm')?.addEventListener('submit', e => { e.preventDefault(); saveUserForm(); });
    document.getElementById('staffForm')?.addEventListener('submit', e => { e.preventDefault(); saveStaffForm(); });
    document.getElementById('eventBookingForm')?.addEventListener('submit', e => { e.preventDefault(); saveEventBookingStatus(); });
}

// ============================================================
// DASHBOARD
// ============================================================
function loadDashboardOverview() {
    const lowStock = allProducts.filter(p =>
        p.stock_status === 'Low Stock' || p.stock_status === 'Out of Stock'
    );

    const totalRevenue = allOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

    setText('dashboardTotalProducts', allProducts.length);
    setText('dashboardLowStock', lowStock.length);
    setText('dashboardProductOrders', allOrders.length);
    setText('dashboardEventBookings', allEventBookings.length);
    setText('dashboardUsers', allUsers.length);
    setText('dashboardRevenue', '₱' + totalRevenue.toFixed(2));

    displayDashboardLowStock(lowStock.slice(0, 5));
    displayDashboardRecentProductOrders(allOrders.slice(0, 5));
    displayDashboardRecentBookings(allEventBookings.slice(0, 5));
}

function displayDashboardLowStock(items) {
    const el = document.getElementById('dashboardLowStockList');
    if (!el) return;
    if (!items.length) { el.innerHTML = '<p class="text-muted">No low stock items.</p>'; return; }
    el.innerHTML = items.map(item => `
        <div class="dashboard-list-item">
            <div>
                <strong>${esc(item.name)}</strong>
                <small>Stock: ${item.stock_count ?? 0} | Reorder at: ${item.reorder_level ?? 0}</small>
            </div>
            <span class="badge ${stockBadge(item.stock_status)}">${item.stock_status || 'Low Stock'}</span>
        </div>
    `).join('');
}

function displayDashboardRecentProductOrders(orders) {
    const el = document.getElementById('dashboardRecentProductOrders');
    if (!el) return;
    if (!orders.length) { el.innerHTML = '<p class="text-muted">No recent product orders yet.</p>'; return; }
    el.innerHTML = orders.map(o => `
        <div class="dashboard-list-item">
            <div>
                <strong>ORD-${pad(o.id)}</strong>
                <small>${esc(o.first_name)} ${esc(o.last_name)} — ${esc(o.products_ordered || 'N/A')}</small>
                <small>₱${parseFloat(o.total_amount || 0).toFixed(2)}</small>
            </div>
            <span class="badge ${statusBadge(o.status)}">${o.status || 'Pending'}</span>
        </div>
    `).join('');
}

function displayDashboardRecentBookings(bookings) {
    const el = document.getElementById('dashboardRecentBookings');
    if (!el) return;
    if (!bookings.length) { el.innerHTML = '<p class="text-muted">No recent event bookings.</p>'; return; }
    el.innerHTML = bookings.map(b => `
        <div class="dashboard-list-item">
            <div>
                <strong>BKG-${pad(b.booking_id)}</strong>
                <small>${esc(b.first_name)} ${esc(b.last_name)} — ${esc(b.event_location || 'N/A')}</small>
            </div>
            <span class="badge ${statusBadge(b.status)}">${b.status || 'Pending'}</span>
        </div>
    `).join('');
}

// ============================================================
// PRODUCTS CATALOG
// ============================================================
function filterProductCatalog(status) { currentProductFilter = status; applyProductCatalogFilters(); }
function searchProductCatalog(kw)     { currentProductSearch  = kw;     applyProductCatalogFilters(); }

function applyProductCatalogFilters() {
    let list = [...allProducts];
    if (currentProductFilter !== 'All')
        list = list.filter(p => p.stock_status === currentProductFilter);
    if (currentProductSearch.trim()) {
        const kw = currentProductSearch.toLowerCase();
        list = list.filter(p =>
            `${p.id} ${p.name} ${p.category} ${p.base_cost} ${p.stock_status}`.toLowerCase().includes(kw)
        );
    }
    displayProductCatalog(list);
}

function displayProductCatalog(products) {
    const tbody = document.querySelector('#productsCatalogTable tbody');
    if (!tbody) return;
    if (!products.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">No products found</td></tr>';
        return;
    }
    tbody.innerHTML = products.map(p => `
        <tr>
            <td class="px-4">PRD-${pad(p.id)}</td>
            <td class="px-4">${esc(p.name)}</td>
            <td class="px-4">${esc(p.category || 'General')}</td>
            <td class="px-4">₱${parseFloat(p.base_cost || 0).toFixed(2)}</td>
            <td class="px-4"><span class="badge ${stockBadge(p.stock_status)}">${p.stock_status || 'In Stock'}</span></td>
            <td class="px-4">${Number(p.is_active) === 1
                ? '<span class="badge bg-success">Active</span>'
                : '<span class="badge bg-secondary">Archived</span>'}</td>
            <td class="px-4">${Number(p.is_new) === 1
                ? '<span class="badge bg-info text-dark">New</span>'
                : '<span class="text-muted">—</span>'}</td>
        </tr>
    `).join('');
}

function exportProductCatalog() {
    let list = [...allProducts];
    if (currentProductFilter !== 'All') list = list.filter(p => p.stock_status === currentProductFilter);
    if (currentProductSearch.trim()) {
        const kw = currentProductSearch.toLowerCase();
        list = list.filter(p => `${p.id} ${p.name} ${p.category}`.toLowerCase().includes(kw));
    }
    if (!list.length) { showAlert('No products to export.', 'warning'); return; }

    const headers = ['Product ID','Product Name','Category','Base Price','Stock Count','Reorder Level','Stock Status','Active'];
    const rows    = list.map(p => [
        `PRD-${pad(p.id)}`, p.name||'', p.category||'', parseFloat(p.base_cost||0).toFixed(2),
        p.stock_count??0, p.reorder_level??0, p.stock_status||'', Number(p.is_active)===1?'Yes':'No'
    ]);
    downloadCSV('printokids_product_catalog.csv', headers, rows);
    showAlert('Product catalog exported.', 'success');
}

// ============================================================
// INVENTORY CRUD
// ============================================================
async function loadInventory() {
    try {
        const res  = await fetch(`${API}/inventory.php`);
        allProducts = await res.json();
        displayInventory(allProducts);
    } catch (e) {
        showAlert('Error loading inventory: ' + e.message, 'danger');
    }
}

function displayInventory(products) {
    const tbody = document.querySelector('#inventoryTable tbody');
    if (!tbody) return;
    if (!products.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4">No products found</td></tr>';
        return;
    }
    tbody.innerHTML = products.map(p => `
        <tr data-id="${p.id}">
            <td class="px-2 text-center">
                ${p.primary_image
                    ? `<img src="${esc(p.primary_image)}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;border:1px solid #ddd" onerror="this.style.display='none'">`
                    : '<span class="text-muted small">—</span>'}
            </td>
            <td class="px-4">${esc(p.name)}</td>
            <td class="px-4" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(p.description||'')}">${esc(p.description || '—')}</td>
            <td class="px-4">${p.stock_count ?? 0}</td>
            <td class="px-4">${p.reorder_level ?? 0}</td>
            <td class="px-4">
                <span class="badge ${stockBadge(p.stock_status)}">${p.stock_status || 'In Stock'}</span>
                ${Number(p.force_out_of_stock) ? '<span class="badge bg-secondary ms-1" style="font-size:0.65rem">Forced</span>' : ''}
            </td>
            <td class="px-4">${Number(p.is_active) === 1
                ? '<span class="badge bg-success">Active</span>'
                : '<span class="badge bg-secondary">Archived</span>'}</td>
            <td class="px-4 text-end">
                <a href="javascript:void(0)" class="text-dark text-decoration-none me-2" onclick="editProduct(${p.id})">[EDIT]</a>
                <a href="javascript:void(0)" class="text-danger text-decoration-none" onclick="archiveProduct(${p.id}, ${Number(p.is_active)})">${Number(p.is_active)===1?'[ARCHIVE]':'[RESTORE]'}</a>
            </td>
        </tr>
    `).join('');
}

function editProduct(id) {
    const p = allProducts.find(x => Number(x.id) === Number(id));
    if (!p) { showAlert('Product not found.', 'danger'); return; }
    openInventoryModal(p);
}

function archiveProduct(id, currentActive) {
    const action = currentActive === 1 ? 'archive' : 'restore';
    if (!confirm(`${action === 'archive' ? 'Archive' : 'Restore'} this product?`)) return;

    fetch(`${API}/inventory.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: Number(id), is_active: currentActive === 1 ? 0 : 1 })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            showAlert(`Product ${action}d successfully.`, 'success');
            loadInventory();
        } else {
            showAlert(data.error || 'Failed.', 'danger');
        }
    })
    .catch(() => showAlert('Request failed.', 'danger'));
}

async function openInventoryModal(product = null) {
    const modal = document.getElementById('inventoryModal');
    document.getElementById('inventoryModalTitle').textContent = product ? 'Edit Product' : 'Add Product';
    document.getElementById('inventoryProductId').value    = product?.id || '';
    document.getElementById('inventoryProductName').value  = product?.name || '';
    document.getElementById('inventoryBaseCost').value     = product?.base_cost || '';
    document.getElementById('inventoryCategory').value     = product?.category || 'General';
    document.getElementById('inventoryDescription').value  = product?.description || '';
    document.getElementById('inventoryStockCount').value   = product?.stock_count ?? 0;
    document.getElementById('inventoryReorderLevel').value = product?.reorder_level ?? 10;
    document.getElementById('inventoryIsActive').checked   = product ? Number(product.is_active) === 1 : true;
    document.getElementById('inventoryForceOOS').checked   = product ? Number(product.force_out_of_stock) === 1 : false;

    // Clear media grid for new products; load for existing
    const grid   = document.getElementById('adminMediaGrid');
    const status = document.getElementById('mediaUploadStatus');
    if (grid)   grid.innerHTML = '<span class="text-muted small">Loading media…</span>';
    if (status) status.textContent = '';

    modal.classList.add('show');

    if (product?.id) {
        try {
            const res  = await fetch(`${API}/product_images.php?product_id=${product.id}`);
            const imgs = await res.json();
            renderAdminMediaGrid(imgs, product.id);
        } catch {
            if (grid) grid.innerHTML = '<span class="text-muted small">Could not load media.</span>';
        }
    } else {
        if (grid) grid.innerHTML = '<span class="text-muted small">Save the product first to add media.</span>';
    }
}

function closeInventoryModal() {
    document.getElementById('inventoryModal').classList.remove('show');
}

function saveInventoryForm() {
    const id = document.getElementById('inventoryProductId').value;
    const payload = {
        name:               document.getElementById('inventoryProductName').value.trim(),
        base_cost:          parseFloat(document.getElementById('inventoryBaseCost').value),
        category:           document.getElementById('inventoryCategory').value.trim() || 'General',
        description:        document.getElementById('inventoryDescription').value.trim(),
        stock_count:        parseInt(document.getElementById('inventoryStockCount').value),
        reorder_level:      parseInt(document.getElementById('inventoryReorderLevel').value),
        is_active:          document.getElementById('inventoryIsActive').checked ? 1 : 0,
        force_out_of_stock: document.getElementById('inventoryForceOOS').checked ? 1 : 0,
    };

    if (!payload.name || isNaN(payload.base_cost) || isNaN(payload.stock_count) || isNaN(payload.reorder_level)) {
        showAlert('Please fill in all required fields.', 'danger');
        return;
    }

    const method = id ? 'PUT' : 'POST';
    if (id) payload.id = Number(id);

    fetch(`${API}/inventory.php`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(r => r.json())
    .then(async data => {
        if (data.success) {
            showAlert(id ? 'Product updated.' : 'Product added.', 'success');
            await loadInventory();
            applyProductCatalogFilters();
            if (!id && data.id) {
                // New product saved — re-open modal so admin can add media
                const newProduct = allProducts.find(p => Number(p.id) === Number(data.id));
                if (newProduct) {
                    openInventoryModal(newProduct);
                } else {
                    closeInventoryModal();
                }
            } else {
                closeInventoryModal();
            }
        } else {
            showAlert(data.error || 'Save failed.', 'danger');
        }
    })
    .catch(() => showAlert('Request failed.', 'danger'));
}

// ── Product Media ──────────────────────────────────────────

function renderAdminMediaGrid(images, productId) {
    const grid = document.getElementById('adminMediaGrid');
    if (!grid) return;
    if (!images.length) {
        grid.innerHTML = '<span class="text-muted small">No media yet. Upload below.</span>';
        return;
    }
    grid.innerHTML = images.map(img => {
        const thumb = img.media_type === 'video'
            ? `<video src="${esc(img.image_url)}" style="width:80px;height:80px;object-fit:cover;border-radius:6px;background:#000"></video>`
            : `<img src="${esc(img.image_url)}" alt="media" style="width:80px;height:80px;object-fit:cover;border-radius:6px;" onerror="this.src='../../client/images/Product_TEMP.png'">`;
        const primaryBorder = Number(img.is_primary) ? 'border:2.5px solid #f0a500;' : 'border:2px solid #ddd;';
        return `
            <div style="position:relative;${primaryBorder}border-radius:8px;overflow:hidden;background:#f5f5f5;" title="${img.media_type}">
                ${thumb}
                <div style="position:absolute;bottom:0;left:0;right:0;display:flex;gap:2px;background:rgba(0,0,0,0.55);padding:2px 3px;">
                    ${Number(img.is_primary)
                        ? `<span style="color:#f0a500;font-size:11px;flex:1;text-align:center">★ Primary</span>`
                        : `<button onclick="setPrimaryImage(${img.id},${productId})" title="Set as primary"
                               style="background:none;border:none;color:#fff;font-size:11px;cursor:pointer;flex:1">★</button>`}
                    <button onclick="deleteProductImage(${img.id},${productId})" title="Delete"
                        style="background:none;border:none;color:#ff6b6b;font-size:13px;cursor:pointer;padding:0 4px;">✕</button>
                </div>
            </div>
        `;
    }).join('');
}

async function uploadProductImage() {
    const productId = Number(document.getElementById('inventoryProductId').value);
    if (!productId) { showAlert('Save the product first, then upload media.', 'warning'); return; }

    const input    = document.getElementById('mediaUploadInput');
    const file     = input?.files?.[0];
    const statusEl = document.getElementById('mediaUploadStatus');
    if (!file) { showAlert('Select a file to upload.', 'warning'); return; }

    if (statusEl) statusEl.textContent = 'Uploading…';

    const formData = new FormData();
    formData.append('file', file);

    try {
        const upRes  = await fetch(`${API}/upload.php`, { method: 'POST', body: formData });
        const upData = await upRes.json();
        if (!upData.url) {
            if (statusEl) statusEl.textContent = upData.error || 'Upload failed.';
            return;
        }

        // Check how many images already exist
        const countRes  = await fetch(`${API}/product_images.php?product_id=${productId}`);
        const existing  = await countRes.json();
        const isPrimary = existing.length === 0 ? 1 : 0; // First image auto-primary

        const addRes  = await fetch(`${API}/product_images.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                product_id: productId,
                image_url:  upData.url,
                media_type: upData.media_type || 'image',
                is_primary: isPrimary,
                sort_order: existing.length,
            }),
        });
        const addData = await addRes.json();
        if (addData.success) {
            if (statusEl) statusEl.textContent = '';
            if (input) input.value = '';
            // Refresh grid
            const refreshRes = await fetch(`${API}/product_images.php?product_id=${productId}`);
            renderAdminMediaGrid(await refreshRes.json(), productId);
            // Refresh inventory thumbnail in table
            loadInventory().then(() => applyProductCatalogFilters());
        } else {
            if (statusEl) statusEl.textContent = addData.error || 'Could not attach image.';
        }
    } catch {
        if (statusEl) statusEl.textContent = 'Request failed.';
    }
}

async function deleteProductImage(imageId, productId) {
    if (!confirm('Delete this image?')) return;
    try {
        const res  = await fetch(`${API}/product_images.php`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: imageId }),
        });
        const data = await res.json();
        if (data.success) {
            const refreshRes = await fetch(`${API}/product_images.php?product_id=${productId}`);
            renderAdminMediaGrid(await refreshRes.json(), productId);
            loadInventory().then(() => applyProductCatalogFilters());
        } else {
            showAlert(data.error || 'Delete failed.', 'danger');
        }
    } catch {
        showAlert('Request failed.', 'danger');
    }
}

async function setPrimaryImage(imageId, productId) {
    try {
        const res  = await fetch(`${API}/product_images.php`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: imageId, is_primary: 1 }),
        });
        const data = await res.json();
        if (data.success) {
            const refreshRes = await fetch(`${API}/product_images.php?product_id=${productId}`);
            renderAdminMediaGrid(await refreshRes.json(), productId);
            loadInventory().then(() => applyProductCatalogFilters());
        } else {
            showAlert(data.error || 'Update failed.', 'danger');
        }
    } catch {
        showAlert('Request failed.', 'danger');
    }
}

// ============================================================
// PRODUCT ORDERS
// ============================================================
async function loadOrders() {
    try {
        const res = await fetch(`${API}/product_orders.php`);
        allOrders = await res.json();
        displayOrders(applyOrderFilter(allOrders));
    } catch (e) {
        showAlert('Error loading product orders: ' + e.message, 'danger');
    }
}

function applyOrderFilter(orders) {
    if (currentOrderFilter === 'All') return orders;
    return orders.filter(o => o.status === currentOrderFilter);
}

function filterOrders(status) {
    currentOrderFilter = status;
    displayOrders(applyOrderFilter(allOrders));
}

function displayOrders(orders) {
    const tbody = document.querySelector('#ordersTable tbody');
    if (!tbody) return;
    if (!orders.length) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4">No product orders found</td></tr>';
        return;
    }
    tbody.innerHTML = orders.map(o => `
        <tr>
            <td class="px-4">ORD-${pad(o.id)}</td>
            <td>${esc(o.first_name)} ${esc(o.last_name)}</td>
            <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(o.products_ordered||'')}">${esc(o.products_ordered || 'N/A')}</td>
            <td>${o.total_quantity || 0}</td>
            <td>₱${parseFloat(o.total_amount || 0).toFixed(2)}</td>
            <td>${o.employee_first_name ? esc(o.employee_first_name + ' ' + o.employee_last_name) : '<span class="text-muted">—</span>'}</td>
            <td>${o.tracking_number ? esc(o.tracking_number) : '<span class="text-muted">—</span>'}</td>
            <td><span class="badge ${statusBadge(o.status)}">${o.status || 'Pending'}</span></td>
            <td class="px-4 text-end">
                <a href="javascript:void(0)" class="text-dark text-decoration-none me-2" onclick="editOrder(${Number(o.id)})">[EDIT]</a>
                <a href="javascript:void(0)" class="text-danger text-decoration-none" onclick="deleteOrder(${Number(o.id)})">[DELETE]</a>
            </td>
        </tr>
    `).join('');
}

async function editOrder(id) {
    // Fetch full order detail (includes items with customization + media)
    try {
        const res   = await fetch(`${API}/product_orders.php?id=${id}`);
        const order = await res.json();
        if (order.error) { showAlert('Order not found.', 'danger'); return; }
        openOrderModal(order);
    } catch {
        showAlert('Failed to load order details.', 'danger');
    }
}

function openOrderModal(order) {
    // Populate staff dropdown
    const staffSel = document.getElementById('orderAssignedStaff');
    staffSel.innerHTML = '<option value="">— Unassigned —</option>';
    allStaff.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `${s.first_name} ${s.last_name} (${s.role_title || 'Staff'})`;
        if (Number(order.employee_id) === Number(s.id)) opt.selected = true;
        staffSel.appendChild(opt);
    });

    document.getElementById('orderId').value           = order.id;
    document.getElementById('orderClientName').value   = `${order.first_name || ''} ${order.last_name || ''}`.trim();
    document.getElementById('orderTotalAmount').value  = `₱${parseFloat(order.total_amount || 0).toFixed(2)}`;
    document.getElementById('orderProductsOrdered').value = order.products_ordered ||
        (order.items ? order.items.map(i => `${i.name} x${i.quantity}`).join(', ') : 'N/A');

    // Shipping address
    const addrRow = document.getElementById('shippingAddressRow');
    if (order.shipping_address) {
        const a = order.shipping_address;
        const parts = [a.street_address, a.city, a.province, a.postal_code].filter(Boolean);
        document.getElementById('orderShippingAddress').value =
            (a.address_label ? `[${a.address_label}] ` : '') + parts.join(', ');
        addrRow.style.display = '';
    } else {
        addrRow.style.display = 'none';
    }
    document.getElementById('orderStatus').value        = order.status || 'Pending';
    document.getElementById('orderTrackingNumber').value = order.tracking_number || '';

    // Payment fields
    document.getElementById('orderPaymentMethod').value = order.payment_method || '—';
    document.getElementById('orderShippingFee').value   = order.shipping_fee != null
        ? '₱' + parseFloat(order.shipping_fee).toFixed(2) : '—';

    const ps = order.payment_status || 'Unpaid';
    const psBadgeClass = ps === 'Verified' ? 'bg-success' : ps === 'Paid' ? 'bg-info text-dark' : 'bg-warning text-dark';
    document.getElementById('orderPaymentStatusBadge').innerHTML =
        `<span class="badge ${psBadgeClass}">${esc(ps)}</span>`;

    const proofRow = document.getElementById('proofOfPaymentRow');
    const markBtn  = document.getElementById('markPaidBtn');
    if (order.proof_of_payment_url) {
        document.getElementById('orderProofOfPayment').innerHTML =
            `<a href="${esc(order.proof_of_payment_url)}" target="_blank" class="d-block">
                <img src="${esc(order.proof_of_payment_url)}" alt="Proof of payment"
                     style="max-width:120px;border:1px solid #ddd;border-radius:4px">
                <span class="d-block small mt-1">View full image</span>
             </a>`;
        proofRow.style.display = '';
        if (markBtn) markBtn.style.display = ps === 'Verified' ? 'none' : '';
    } else {
        proofRow.style.display = 'none';
    }

    // Customization notes (aggregate from items)
    const notes = (order.items || []).filter(i => i.customization_notes).map(i => `${i.name}: ${i.customization_notes}`).join('\n');
    const notesRow = document.getElementById('customizationNotesRow');
    if (notes) {
        document.getElementById('orderCustomizationNotes').value = notes;
        notesRow.style.display = 'block';
    } else {
        notesRow.style.display = 'none';
    }

    // Media upload links
    const mediaLinks = (order.items || []).filter(i => i.media_upload_url);
    const mediaRow   = document.getElementById('mediaUploadRow');
    if (mediaLinks.length) {
        document.getElementById('orderMediaLink').innerHTML = mediaLinks.map(i =>
            `<a href="${esc(i.media_upload_url)}" target="_blank" class="d-block">${esc(i.name)}: View Upload</a>`
        ).join('');
        mediaRow.style.display = 'block';
    } else {
        mediaRow.style.display = 'none';
    }

    document.getElementById('orderModal').classList.add('show');
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('show');
}

function saveOrderForm() {
    const id = Number(document.getElementById('orderId').value);
    if (!id) return;

    const payload = {
        id,
        status:       document.getElementById('orderStatus').value,
        employee_id:  document.getElementById('orderAssignedStaff').value || null,
        tracking_number: document.getElementById('orderTrackingNumber').value.trim() || null,
    };

    fetch(`${API}/product_orders.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            closeOrderModal();
            showAlert('Order updated successfully.', 'success');
            loadOrders();
        } else {
            showAlert(data.error || 'Update failed.', 'danger');
        }
    })
    .catch(() => showAlert('Request failed.', 'danger'));
}

function deleteOrder(id) {
    if (!confirm('Delete this product order? This cannot be undone.')) return;
    fetch(`${API}/product_orders.php`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: Number(id) })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            showAlert('Order deleted.', 'success');
            loadOrders();
        } else {
            showAlert(data.error || 'Delete failed.', 'danger');
        }
    })
    .catch(() => showAlert('Request failed.', 'danger'));
}

function exportSalesHistory() {
    const list = applyOrderFilter(allOrders);
    if (!list.length) { showAlert('No orders to export.', 'warning'); return; }
    const headers = ['Order ID','Customer','Products','Qty','Total','Staff','Tracking','Status','Date'];
    const rows    = list.map(o => [
        `ORD-${pad(o.id)}`,
        `${o.first_name||''} ${o.last_name||''}`.trim(),
        o.products_ordered || '',
        o.total_quantity || 0,
        parseFloat(o.total_amount||0).toFixed(2),
        o.employee_first_name ? `${o.employee_first_name} ${o.employee_last_name}` : '',
        o.tracking_number || '',
        o.status || '',
        o.order_date || ''
    ]);
    downloadCSV('printokids_product_orders.csv', headers, rows);
    showAlert('Sales history exported.', 'success');
}

// ============================================================
// EVENT BOOKINGS
// ============================================================
async function loadEventBookings() {
    try {
        const res     = await fetch(`${API}/event_bookings.php`);
        allEventBookings = await res.json();
        displayEventBookingSummary(allEventBookings);
        applyEventBookingFilters();
    } catch (e) {
        showAlert('Error loading event bookings: ' + e.message, 'danger');
    }
}

function displayEventBookingSummary(bookings) {
    setText('bookingTotalCount',      bookings.length);
    setText('bookingPendingCount',    bookings.filter(b => b.status === 'Pending').length);
    setText('bookingConfirmedCount',  bookings.filter(b => b.status === 'Confirmed').length);
    setText('bookingProductionCount', bookings.filter(b => b.status === 'In Production').length);
    setText('bookingCompletedCount',  bookings.filter(b => b.status === 'Completed').length);
}

function filterEventBookings(status) { currentEventFilter = status; applyEventBookingFilters(); }
function searchEventBookings(kw)     { currentEventSearch  = kw;    applyEventBookingFilters(); }

function applyEventBookingFilters() {
    let list = [...allEventBookings];
    if (currentEventFilter !== 'All')
        list = list.filter(b => b.status === currentEventFilter);
    if (currentEventSearch.trim()) {
        const kw = currentEventSearch.toLowerCase();
        list = list.filter(b =>
            `${b.booking_id} ${b.first_name} ${b.last_name} ${b.event_location} ${b.service_name} ${b.asset_name} ${b.status}`
            .toLowerCase().includes(kw)
        );
    }
    displayEventBookings(list);
    displayEventBookingSummary(allEventBookings);
}

function displayEventBookings(bookings) {
    const tbody = document.querySelector('#eventBookingsTable tbody');
    if (!tbody) return;
    if (!bookings.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4">No event bookings found</td></tr>';
        return;
    }
    tbody.innerHTML = bookings.map(b => `
        <tr>
            <td class="px-4">BKG-${pad(b.booking_id)}</td>
            <td class="px-4">${esc(b.first_name)} ${esc(b.last_name)}</td>
            <td class="px-4">${esc(b.event_type || '—')}</td>
            <td class="px-4">${esc(b.event_location || 'N/A')}</td>
            <td class="px-4">${esc(b.service_name || 'N/A')}</td>
            <td class="px-4">${formatSchedule(b.start_time, b.end_time)}</td>
            <td class="px-4"><span class="badge ${statusBadge(b.status)}">${b.status || 'Pending'}</span></td>
            <td class="px-4 text-end">
                <a href="javascript:void(0)" class="text-dark text-decoration-none me-2" onclick="viewEventBooking(${Number(b.booking_id)})">[VIEW]</a>
                <a href="javascript:void(0)" class="text-danger text-decoration-none" onclick="deleteEventBooking(${Number(b.booking_id)})">[DELETE]</a>
            </td>
        </tr>
    `).join('');
}

function viewEventBooking(id) {
    const b = allEventBookings.find(x => Number(x.booking_id) === Number(id));
    if (!b) { showAlert('Booking not found.', 'danger'); return; }

    document.getElementById('eventBookingOrderId').value    = b.order_id;
    document.getElementById('eventBookingId').textContent   = `BKG-${pad(b.booking_id)}`;
    document.getElementById('eventBookingClientName').value = `${b.first_name || ''} ${b.last_name || ''}`.trim();
    document.getElementById('eventBookingName').value       = b.event_name || '—';
    document.getElementById('eventBookingDate').value       = b.event_date
        ? new Date(b.event_date).toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' })
        : 'N/A';
    document.getElementById('eventBookingType').value       = b.event_type || '—';
    document.getElementById('eventBookingLocation').value   = b.event_location || 'N/A';
    document.getElementById('eventBookingStatus').value     = b.status || 'Pending';
    document.getElementById('eventBookingAdminNotes').value = b.admin_notes || '';

    // Clickable contact links
    const emailEl = document.getElementById('eventBookingEmail');
    const phoneEl = document.getElementById('eventBookingPhone');
    emailEl.innerHTML = b.email
        ? `<a href="mailto:${esc(b.email)}">${esc(b.email)}</a>`
        : '<span class="text-muted">—</span>';
    phoneEl.innerHTML = b.phone
        ? `<a href="tel:${esc(b.phone)}">${esc(b.phone)}</a>`
        : '<span class="text-muted">—</span>';

    // Services row — only show if there are assigned services
    const svcRow = document.getElementById('eventBookingServicesRow');
    if (b.service_name || b.asset_name) {
        document.getElementById('eventBookingService').value = b.service_name || 'N/A';
        document.getElementById('eventBookingAsset').value   = b.asset_name   || 'N/A';
        svcRow.style.display = '';
    } else {
        svcRow.style.display = 'none';
    }

    // Cancellation reason — shown only when present
    const cancelRow = document.getElementById('eventBookingCancelReasonRow');
    const cancelEl  = document.getElementById('eventBookingCancelReason');
    if (b.cancellation_reason) {
        cancelEl.textContent    = b.cancellation_reason;
        cancelRow.style.display = '';
    } else {
        cancelRow.style.display = 'none';
    }

    document.getElementById('eventBookingModal').classList.add('show');
}

function closeEventBookingModal() {
    document.getElementById('eventBookingModal').classList.remove('show');
}

function saveEventBookingStatus() {
    const orderId    = Number(document.getElementById('eventBookingOrderId').value);
    const status     = document.getElementById('eventBookingStatus').value;
    const adminNotes = document.getElementById('eventBookingAdminNotes').value;
    if (!orderId || !status) { showAlert('Missing order ID or status.', 'danger'); return; }

    fetch(`${API}/event_bookings.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, status, admin_notes: adminNotes })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            closeEventBookingModal();
            showAlert('Booking saved.', 'success');
            loadEventBookings();
        } else {
            showAlert(data.error || 'Update failed.', 'danger');
        }
    })
    .catch(() => showAlert('Request failed.', 'danger'));
}

function deleteEventBooking(idArg) {
    // Called from table row (with id) or modal footer (without id — read from hidden input)
    const id = idArg !== undefined
        ? Number(idArg)
        : Number(document.getElementById('eventBookingOrderId').value);
    if (!id) return;
    if (!confirm(`Delete booking BKG-${pad(id)}? This cannot be undone.`)) return;

    fetch(`${API}/event_bookings.php`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: id })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            closeEventBookingModal();
            showAlert('Booking deleted.', 'success');
            loadEventBookings();
        } else {
            showAlert(data.error || 'Delete failed.', 'danger');
        }
    })
    .catch(() => showAlert('Request failed.', 'danger'));
}

function exportEventBookings() {
    let list = [...allEventBookings];
    if (currentEventFilter !== 'All') list = list.filter(b => b.status === currentEventFilter);
    if (!list.length) { showAlert('No bookings to export.', 'warning'); return; }
    const headers = ['Booking ID','Order ID','Client','Event Type','Location','Service','Asset','Schedule','Status','Admin Notes'];
    const rows    = list.map(b => [
        `BKG-${pad(b.booking_id)}`, `ORD-${pad(b.order_id)}`,
        `${b.first_name||''} ${b.last_name||''}`.trim(),
        b.event_type || '',
        b.event_location || '', b.service_name || '', b.asset_name || '',
        formatSchedule(b.start_time, b.end_time),
        b.status || '', b.admin_notes || ''
    ]);
    downloadCSV('printokids_event_bookings.csv', headers, rows);
    showAlert('Event bookings exported.', 'success');
}

// ============================================================
// USERS — CLIENTS + STAFF
// ============================================================
async function loadUsers() {
    try {
        const res = await fetch(`${API}/customers.php`);
        allUsers  = await res.json();
        displayUsers(allUsers);
    } catch (e) {
        showAlert('Error loading clients: ' + e.message, 'danger');
    }
}

async function loadStaff() {
    try {
        const res = await fetch(`${API}/staff.php`);
        allStaff  = await res.json();
        displayStaff(allStaff);
    } catch (e) {
        showAlert('Error loading staff: ' + e.message, 'danger');
    }
}

function switchUserSubTab(tab) {
    document.getElementById('clientsSubPanel').style.display = tab === 'clients' ? '' : 'none';
    document.getElementById('staffSubPanel').style.display   = tab === 'staff'   ? '' : 'none';
    document.getElementById('clientsSubTab').classList.toggle('active', tab === 'clients');
    document.getElementById('staffSubTab').classList.toggle('active', tab === 'staff');
}

function displayUsers(users) {
    const tbody = document.querySelector('#usersTable tbody');
    if (!tbody) return;
    if (!users.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4">No clients found</td></tr>';
        return;
    }
    tbody.innerHTML = users.map(u => {
        const active     = Number(u.is_active) !== 0;
        const statusBadge = active
            ? '<span class="badge bg-success">Active</span>'
            : '<span class="badge bg-danger">Disabled</span>';
        const joinedDate = u.created_at
            ? new Date(u.created_at).toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' })
            : '—';
        return `
        <tr>
            <td class="px-4">USR-${pad(u.id)}</td>
            <td class="px-4">${esc(u.first_name)} ${esc(u.last_name)}</td>
            <td class="px-4">${esc(u.email || 'N/A')}</td>
            <td class="px-4">${esc(u.phone || 'N/A')}</td>
            <td class="px-4">${statusBadge}</td>
            <td class="px-4 text-center">${u.order_count || 0}</td>
            <td class="px-4">${joinedDate}</td>
            <td class="px-4 text-end">
                <a href="javascript:void(0)" class="text-dark text-decoration-none me-2" onclick="editUser(${Number(u.id)})">[EDIT]</a>
                <a href="javascript:void(0)" class="${active ? 'text-warning' : 'text-success'} text-decoration-none me-2"
                   onclick="toggleUserActive(${Number(u.id)}, ${active ? 1 : 0})">[${active ? 'DISABLE' : 'ENABLE'}]</a>
                <a href="javascript:void(0)" class="text-danger text-decoration-none" onclick="deleteUser(${Number(u.id)})">[DELETE]</a>
            </td>
        </tr>`;
    }).join('');
}

function displayStaff(staff) {
    const tbody = document.querySelector('#staffTable tbody');
    if (!tbody) return;
    if (!staff.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4">No staff found</td></tr>';
        return;
    }
    tbody.innerHTML = staff.map(s => {
        const statusCls = s.status === 'Active' ? 'bg-success' : s.status === 'On Leave' ? 'bg-warning text-dark' : 'bg-secondary';
        return `
        <tr>
            <td class="px-4">STF-${pad(s.id)}</td>
            <td class="px-4">${esc(s.first_name)} ${esc(s.last_name)}</td>
            <td class="px-4">${esc(s.email || '—')}</td>
            <td class="px-4">${esc(s.role_title || '—')}</td>
            <td class="px-4">${esc(s.contact_number || 'N/A')}</td>
            <td class="px-4"><span class="badge ${statusCls}">${s.status}</span></td>
            <td class="px-4">${Number(s.is_admin) === 1 ? '<span class="badge bg-danger">Admin</span>' : '<span class="badge bg-secondary">Staff</span>'}</td>
            <td class="px-4 text-end">
                <a href="javascript:void(0)" class="text-dark text-decoration-none me-2" onclick="openStaffModal(${Number(s.id)})">[EDIT]</a>
                <a href="javascript:void(0)" class="text-danger text-decoration-none" onclick="deleteStaff(${Number(s.id)})">[DELETE]</a>
            </td>
        </tr>`;
    }).join('');
}

function editUser(id) {
    const u = allUsers.find(x => Number(x.id) === Number(id));
    if (!u) { showAlert('Client not found.', 'danger'); return; }
    openUserModal(u);
}

function openUserModal(user) {
    document.getElementById('userId').value           = user.id;
    document.getElementById('userFirstName').value    = user.first_name || '';
    document.getElementById('userLastName').value     = user.last_name  || '';
    document.getElementById('userEmail').value        = user.email      || '';
    document.getElementById('userPhone').value        = user.phone      || '';
    document.getElementById('userIsActive').checked   = Number(user.is_active) !== 0;
    document.getElementById('userNewPassword').value  = '';
    document.getElementById('userConfirmPassword').value = '';
    document.getElementById('userFormError').style.display = 'none';
    document.getElementById('userModal').classList.add('show');
}

function closeUserModal() {
    document.getElementById('userModal').classList.remove('show');
}

function saveUserForm() {
    const id = document.getElementById('userId').value;
    if (!id) return;

    const newPw  = document.getElementById('userNewPassword').value;
    const confPw = document.getElementById('userConfirmPassword').value;
    const errEl  = document.getElementById('userFormError');
    errEl.style.display = 'none';

    if (newPw || confPw) {
        if (newPw !== confPw) {
            errEl.textContent   = 'Passwords do not match.';
            errEl.style.display = 'block';
            return;
        }
        if (newPw.length < 8) {
            errEl.textContent   = 'New password must be at least 8 characters.';
            errEl.style.display = 'block';
            return;
        }
    }

    const payload = {
        id:         Number(id),
        first_name: document.getElementById('userFirstName').value.trim(),
        last_name:  document.getElementById('userLastName').value.trim(),
        email:      document.getElementById('userEmail').value.trim(),
        phone:      document.getElementById('userPhone').value.trim(),
        is_active:  document.getElementById('userIsActive').checked ? 1 : 0,
    };
    if (newPw) payload.new_password = newPw;

    if (!payload.first_name || !payload.last_name || !payload.email) {
        errEl.textContent   = 'First name, last name, and email are required.';
        errEl.style.display = 'block';
        return;
    }

    fetch(`${API}/customers.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            closeUserModal();
            showAlert('Client updated successfully.', 'success');
            loadUsers();
        } else {
            errEl.textContent   = data.error || 'Update failed.';
            errEl.style.display = 'block';
        }
    })
    .catch(() => { errEl.textContent = 'Request failed.'; errEl.style.display = 'block'; });
}

function toggleUserActive(id, currentState) {
    const newState = currentState === 1 ? 0 : 1;
    const action   = newState === 0 ? 'disable' : 'enable';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} this account?`)) return;
    fetch(`${API}/customers.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: Number(id), is_active: newState })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            showAlert(`Account ${action}d.`, 'success');
            loadUsers();
        } else {
            showAlert(data.error || 'Update failed.', 'danger');
        }
    })
    .catch(() => showAlert('Request failed.', 'danger'));
}

function deleteUser(id) {
    if (!confirm('Delete this client? This also removes their orders and addresses.')) return;
    fetch(`${API}/customers.php`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: Number(id) })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            showAlert('Client deleted.', 'success');
            loadUsers();
        } else {
            showAlert(data.error || 'Delete failed.', 'danger');
        }
    })
    .catch(() => showAlert('Request failed.', 'danger'));
}

// ── Staff modal ──────────────────────────────────────────
function openStaffModal(idOrNull) {
    const s = idOrNull !== null ? allStaff.find(x => Number(x.id) === Number(idOrNull)) : null;

    document.getElementById('staffId').value              = s ? s.id : '';
    document.getElementById('staffFirstName').value       = s ? s.first_name      || '' : '';
    document.getElementById('staffLastName').value        = s ? s.last_name       || '' : '';
    document.getElementById('staffEmail').value           = s ? s.email           || '' : '';
    document.getElementById('staffContact').value         = s ? s.contact_number  || '' : '';
    document.getElementById('staffStatus').value          = s ? s.status          || 'Active' : 'Active';
    document.getElementById('staffIsAdmin').checked       = s ? Number(s.is_admin) === 1 : false;
    document.getElementById('staffNewPassword').value     = '';
    document.getElementById('staffConfirmPassword').value = '';
    document.getElementById('staffFormError').style.display = 'none';

    const isNew = !s;
    document.getElementById('staffModalTitle').textContent = isNew ? 'New Staff Member' : 'Edit Staff Member';
    document.getElementById('staffPasswordLabel').innerHTML = isNew
        ? 'Set Password <span class="text-danger">*</span>'
        : 'Reset Password <span class="text-muted fw-normal">(leave blank to keep current)</span>';

    document.getElementById('staffModal').classList.add('show');
}

function closeStaffModal() {
    document.getElementById('staffModal').classList.remove('show');
}

function saveStaffForm() {
    const id     = document.getElementById('staffId').value;
    const isNew  = !id;
    const newPw  = document.getElementById('staffNewPassword').value;
    const confPw = document.getElementById('staffConfirmPassword').value;
    const errEl  = document.getElementById('staffFormError');
    errEl.style.display = 'none';

    if (isNew && !newPw) {
        errEl.textContent   = 'Password is required for new staff members.';
        errEl.style.display = 'block';
        return;
    }

    if (newPw || confPw) {
        if (newPw !== confPw) {
            errEl.textContent   = 'Passwords do not match.';
            errEl.style.display = 'block';
            return;
        }
        if (newPw.length < 8) {
            errEl.textContent   = 'Password must be at least 8 characters.';
            errEl.style.display = 'block';
            return;
        }
    }

    const payload = {
        first_name:     document.getElementById('staffFirstName').value.trim(),
        last_name:      document.getElementById('staffLastName').value.trim(),
        email:          document.getElementById('staffEmail').value.trim(),
        contact_number: document.getElementById('staffContact').value.trim(),
        status:         document.getElementById('staffStatus').value,
        is_admin:       document.getElementById('staffIsAdmin').checked ? 1 : 0,
    };
    if (!payload.first_name || !payload.last_name) {
        errEl.textContent   = 'First and last name are required.';
        errEl.style.display = 'block';
        return;
    }
    if (newPw) payload.new_password = newPw;
    if (isNew) payload.password = newPw;

    const method = isNew ? 'POST' : 'PUT';
    if (!isNew) payload.id = Number(id);

    fetch(`${API}/staff.php`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(r => r.json())
    .then(data => {
        if (data.success || data.id) {
            closeStaffModal();
            showAlert(isNew ? 'Staff member created.' : 'Staff member updated.', 'success');
            loadStaff();
        } else {
            errEl.textContent   = data.error || 'Save failed.';
            errEl.style.display = 'block';
        }
    })
    .catch(() => { errEl.textContent = 'Request failed.'; errEl.style.display = 'block'; });
}

function deleteStaff(id) {
    if (!confirm('Delete this staff member? This cannot be undone.')) return;
    fetch(`${API}/staff.php`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: Number(id) })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            showAlert('Staff member deleted.', 'success');
            loadStaff();
        } else {
            showAlert(data.error || 'Delete failed.', 'danger');
        }
    })
    .catch(() => showAlert('Request failed.', 'danger'));
}

// ============================================================
// SETTINGS
// ============================================================
async function loadSettings() {
    try {
        const res = await fetch(`${API}/settings.php`);
        allSettings = await res.json();
    } catch {
        allSettings = {};
    }
}

function renderSettingsTab() {
    const s = allSettings;
    const setToggle = (id, key) => {
        const el = document.getElementById(id);
        if (el) el.checked = s[key] !== '0';
    };
    setToggle('toggleCOD',  'payment_cod_enabled');
    setToggle('toggleQR',   'payment_qr_enabled');
    setToggle('toggleCard', 'payment_card_enabled');

    const setRate = (id, key) => {
        const el = document.getElementById(id);
        if (el) el.value = s[key] ?? '';
    };
    setRate('rateNCR',      'shipping_ncr');
    setRate('rateLuzon',    'shipping_luzon');
    setRate('rateVisayas',  'shipping_visayas');
    setRate('rateMindanao', 'shipping_mindanao');

    const qrPreview = document.getElementById('settingsQRPreview');
    const qrNone    = document.getElementById('settingsQRNone');
    const qrImg     = document.getElementById('settingsQRImage');
    if (s.qr_code_url) {
        if (qrImg)     qrImg.src           = s.qr_code_url;
        if (qrPreview) qrPreview.style.display = '';
        if (qrNone)    qrNone.style.display    = 'none';
    } else {
        if (qrPreview) qrPreview.style.display = 'none';
        if (qrNone)    qrNone.style.display    = '';
    }
}

async function savePaymentToggle(key, enabled) {
    try {
        const res  = await fetch(`${API}/settings.php`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [key]: enabled ? '1' : '0' }),
        });
        const data = await res.json();
        if (data.success) {
            allSettings[key] = enabled ? '1' : '0';
            showAlert('Payment setting saved.', 'success');
        } else {
            showAlert(data.error || 'Save failed.', 'danger');
            await loadSettings(); renderSettingsTab();
        }
    } catch {
        showAlert('Request failed.', 'danger');
        await loadSettings(); renderSettingsTab();
    }
}

async function saveShippingRates() {
    const rates = {
        shipping_ncr:      document.getElementById('rateNCR')?.value      || '0',
        shipping_luzon:    document.getElementById('rateLuzon')?.value    || '0',
        shipping_visayas:  document.getElementById('rateVisayas')?.value  || '0',
        shipping_mindanao: document.getElementById('rateMindanao')?.value || '0',
    };
    try {
        const res  = await fetch(`${API}/settings.php`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rates),
        });
        const data = await res.json();
        if (data.success) {
            Object.assign(allSettings, rates);
            showAlert('Shipping rates saved.', 'success');
        } else {
            showAlert(data.error || 'Save failed.', 'danger');
        }
    } catch {
        showAlert('Request failed.', 'danger');
    }
}

async function uploadAdminQRCode() {
    const input = document.getElementById('qrUploadInput');
    const file  = input?.files?.[0];
    if (!file) { showAlert('Please select an image file.', 'warning'); return; }

    const statusEl = document.getElementById('qrUploadStatus');
    if (statusEl) statusEl.innerHTML = '<span class="text-muted">Uploading…</span>';

    const formData = new FormData();
    formData.append('file', file);

    try {
        const upRes  = await fetch(`${API}/upload.php`, { method: 'POST', body: formData });
        const upData = await upRes.json();
        if (!upData.url) {
            if (statusEl) statusEl.innerHTML = `<span class="text-danger">${esc(upData.error || 'Upload failed.')}</span>`;
            return;
        }

        const saveRes  = await fetch(`${API}/settings.php`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ qr_code_url: upData.url }),
        });
        const saveData = await saveRes.json();
        if (saveData.success) {
            allSettings.qr_code_url = upData.url;
            if (statusEl) statusEl.innerHTML = '<span class="text-success">✔ QR code updated.</span>';
            renderSettingsTab();
            if (input) input.value = '';
        } else {
            if (statusEl) statusEl.innerHTML = `<span class="text-danger">${esc(saveData.error || 'Save failed.')}</span>`;
        }
    } catch {
        if (statusEl) statusEl.innerHTML = '<span class="text-danger">Request failed.</span>';
    }
}

async function markOrderPaid() {
    const id = Number(document.getElementById('orderId').value);
    if (!id) return;
    try {
        const res  = await fetch(`${API}/product_orders.php`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, payment_status: 'Verified' }),
        });
        const data = await res.json();
        if (data.success) {
            showAlert('Order marked as Verified.', 'success');
            closeOrderModal();
            loadOrders();
        } else {
            showAlert(data.error || 'Update failed.', 'danger');
        }
    } catch {
        showAlert('Request failed.', 'danger');
    }
}

// ============================================================
// UTILITIES
// ============================================================
function pad(n) { return String(n).padStart(3, '0'); }

function esc(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function stockBadge(status) {
    switch (status) {
        case 'In Stock':    return 'bg-success';
        case 'Low Stock':   return 'bg-warning text-dark';
        case 'Out of Stock':return 'bg-danger';
        default:            return 'bg-secondary';
    }
}

function statusBadge(status) {
    switch (status) {
        case 'Pending':       return 'bg-warning text-dark';
        case 'Confirmed':     return 'bg-info text-dark';
        case 'In Production': return 'bg-primary';
        case 'Completed':     return 'bg-success';
        case 'Cancelled':     return 'bg-danger';
        default:              return 'bg-secondary';
    }
}

function formatSchedule(start, end) {
    if (!start || !end) return 'N/A';
    const s = new Date(start);
    const e = new Date(end);
    const fmt = d => d.toLocaleDateString('en-PH') + ' ' + d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
    return `${fmt(s)} – ${new Date(end).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}`;
}

function downloadCSV(filename, headers, rows) {
    const csv = [
        headers.join(','),
        ...rows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
}

function showAlert(message, type = 'info') {
    const div = document.createElement('div');
    div.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    div.style.cssText = 'z-index:10000;min-width:300px;box-shadow:0 4px 12px rgba(0,0,0,0.15)';
    div.role = 'alert';
    div.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 4000);
}

function exportRawXML(type) {
    //point to existing data array n stuff
    const dataList = (type === 'inventory') ? allProducts : allOrders;
    
    if (!dataList || dataList.length === 0) {
        showAlert('No data available to export.', 'warning');
        return;
    }

    const rootTag = (type === 'inventory') ? 'InventoryData' : 'OrdersData';
    const entryTag = (type === 'inventory') ? 'Product' : 'Order';

    //building the xml string
    let xmlString = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xmlString += `<${rootTag}>\n`;

    dataList.forEach(entry => {
        xmlString += `  <${entryTag}>\n`;
        for (let key in entry) {
            let safeKey = key.replace(/[^a-zA-Z0-9_]/g, '');
            if (/^[0-9]/.test(safeKey)) safeKey = '_' + safeKey;
            
            let val = (entry[key] !== null && entry[key] !== undefined) ? String(entry[key]) : '';
            val = val.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            
            xmlString += `    <${safeKey}>${val}</${safeKey}>\n`;
        }
        xmlString += `  </${entryTag}>\n`;
    });

    xmlString += `</${rootTag}>`;

    //make sure user gets dl on broswer
    const blob = new Blob([xmlString], { type: 'text/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `printokids_${type}_export.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showAlert(`${type.toUpperCase()} XML exported successfully.`, 'success');
}