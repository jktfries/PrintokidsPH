// ============================================
// ADMIN DASHBOARD - API INTEGRATION
// ============================================

const API_BASE = '../../api';
let allProducts = [];
let currentProductCatalogFilter = 'All';
let currentProductCatalogSearch = '';
let allOrders = [];
let allUsers = [];
let allEventBookings = [];
let currentEventBookingFilter = 'All';
let currentEventBookingSearch = '';
let currentOrderFilter = 'All';
let allCustomers = [];

// ===============================
// DASHBOARD FUNCTIONS
// ===============================
function loadDashboardOverview() {
    const totalProducts = allProducts.length;

    const lowStockItems = allProducts.filter(product => {
        return (product.stock_status || '') === 'Low Stock' || Number(product.stock_count) <= Number(product.reorder_level);
    });

    const totalProductOrders = allOrders.length;
    const totalEventBookings = allEventBookings.length;
    const totalUsers = allUsers.length;

    const totalProductsEl = document.getElementById('dashboardTotalProducts');
    const lowStockEl = document.getElementById('dashboardLowStock');
    const productOrdersEl = document.getElementById('dashboardProductOrders');
    const eventBookingsEl = document.getElementById('dashboardEventBookings');
    const usersEl = document.getElementById('dashboardUsers');

    if (totalProductsEl) totalProductsEl.textContent = totalProducts;
    if (lowStockEl) lowStockEl.textContent = lowStockItems.length;
    if (productOrdersEl) productOrdersEl.textContent = totalProductOrders;
    if (eventBookingsEl) eventBookingsEl.textContent = totalEventBookings;
    if (usersEl) usersEl.textContent = totalUsers;

    displayDashboardLowStock(lowStockItems);
    displayDashboardRecentProductOrders(allOrders.slice(0, 5));
    displayDashboardRecentBookings(allEventBookings.slice(0, 5));
}

function displayDashboardLowStock(items) {
    const container = document.getElementById('dashboardLowStockList');
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = '<p class="text-muted">No low stock items.</p>';
        return;
    }

    container.innerHTML = items.slice(0, 5).map(item => `
        <div class="dashboard-list-item">
            <div>
                <strong>${item.name || 'Unnamed Product'}</strong>
                <small>Stock: ${item.stock_count || 0} | Reorder Level: ${item.reorder_level || 0}</small>
            </div>
            <span class="badge ${getStockBadgeClass(item.stock_status)}">${item.stock_status || 'Low Stock'}</span>
        </div>
    `).join('');
}

function displayDashboardRecentProductOrders(orders) {
    const container = document.getElementById('dashboardRecentProductOrders');
    if (!container) return;

    if (!orders || orders.length === 0) {
        container.innerHTML = '<p class="text-muted">No recent product orders yet.</p>';
        return;
    }

    container.innerHTML = orders.map(order => `
        <div class="dashboard-list-item">
            <div>
                <strong>ORD-${String(order.id).padStart(3, '0')}</strong>
                <small>
                    ${order.first_name || ''} ${order.last_name || ''} - 
                    ${order.products_ordered || 'No product details'}
                </small>
                <small>
                    Total: ₱${parseFloat(order.total_amount || 0).toFixed(2)}
                </small>
            </div>
            <span class="badge ${getStatusBadgeClass(order.status)}">
                ${order.status || 'Pending'}
            </span>
        </div>
    `).join('');
}

function displayDashboardRecentBookings(bookings) {
    const container = document.getElementById('dashboardRecentBookings');
    if (!container) return;

    if (!bookings || bookings.length === 0) {
        container.innerHTML = '<p class="text-muted">No recent event bookings.</p>';
        return;
    }

    container.innerHTML = bookings.map(booking => `
        <div class="dashboard-list-item">
            <div>
                <strong>BKG-${String(booking.booking_id).padStart(3, '0')}</strong>
                <small>${booking.first_name || ''} ${booking.last_name || ''} - ${booking.event_location || 'N/A'}</small>
            </div>
            <span class="badge ${getStatusBadgeClass(booking.status)}">${booking.status || 'Pending'}</span>
        </div>
    `).join('');
}

// ============================================
// PRODUCTS CATALOG FUNCTIONS
// ============================================

function loadProductCatalog() {
    if (!allProducts || allProducts.length === 0) {
        fetch(`${API_BASE}/inventory.php`)
            .then(response => {
                if (!response.ok) throw new Error('Failed to load products');
                return response.json();
            })
            .then(products => {
                allProducts = products;
                applyProductCatalogFilters();
            })
            .catch(error => {
                console.error('Error loading product catalog:', error);
                showAlert('Error loading product catalog: ' + error.message, 'danger');
            });
    } else {
        applyProductCatalogFilters();
    }
}

