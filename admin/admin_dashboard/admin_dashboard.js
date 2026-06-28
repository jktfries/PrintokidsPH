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
    // Session guard — redirect to login if not an admin
    try {
        const res  = await fetch(`${API}/auth.php?action=check`);
        const data = await res.json();
        if (!data.logged_in || data.user_type !== 'admin') {
            window.location.href = '../admin_login/index.html';
            return;
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
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">No products found</td></tr>';
        return;
    }
    tbody.innerHTML = products.map(p => `
        <tr data-id="${p.id}">
            <td class="px-4">${esc(p.name)}</td>
            <td class="px-4" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(p.description||'')}">${esc(p.description || '—')}</td>
            <td class="px-4">${p.stock_count ?? 0}</td>
            <td class="px-4">${p.reorder_level ?? 0}</td>
            <td class="px-4"><span class="badge ${stockBadge(p.stock_status)}">${p.stock_status || 'In Stock'}</span></td>
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

function openInventoryModal(product = null) {
    const modal = document.getElementById('inventoryModal');
    document.getElementById('inventoryModalTitle').textContent = product ? 'Edit Product' : 'Add Product';
    document.getElementById('inventoryProductId').value    = product?.id || '';
    document.getElementById('inventoryProductName').value  = product?.name || '';
    document.getElementById('inventoryBaseCost').value     = product?.base_cost || '';
    document.getElementById('inventoryCategory').value     = product?.category || 'General';
    document.getElementById('inventoryDescription').value  = product?.description || '';
    document.getElementById('inventoryStockCount').value   = product?.stock_count ?? 0;
    document.getElementById('inventoryReorderLevel').value = product?.reorder_level ?? 10;
    document.getElementById('inventoryIsActive').value     = product ? String(product.is_active ?? 1) : '1';
    modal.classList.add('show');
}

function closeInventoryModal() {
    document.getElementById('inventoryModal').classList.remove('show');
}

function saveInventoryForm() {
    const id = document.getElementById('inventoryProductId').value;
    const payload = {
        name:          document.getElementById('inventoryProductName').value.trim(),
        base_cost:     parseFloat(document.getElementById('inventoryBaseCost').value),
        category:      document.getElementById('inventoryCategory').value.trim() || 'General',
        description:   document.getElementById('inventoryDescription').value.trim(),
        stock_count:   parseInt(document.getElementById('inventoryStockCount').value),
        reorder_level: parseInt(document.getElementById('inventoryReorderLevel').value),
        is_active:     parseInt(document.getElementById('inventoryIsActive').value),
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
    .then(data => {
        if (data.success) {
            closeInventoryModal();
            showAlert(id ? 'Product updated.' : 'Product added.', 'success');
            loadInventory().then(() => applyProductCatalogFilters());
        } else {
            showAlert(data.error || 'Save failed.', 'danger');
        }
    })
    .catch(() => showAlert('Request failed.', 'danger'));
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
        tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4">No event bookings found</td></tr>';
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
            <td class="px-4">₱${parseFloat(b.price_charged || 0).toFixed(2)}</td>
            <td class="px-4"><span class="badge ${statusBadge(b.status)}">${b.status || 'Pending'}</span></td>
            <td class="px-4 text-end">
                <a href="javascript:void(0)" class="text-dark text-decoration-none" onclick="viewEventBooking(${Number(b.booking_id)})">[VIEW]</a>
            </td>
        </tr>
    `).join('');
}

function viewEventBooking(id) {
    const b = allEventBookings.find(x => Number(x.booking_id) === Number(id));
    if (!b) { showAlert('Booking not found.', 'danger'); return; }

    document.getElementById('eventBookingOrderId').value    = b.order_id;
    document.getElementById('eventBookingId').value         = `BKG-${pad(b.booking_id)}`;
    document.getElementById('eventBookingClientName').value = `${b.first_name || ''} ${b.last_name || ''}`.trim();
    document.getElementById('eventBookingName').value       = b.event_name || '—';
    document.getElementById('eventBookingDate').value       = b.event_date
        ? new Date(b.event_date).toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' })
        : 'N/A';
    document.getElementById('eventBookingType').value       = b.event_type || '—';
    document.getElementById('eventBookingLocation').value   = b.event_location || 'N/A';
    document.getElementById('eventBookingService').value    = b.service_name || 'N/A';
    document.getElementById('eventBookingAsset').value      = b.asset_name || 'N/A';
    document.getElementById('eventBookingSchedule').value   = formatSchedule(b.start_time, b.end_time);
    document.getElementById('eventBookingPrice').value      = `₱${parseFloat(b.price_charged || 0).toFixed(2)}`;
    document.getElementById('eventBookingStatus').value     = b.status || 'Pending';

    document.getElementById('eventBookingModal').classList.add('show');
}