function applyProductCatalogFilters() {
    let filteredProducts = [...allProducts];

    if (currentProductCatalogFilter !== 'All') {
        filteredProducts = filteredProducts.filter(product => {
            return (product.stock_status || 'In Stock') === currentProductCatalogFilter;
        });
    }

    if (currentProductCatalogSearch.trim() !== '') {
        const keyword = currentProductCatalogSearch.toLowerCase();

        filteredProducts = filteredProducts.filter(product => {
            const searchableText = `
                ${product.id || ''}
                ${product.name || ''}
                ${product.category || ''}
                ${product.base_cost || ''}
                ${product.stock_status || ''}
            `.toLowerCase();

            return searchableText.includes(keyword);
        });
    }

    displayProductCatalog(filteredProducts);
}

function filterProductCatalog(status) {
    currentProductCatalogFilter = status;
    applyProductCatalogFilters();
}

function searchProductCatalog(keyword) {
    currentProductCatalogSearch = keyword;
    applyProductCatalogFilters();
}

function displayProductCatalog(products) {
    const tbody = document.querySelector('#productsCatalogTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!products || products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">No products found</td></tr>';
        return;
    }

    products.forEach(product => {
        const row = document.createElement('tr');

        const isNew = Number(product.is_new) === 1;

        row.innerHTML = `
            <td class="px-4">PRD-${String(product.id).padStart(3, '0')}</td>
            <td class="px-4">${product.name || 'Unnamed Product'}</td>
            <td class="px-4">${product.category || 'General'}</td>
            <td class="px-4">₱${parseFloat(product.base_cost || 0).toFixed(2)}</td>
            <td class="px-4">
                <span class="badge ${getStockBadgeClass(product.stock_status)}">
                    ${product.stock_status || 'In Stock'}
                </span>
            </td>
            <td class="px-4">
                ${isNew ? '<span class="badge bg-success">NEW PRODUCT</span>' : '<span class="text-muted">—</span>'}
            </td>
        `;

        tbody.appendChild(row);
    });
}

function exportProductCatalog() {
    let exportProducts = [...allProducts];

    if (currentProductCatalogFilter !== 'All') {
        exportProducts = exportProducts.filter(product => {
            return (product.stock_status || 'In Stock') === currentProductCatalogFilter;
        });
    }

    if (currentProductCatalogSearch.trim() !== '') {
        const keyword = currentProductCatalogSearch.toLowerCase();

        exportProducts = exportProducts.filter(product => {
            const searchableText = `
                ${product.id || ''}
                ${product.name || ''}
                ${product.category || ''}
                ${product.base_cost || ''}
                ${product.stock_status || ''}
            `.toLowerCase();

            return searchableText.includes(keyword);
        });
    }

    if (!exportProducts || exportProducts.length === 0) {
        showAlert('No products available to export.', 'warning');
        return;
    }

    const headers = [
        'Product ID',
        'Product Name',
        'Category',
        'Base Price',
        'Stock Status',
        'New Product'
    ];

    const rows = exportProducts.map(product => [
        `PRD-${String(product.id).padStart(3, '0')}`,
        product.name || '',
        product.category || '',
        parseFloat(product.base_cost || 0).toFixed(2),
        product.stock_status || 'In Stock',
        Number(product.is_new) === 1 ? 'Yes' : 'No'
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row =>
            row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')
        )
    ].join('\n');

    const blob = new Blob([csvContent], {
        type: 'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const filterName = currentProductCatalogFilter === 'All'
        ? 'all'
        : currentProductCatalogFilter.toLowerCase().replace(/\s+/g, '_');

    link.href = url;
    link.download = `printokids_product_catalog_${filterName}.csv`;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showAlert('Product catalog exported successfully!', 'success');
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    loadInventory();
    loadOrders();
    loadUsers();
    loadEventBookings();
    loadCustomersForOrderModal();
    setupTabListeners();

    setTimeout(() => {
        loadDashboardOverview();
    }, 800);

    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('submit', function (e) {
            e.preventDefault();
            saveOrderForm();
        });
    }

    const inventoryForm = document.getElementById('inventoryForm');
    if (inventoryForm) {
        inventoryForm.addEventListener('submit', function (e) {
            e.preventDefault();
            saveInventoryForm();
        });
    }

    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', function (e) {
            e.preventDefault();
            saveUserForm();
        });
    }

    const eventBookingForm = document.getElementById('eventBookingForm');
    if (eventBookingForm) {
        eventBookingForm.addEventListener('submit', function (e) {
            e.preventDefault();
            saveEventBookingStatus();
        });
    }
});

function setupTabListeners() {
    const tabTriggers = document.querySelectorAll('.tab-trigger');

    tabTriggers.forEach(trigger => {
        trigger.addEventListener('click', function (e) {
            e.preventDefault();

            document.querySelectorAll('.tab-trigger').forEach(btn => {
                btn.classList.remove('active');
            });

            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('show', 'active');
            });

            this.classList.add('active');

            const targetId = this.getAttribute('data-bs-target');
            const targetPane = document.querySelector(targetId);

            if (targetPane) {
                targetPane.classList.add('show', 'active');
            }

            if (targetId === '#dashboard') {
                loadDashboardOverview();
            } else if (targetId === '#products') {
                loadProductCatalog();
            } else if (targetId === '#inventory') {
                loadInventory();
            } else if (targetId === '#orders') {
                loadOrders();
            } else if (targetId === '#eventBookings') {
                loadEventBookings();
            } else if (targetId === '#users') {
                loadUsers();
            }
        });
    });
}

// ============================================
// INVENTORY FUNCTIONS
// ============================================

function loadInventory() {
    fetch(`${API_BASE}/inventory.php`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to load inventory');
            return response.json();
        })
        .then(data => {
            allProducts = data;
            displayInventory(data);
            applyProductCatalogFilters();
        })
        .catch(error => {
            console.error('Error loading inventory:', error);
            showAlert('Error loading inventory: ' + error.message, 'danger');
        });
}

function displayInventory(products) {
    const tbody = document.querySelector('#inventoryTable tbody');
    tbody.innerHTML = '';

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">No products found</td></tr>';
        return;
    }

    products.forEach(product => {
        const row = document.createElement('tr');
        row.dataset.productId = product.id;

        row.innerHTML = `
            <td class="px-4">${product.name}</td>
            <td class="px-4">${product.stock_count ?? 0}</td>
            <td class="px-4">${product.reorder_level ?? 0}</td>
            <td class="px-4">
                <span class="badge ${getStockBadgeClass(product.stock_status)}">
                    ${product.stock_status || 'In Stock'}
                </span>
            </td>
            <td class="px-4 text-end">
                <a href="javascript:void(0)" class="text-dark text-decoration-none me-2" onclick="editProduct(${product.id})">[EDIT]</a>
                <a href="javascript:void(0)" class="text-dark text-decoration-none" onclick="deleteProduct(${product.id})">[DELETE]</a>
            </td>
        `;

        tbody.appendChild(row);
    });
}

function getStockBadgeClass(status) {
    switch (status) {
        case 'In Stock':
            return 'bg-success';
        case 'Low Stock':
            return 'bg-warning text-dark';
        case 'Out of Stock':
            return 'bg-danger';
        default:
            return 'bg-secondary';
    }
}

function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    fetch(`${API_BASE}/inventory.php`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showAlert('Product deleted successfully!', 'success');
                loadInventory();
            } else {
                showAlert('Error deleting product: ' + (data.error || 'Unknown error'), 'danger');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('Error deleting product', 'danger');
        });
}

function addStock() {
    openInventoryModal();
}

function addStockDetails() {
    openInventoryModal();
}

function editProduct(productId) {
    const product = allProducts.find(p => Number(p.id) === Number(productId));

    if (!product) {
        showAlert('Product not found.', 'danger');
        return;
    }

    openInventoryModal(product);
}

function openInventoryModal(product = null) {
    const modal = document.getElementById('inventoryModal');
    const title = document.getElementById('inventoryModalTitle');

    const productIdInput = document.getElementById('inventoryProductId');
    const productNameInput = document.getElementById('inventoryProductName');
    const baseCostInput = document.getElementById('inventoryBaseCost');
    const categoryInput = document.getElementById('inventoryCategory');
    const stockCountInput = document.getElementById('inventoryStockCount');
    const reorderLevelInput = document.getElementById('inventoryReorderLevel');

    if (product) {
        title.textContent = 'Edit Stock Details';

        productIdInput.value = product.id;
        productNameInput.value = product.name || '';
        baseCostInput.value = product.base_cost || '';
        categoryInput.value = product.category || 'General';
        stockCountInput.value = product.stock_count ?? 0;
        reorderLevelInput.value = product.reorder_level ?? 10;
    } else {
        title.textContent = 'Add Product';

        productIdInput.value = '';
        productNameInput.value = '';
        baseCostInput.value = '';
        categoryInput.value = 'General';
        stockCountInput.value = 0;
        reorderLevelInput.value = 10;
    }

    modal.classList.add('show');
}

function closeInventoryModal() {
    const modal = document.getElementById('inventoryModal');
    modal.classList.remove('show');
}

// ============================================
// ORDERS FUNCTIONS
// ============================================

function loadOrders() {
    fetch(`${API_BASE}/product_orders.php`)
        .then(response => response.json())
        .then(orders => {
            allOrders = orders;

            if (currentOrderFilter && currentOrderFilter !== 'All') {
                filterOrders(currentOrderFilter);
            } else {
                displayOrders(allOrders);
            }
        })
        .catch(error => {
            console.error('Error loading product orders:', error);
            showAlert('Error loading product orders', 'danger');
        });
}