function closeEventBookingModal() {
    document.getElementById('eventBookingModal').classList.remove('show');
}

function saveEventBookingStatus() {
    const orderId = Number(document.getElementById('eventBookingOrderId').value);
    const status  = document.getElementById('eventBookingStatus').value;
    if (!orderId || !status) { showAlert('Missing order ID or status.', 'danger'); return; }

    fetch(`${API}/event_bookings.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, status })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            closeEventBookingModal();
            showAlert('Booking status updated.', 'success');
            loadEventBookings();
        } else {
            showAlert(data.error || 'Update failed.', 'danger');
        }
    })
    .catch(() => showAlert('Request failed.', 'danger'));
}

function exportEventBookings() {
    let list = [...allEventBookings];
    if (currentEventFilter !== 'All') list = list.filter(b => b.status === currentEventFilter);
    if (!list.length) { showAlert('No bookings to export.', 'warning'); return; }
    const headers = ['Booking ID','Order ID','Client','Event Type','Location','Service','Asset','Schedule','Price','Status'];
    const rows    = list.map(b => [
        `BKG-${pad(b.booking_id)}`, `ORD-${pad(b.order_id)}`,
        `${b.first_name||''} ${b.last_name||''}`.trim(),
        b.event_type || '',
        b.event_location || '', b.service_name || '', b.asset_name || '',
        formatSchedule(b.start_time, b.end_time),
        parseFloat(b.price_charged||0).toFixed(2), b.status || ''
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
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">No clients found</td></tr>';
        return;
    }
    tbody.innerHTML = users.map(u => `
        <tr>
            <td class="px-4">USR-${pad(u.id)}</td>
            <td class="px-4">${esc(u.first_name)} ${esc(u.last_name)}</td>
            <td class="px-4">${esc(u.email || 'N/A')}</td>
            <td class="px-4">${esc(u.phone || 'N/A')}</td>
            <td class="px-4 text-end">
                <a href="javascript:void(0)" class="text-dark text-decoration-none me-2" onclick="editUser(${Number(u.id)})">[EDIT]</a>
                <a href="javascript:void(0)" class="text-danger text-decoration-none" onclick="deleteUser(${Number(u.id)})">[DELETE]</a>
            </td>
        </tr>
    `).join('');
}

function displayStaff(staff) {
    const tbody = document.querySelector('#staffTable tbody');
    if (!tbody) return;
    if (!staff.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">No staff found</td></tr>';
        return;
    }
    tbody.innerHTML = staff.map(s => `
        <tr>
            <td class="px-4">STF-${pad(s.id)}</td>
            <td class="px-4">${esc(s.first_name)} ${esc(s.last_name)}</td>
            <td class="px-4">${esc(s.role_title || '—')}</td>
            <td class="px-4">${esc(s.contact_number || 'N/A')}</td>
            <td class="px-4"><span class="badge ${s.status === 'Active' ? 'bg-success' : s.status === 'On Leave' ? 'bg-warning text-dark' : 'bg-secondary'}">${s.status}</span></td>
            <td class="px-4">${Number(s.is_admin) === 1 ? '<span class="badge bg-danger">Admin</span>' : '—'}</td>
        </tr>
    `).join('');
}

function editUser(id) {
    const u = allUsers.find(x => Number(x.id) === Number(id));
    if (!u) { showAlert('Client not found.', 'danger'); return; }
    openUserModal(u);
}

function openUserModal(user) {
    document.getElementById('userId').value        = user.id;
    document.getElementById('userFirstName').value = user.first_name || '';
    document.getElementById('userLastName').value  = user.last_name  || '';
    document.getElementById('userEmail').value     = user.email      || '';
    document.getElementById('userPhone').value     = user.phone      || '';
    document.getElementById('userModal').classList.add('show');
}

function closeUserModal() {
    document.getElementById('userModal').classList.remove('show');
}

function saveUserForm() {
    const id = document.getElementById('userId').value;
    if (!id) return;

    const payload = {
        id:         Number(id),
        first_name: document.getElementById('userFirstName').value.trim(),
        last_name:  document.getElementById('userLastName').value.trim(),
        email:      document.getElementById('userEmail').value.trim(),
        phone:      document.getElementById('userPhone').value.trim(),
    };

    if (!payload.first_name || !payload.last_name || !payload.email) {
        showAlert('First name, last name, and email are required.', 'danger');
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