function displayOrders(orders) {
    const tbody = document.querySelector('#ordersTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!orders || orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">No product orders found</td></tr>';
        return;
    }

    orders.forEach(order => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td class="px-4 py-3">ORD-${String(order.id).padStart(3, '0')}</td>
            <td>${order.first_name || ''} ${order.last_name || ''}</td>
            <td>${order.products_ordered || 'N/A'}</td>
            <td>${order.total_quantity || 0}</td>
            <td>₱${parseFloat(order.total_amount || 0).toFixed(2)}</td>
            <td>
                <span class="badge ${getStatusBadgeClass(order.status)}">
                    ${order.status || 'Pending'}
                </span>
            </td>
            <td class="px-4 text-end">
                <a href="javascript:void(0)" class="text-dark text-decoration-none me-2" onclick="editOrder(${Number(order.id)})">[EDIT]</a>
                <a href="javascript:void(0)" class="text-dark text-decoration-none" onclick="deleteOrder(${Number(order.id)})">[DELETE]</a>
            </td>
        `;

        tbody.appendChild(row);
    });
}

function editOrder(orderId) {
    const order = allOrders.find(o => Number(o.id) === Number(orderId));

    if (!order) {
        showAlert('Product order not found.', 'danger');
        return;
    }

    openOrderModal(order);
}

function openOrderModal(order = null) {
    if (!order) {
        showAlert('Product orders should be created from client checkout.', 'warning');
        return;
    }

    document.getElementById('orderId').value = order.id;
    document.getElementById('orderClientName').value = `${order.first_name || ''} ${order.last_name || ''}`.trim();
    document.getElementById('orderProductsOrdered').value = order.products_ordered || 'N/A';
    document.getElementById('orderTotalAmount').value = `₱${parseFloat(order.total_amount || 0).toFixed(2)}`;
    document.getElementById('orderStatus').value = order.status || 'Pending';

    document.getElementById('orderModal').classList.add('show');
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('show');
}

function saveOrderForm() {
    const orderId = Number(document.getElementById('orderId').value);
    const status = document.getElementById('orderStatus').value;

    if (!orderId || !status) {
        showAlert('Order ID and status are required.', 'danger');
        return;
    }

    fetch(`${API_BASE}/product_orders.php`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: orderId,
            status: status
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                closeOrderModal();
                showAlert('Product order status updated successfully!', 'success');
                loadOrders();

                setTimeout(() => {
                    loadDashboardOverview();
                }, 500);
            } else {
                showAlert(data.error || 'Failed to update product order.', 'danger');
            }
        })
        .catch(error => {
            console.error('Product order update error:', error);
            showAlert('Failed to update product order.', 'danger');
        });
}

function deleteOrder(orderId) {
    if (!confirm('Are you sure you want to delete this product order?')) return;

    fetch(`${API_BASE}/product_orders.php`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: Number(orderId) })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showAlert('Product order deleted successfully!', 'success');
                loadOrders();
            } else {
                showAlert(data.error || 'Failed to delete product order.', 'danger');
            }
        })
        .catch(error => {
            console.error('Product order delete error:', error);
            showAlert('Failed to delete product order.', 'danger');
        });
}

function addOrder() {
    showAlert('Product orders are created from the client cart checkout.', 'info');
}

function filterOrders(status) {
    currentOrderFilter = status;

    let filteredOrders = allOrders;

    if (status !== 'All') {
        filteredOrders = allOrders.filter(order => {
            return (order.status || 'Pending') === status;
        });
    }

    displayOrders(filteredOrders);
}

function loadUsers() {
    fetch(`${API_BASE}/customers.php`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to load users');
            return response.json();
        })
        .then(users => {
            allUsers = users;
            displayUsers(users);
        })
        .catch(error => {
            console.error('Error loading users:', error);
            showAlert('Error loading users: ' + error.message, 'danger');
        });
}

function displayUsers(users) {
    const tbody = document.querySelector('#usersTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">No users found</td></tr>';
        return;
    }

    users.forEach(user => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td class="px-4">USR-${String(user.id).padStart(3, '0')}</td>
            <td class="px-4">${user.first_name || ''} ${user.last_name || ''}</td>
            <td class="px-4">${user.email || 'N/A'}</td>
            <td class="px-4">${user.phone || 'N/A'}</td>
            <td class="px-4 text-end">
                <a href="javascript:void(0)" class="text-dark text-decoration-none me-2" onclick="editUser(${Number(user.id)})">[EDIT]</a>
                <a href="javascript:void(0)" class="text-dark text-decoration-none" onclick="deleteUser(${Number(user.id)})">[DELETE]</a>
            </td>
        `;

        tbody.appendChild(row);
    });
}

function openUserModal(user = null) {
    if (!user) {
        showAlert('Users are created through client registration.', 'info');
        return;
    }

    const modal = document.getElementById('userModal');
    const title = document.getElementById('userModalTitle');

    document.getElementById('userId').value = user.id;
    document.getElementById('userFirstName').value = user.first_name || '';
    document.getElementById('userLastName').value = user.last_name || '';
    document.getElementById('userEmail').value = user.email || '';
    document.getElementById('userPhone').value = user.phone || '';

    title.textContent = 'Edit User';

    modal.classList.add('show');
}

function closeUserModal() {
    document.getElementById('userModal').classList.remove('show');
}

function editUser(userId) {
    const user = allUsers.find(u => Number(u.id) === Number(userId));

    if (!user) {
        showAlert('User not found.', 'danger');
        return;
    }

    openUserModal(user);
}

function saveUserForm() {
    const userId = document.getElementById('userId').value;

    if (!userId) {
        showAlert('Users are created through client registration.', 'info');
        return;
    }

    const userData = {
        id: Number(userId),
        first_name: document.getElementById('userFirstName').value.trim(),
        last_name: document.getElementById('userLastName').value.trim(),
        email: document.getElementById('userEmail').value.trim(),
        phone: document.getElementById('userPhone').value.trim()
    };

    if (!userData.first_name || !userData.last_name || !userData.email) {
        showAlert('Please complete first name, last name, and email.', 'danger');
        return;
    }

    fetch(`${API_BASE}/customers.php`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                closeUserModal();
                showAlert('User updated successfully!', 'success');
                loadUsers();
                loadCustomersForOrderModal();
            } else {
                showAlert(data.error || 'Something went wrong.', 'danger');
            }
        })
        .catch(error => {
            console.error('User save error:', error);
            showAlert('Failed to update user.', 'danger');
        });
}

function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    fetch(`${API_BASE}/customers.php`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: Number(userId) })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showAlert('User deleted successfully!', 'success');
                loadUsers();
                loadCustomersForOrderModal();
            } else {
                showAlert(data.error || 'Cannot delete user. This user may already have existing orders.', 'danger');
            }
        })
        .catch(error => {
            console.error('User delete error:', error);
            showAlert('Failed to delete user.', 'danger');
        });
}

function loadEventBookings() {
    fetch(`${API_BASE}/event_bookings.php`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to load event bookings');
            return response.json();
        })
        .then(bookings => {
            allEventBookings = bookings;

            displayEventBookingSummary(allEventBookings);
            applyEventBookingFilters();
        })
        .catch(error => {
            console.error('Error loading event bookings:', error);
            showAlert('Error loading event bookings: ' + error.message, 'danger');
        });
}

function displayEventBookingSummary(bookings) {
    const total = bookings.length;
    const pending = bookings.filter(b => (b.status || 'Pending') === 'Pending').length;
    const confirmed = bookings.filter(b => (b.status || 'Pending') === 'Confirmed').length;
    const production = bookings.filter(b => (b.status || 'Pending') === 'In Production').length;
    const completed = bookings.filter(b => (b.status || 'Pending') === 'Completed').length;

    const totalEl = document.getElementById('bookingTotalCount');
    const pendingEl = document.getElementById('bookingPendingCount');
    const confirmedEl = document.getElementById('bookingConfirmedCount');
    const productionEl = document.getElementById('bookingProductionCount');
    const completedEl = document.getElementById('bookingCompletedCount');

    if (totalEl) totalEl.textContent = total;
    if (pendingEl) pendingEl.textContent = pending;
    if (confirmedEl) confirmedEl.textContent = confirmed;
    if (productionEl) productionEl.textContent = production;
    if (completedEl) completedEl.textContent = completed;
}

function applyEventBookingFilters() {
    let filteredBookings = [...allEventBookings];

    if (currentEventBookingFilter !== 'All') {
        filteredBookings = filteredBookings.filter(booking => {
            return (booking.status || 'Pending') === currentEventBookingFilter;
        });
    }

    if (currentEventBookingSearch.trim() !== '') {
        const keyword = currentEventBookingSearch.toLowerCase();

        filteredBookings = filteredBookings.filter(booking => {
            const searchableText = `
                ${booking.booking_id || ''}
                ${booking.first_name || ''}
                ${booking.last_name || ''}
                ${booking.event_location || ''}
                ${booking.service_name || ''}
                ${booking.asset_name || ''}
                ${booking.status || ''}
            `.toLowerCase();

            return searchableText.includes(keyword);
        });
    }

    displayEventBookings(filteredBookings);
}

function filterEventBookings(status) {
    currentEventBookingFilter = status;
    applyEventBookingFilters();
}

function searchEventBookings(keyword) {
    currentEventBookingSearch = keyword;
    applyEventBookingFilters();
}

function displayEventBookings(bookings) {
    const tbody = document.querySelector('#eventBookingsTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!bookings || bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4">No event bookings found</td></tr>';
        return;
    }

    bookings.forEach(booking => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td class="px-4">BKG-${String(booking.booking_id).padStart(3, '0')}</td>
            <td class="px-4">${booking.first_name || ''} ${booking.last_name || ''}</td>
            <td class="px-4">${booking.event_location || 'N/A'}</td>
            <td class="px-4">${booking.service_name || 'N/A'}</td>
            <td class="px-4">${booking.asset_name || 'N/A'}</td>
            <td class="px-4">${formatBookingSchedule(booking.start_time, booking.end_time)}</td>
            <td class="px-4">₱${parseFloat(booking.price_charged || 0).toFixed(2)}</td>
            <td class="px-4">
                <span class="badge ${getStatusBadgeClass(booking.status)}">
                    ${booking.status || 'Pending'}
                </span>
            </td>
            <td class="px-4 text-end">
                <a href="javascript:void(0)" class="text-dark text-decoration-none" onclick="viewEventBookingDetails(${Number(booking.booking_id)})">[VIEW]</a>
            </td>
        `;

        tbody.appendChild(row);
    });
}

function viewEventBookingDetails(bookingId) {
    const booking = allEventBookings.find(b => Number(b.booking_id) === Number(bookingId));

    if (!booking) {
        showAlert('Booking not found.', 'danger');
        return;
    }

    document.getElementById('eventBookingOrderId').value = booking.order_id;
    document.getElementById('eventBookingId').value = `BKG-${String(booking.booking_id).padStart(3, '0')}`;
    document.getElementById('eventBookingClientName').value = `${booking.first_name || ''} ${booking.last_name || ''}`;
    document.getElementById('eventBookingLocation').value = booking.event_location || 'N/A';
    document.getElementById('eventBookingService').value = booking.service_name || 'N/A';
    document.getElementById('eventBookingAsset').value = booking.asset_name || 'N/A';
    document.getElementById('eventBookingSchedule').value = formatBookingSchedule(booking.start_time, booking.end_time);
    document.getElementById('eventBookingPrice').value = `₱${parseFloat(booking.price_charged || 0).toFixed(2)}`;
    document.getElementById('eventBookingStatus').value = booking.status || 'Pending';

    document.getElementById('eventBookingModal').classList.add('show');
}

function closeEventBookingModal() {
    document.getElementById('eventBookingModal').classList.remove('show');
}

function saveEventBookingStatus() {
    const orderId = Number(document.getElementById('eventBookingOrderId').value);
    const status = document.getElementById('eventBookingStatus').value;

    if (!orderId || !status) {
        showAlert('Order ID and status are required.', 'danger');
        return;
    }

    fetch(`${API_BASE}/event_bookings.php`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            order_id: orderId,
            status: status
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            closeEventBookingModal();
            showAlert('Event booking status updated successfully!', 'success');

            loadEventBookings();

            setTimeout(() => {
                loadDashboardOverview();
            }, 500);
        } else {
            showAlert(data.error || 'Failed to update booking status.', 'danger');
        }
    })
    .catch(error => {
        console.error('Booking status update error:', error);
        showAlert('Failed to update booking status.', 'danger');
    });
}

function exportEventBookings() {
    let exportBookings = [...allEventBookings];

    if (currentEventBookingFilter !== 'All') {
        exportBookings = exportBookings.filter(booking => {
            return (booking.status || 'Pending') === currentEventBookingFilter;
        });
    }

    if (currentEventBookingSearch.trim() !== '') {
        const keyword = currentEventBookingSearch.toLowerCase();

        exportBookings = exportBookings.filter(booking => {
            const searchableText = `
                ${booking.booking_id || ''}
                ${booking.first_name || ''}
                ${booking.last_name || ''}
                ${booking.event_location || ''}
                ${booking.service_name || ''}
                ${booking.asset_name || ''}
                ${booking.status || ''}
            `.toLowerCase();

            return searchableText.includes(keyword);
        });
    }

    if (!exportBookings || exportBookings.length === 0) {
        showAlert('No event bookings available to export.', 'warning');
        return;
    }

    const headers = [
        'Booking ID',
        'Order ID',
        'Client Name',
        'Event Location',
        'Service',
        'Asset',
        'Schedule',
        'Price',
        'Status'
    ];

    const rows = exportBookings.map(booking => [
        `BKG-${String(booking.booking_id).padStart(3, '0')}`,
        `ORD-${String(booking.order_id).padStart(3, '0')}`,
        `${booking.first_name || ''} ${booking.last_name || ''}`.trim(),
        booking.event_location || '',
        booking.service_name || '',
        booking.asset_name || '',
        formatBookingSchedule(booking.start_time, booking.end_time),
        parseFloat(booking.price_charged || 0).toFixed(2),
        booking.status || 'Pending'
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row =>
            row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')
        )
    ].join('\n');

    const blob = new Blob([csvContent], {
        type: 'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const filterName = currentEventBookingFilter === 'All'
        ? 'all'
        : currentEventBookingFilter.toLowerCase().replace(/\s+/g, '_');

    link.href = url;
    link.download = `printokids_event_bookings_${filterName}.csv`;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showAlert('Event bookings exported successfully!', 'success');
}

function formatBookingSchedule(startTime, endTime) {
    if (!startTime || !endTime) return 'N/A';

    const start = new Date(startTime);
    const end = new Date(endTime);

    return `${start.toLocaleDateString()} ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function loadCustomersForOrderModal() {
    fetch(`${API_BASE}/customers.php`)
        .then(response => response.json())
        .then(customers => {
            allCustomers = customers;

            const customerSelect = document.getElementById('orderCustomerId');
            if (!customerSelect) return;

            customerSelect.innerHTML = '<option value="">Select client</option>';

            customers.forEach(customer => {
                const option = document.createElement('option');
                option.value = customer.id;
                option.textContent = `${customer.id} - ${customer.first_name} ${customer.last_name}`;
                customerSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading customers:', error);
            showAlert('Failed to load customers for order form.', 'danger');
        });
}

function displayOrders(orders) {
    const tbody = document.querySelector('#ordersTable tbody');
    tbody.innerHTML = '';

    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">No product orders found</td></tr>';
        return;
    }

    orders.forEach(order => {
        const row = document.createElement('tr');
        row.className = 'order-row';
        row.dataset.orderId = order.id;
        row.dataset.status = order.status || 'Pending';

        const assignedEmployeeStatus = getAssignedEmployeeStatus(order.status);

        row.innerHTML = `
            <td class="px-4 py-3">ORD-${String(order.id).padStart(3, '0')}</td>
            <td>${order.first_name || ''} ${order.last_name || ''}</td>
            <td>${order.event_location || 'N/A'}</td>
            <td>${assignedEmployeeStatus}</td>
            <td>
                <span class="badge ${getStatusBadgeClass(order.status)}">
                    ${order.status || 'Pending'}
                </span>
            </td>
            <td class="px-4 text-end">
                <a href="javascript:void(0)" class="text-dark text-decoration-none me-2" onclick="editOrder(${Number(order.id)})">[EDIT]</a>
                <a href="javascript:void(0)" class="text-dark text-decoration-none" onclick="deleteOrder(${Number(order.id)})">[DELETE]</a>
            </td>
        `;

        tbody.appendChild(row);
    });
}

function getAssignedEmployeeStatus(status) {
    switch (status) {
        case 'Confirmed':
            return 'Staff Assigned';
        case 'Completed':
            return 'Staff Completed';

        case 'In Production':
            return 'Staff In Progress';

        case 'Pending':
        default:
            return 'Staff Pending';
    }
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'Pending': return 'bg-warning text-dark';
        case 'Confirmed': return 'bg-info';
        case 'In Production': return 'bg-primary';
        case 'Completed': return 'bg-success';
        default: return 'bg-secondary';
    }
}

function editOrder(orderId) {
    const order = allOrders.find(o => Number(o.id) === Number(orderId));

    if (!order) {
        showAlert('Order not found.', 'danger');
        return;
    }

    openOrderModal(order);
}

function deleteOrder(orderId) {
    if (!confirm('Are you sure you want to delete this order?')) return;

    fetch(`${API_BASE}/orders.php`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: Number(orderId) })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showAlert('Order deleted successfully!', 'success');
                loadOrders();
                loadEventBookings();
            } else {
                showAlert('Error deleting order: ' + (data.error || 'Unknown error'), 'danger');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('Error deleting order', 'danger');
        });
}

function addOrder() {
    openOrderModal();
}

function addOrderDetails() {
    openOrderModal();
}

function editOrderRow(element) {
    const row = element.closest('tr');
    const orderId = row.dataset.orderId;
    editOrder(Number(orderId));
}

function filterOrders(status) {
    currentOrderFilter = status;

    let filteredOrders = allOrders;

    if (status !== 'All') {
        filteredOrders = allOrders.filter(order => {
            return (order.status || 'Pending') === status;
        });
    }

    displayOrders(filteredOrders);
}

function openOrderModal(order = null) {
    const modal = document.getElementById('orderModal');
    const title = document.getElementById('orderModalTitle');

    const orderIdInput = document.getElementById('orderId');
    const customerIdInput = document.getElementById('orderCustomerId');
    const eventLocationInput = document.getElementById('orderEventLocation');
    const statusInput = document.getElementById('orderStatus');

    loadCustomersForOrderModal();

    if (order) {
        title.textContent = 'Edit Order Details';

        orderIdInput.value = order.id;
        eventLocationInput.value = order.event_location || '';
        statusInput.value = order.status || 'Pending';

        setTimeout(() => {
            customerIdInput.value = order.customer_id || '';
        }, 200);
    } else {
        title.textContent = 'Add Order';

        orderIdInput.value = '';
        customerIdInput.value = '';
        eventLocationInput.value = '';
        statusInput.value = 'Pending';
    }

    modal.classList.add('show');
}

function closeOrderModal() {
    const modal = document.getElementById('orderModal');
    modal.classList.remove('show');
}

function saveOrderForm() {
    const orderId = document.getElementById('orderId').value;

    const orderData = {
        customer_id: Number(document.getElementById('orderCustomerId').value),
        event_location: document.getElementById('orderEventLocation').value.trim(),
        status: document.getElementById('orderStatus').value
    };

    if (!orderData.customer_id || !orderData.event_location) {
        showAlert('Please complete the customer ID and event location.', 'danger');
        return;
    }

    let method = 'POST';

    if (orderId) {
        method = 'PUT';
        orderData.id = Number(orderId);
    }

    fetch(`${API_BASE}/orders.php`, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                closeOrderModal();

                if (method === 'POST') {
                    showAlert('Order added successfully!', 'success');
                } else {
                    showAlert('Order updated successfully!', 'success');
                }

                loadOrders();
                loadEventBookings();
            } else {
                showAlert(data.error || 'Something went wrong.', 'danger');
            }
        })
        .catch(error => {
            console.error('Order save error:', error);
            showAlert('Failed to save order.', 'danger');
        });
}

// ============================================
// UTILITIES
// ============================================

function showAlert(message, type = 'info') {
    // Create a simple alert div - you can style this better
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    // Insert at top of main content
    const main = document.querySelector('main');
    main.insertBefore(alertDiv, main.firstChild);

    // Auto-dismiss after 5 seconds
    setTimeout(() => alertDiv.remove(), 5000);
}

function saveInventoryForm() {
    const productId = document.getElementById('inventoryProductId').value;

    const productData = {
        name: document.getElementById('inventoryProductName').value.trim(),
        base_cost: parseFloat(document.getElementById('inventoryBaseCost').value),
        category: document.getElementById('inventoryCategory').value.trim(),
        stock_count: parseInt(document.getElementById('inventoryStockCount').value),
        reorder_level: parseInt(document.getElementById('inventoryReorderLevel').value)
    };

    if (!productData.name || isNaN(productData.base_cost)) {
        showAlert('Please complete the product name and base cost.', 'danger');
        return;
    }

    if (isNaN(productData.stock_count) || isNaN(productData.reorder_level)) {
        showAlert('Please enter valid stock count and reorder level.', 'danger');
        return;
    }

    let method = 'POST';

    if (productId) {
        method = 'PUT';
        productData.id = Number(productId);
    }

    fetch(`${API_BASE}/inventory.php`, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                closeInventoryModal();

                if (method === 'POST') {
                    showAlert('Stock item added successfully!', 'success');
                } else {
                    showAlert('Stock details updated successfully!', 'success');
                }

                loadInventory();

                setTimeout(() => {
                    loadDashboardOverview();
                    loadProductCatalog();
                }, 500);
            } else {
                showAlert(data.error || 'Something went wrong.', 'danger');
            }
        })
        .catch(error => {
            console.error('Inventory save error:', error);
            showAlert('Failed to save stock details.', 'danger');
        });
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

function exportSalesHistory() {
    let exportOrders = allOrders;

    if (currentOrderFilter && currentOrderFilter !== 'All') {
        exportOrders = allOrders.filter(order => {
            return (order.status || 'Pending') === currentOrderFilter;
        });
    }

    if (!exportOrders || exportOrders.length === 0) {
        showAlert('No product orders available to export.', 'warning');
        return;
    }

    const headers = [
        'Order ID',
        'Customer ID',
        'Client Name',
        'Products Ordered',
        'Quantity',
        'Total Amount',
        'Status',
        'Order Date'
    ];

    const rows = exportOrders.map(order => [
        `ORD-${String(order.id).padStart(3, '0')}`,
        order.customer_id || '',
        `${order.first_name || ''} ${order.last_name || ''}`.trim(),
        order.products_ordered || '',
        order.total_quantity || 0,
        parseFloat(order.total_amount || 0).toFixed(2),
        order.status || 'Pending',
        order.order_date || ''
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row =>
            row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')
        )
    ].join('\n');

    const blob = new Blob([csvContent], {
        type: 'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const filterName = currentOrderFilter === 'All'
        ? 'all'
        : currentOrderFilter.toLowerCase().replace(/\s+/g, '_');

    link.href = url;
    link.download = `printokids_product_orders_${filterName}.csv`;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showAlert('Product orders exported successfully!', 'success');
}
