// ============================================
// ADMIN DASHBOARD - API INTEGRATION
// ============================================

const API_BASE = '../api';
let allProducts = [];
let allOrders = [];

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    loadInventory();
    loadOrders();
    setupTabListeners();
});

function setupTabListeners() {
    const tabTriggers = document.querySelectorAll('.tab-trigger');
    tabTriggers.forEach(trigger => {
        trigger.addEventListener('click', function() {
            const targetId = this.getAttribute('data-bs-target');
            if (targetId === '#inventory') {
                loadInventory();
            } else if (targetId === '#orders') {
                loadOrders();
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
        })
        .catch(error => {
            console.error('Error loading inventory:', error);
            showAlert('Error loading inventory: ' + error.message, 'danger');
        });
}

function displayInventory(products) {
    const tbody = document.querySelector('#inventoryTable tbody');
    tbody.innerHTML = ''; // Clear existing rows
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">No products found</td></tr>';
        return;
    }
    
    products.forEach(product => {
        const row = document.createElement('tr');
        row.dataset.productId = product.id;
        row.innerHTML = `
            <td class="px-4">${product.name}</td>
            <td class="px-4">${product.base_cost || 'N/A'}</td>
            <td class="px-4">${product.category || 'General'}</td>
            <td class="px-4"><span class="badge bg-success">In Stock</span></td>
            <td class="px-4 text-end">
                <a href="javascript:void(0)" class="text-dark text-decoration-none me-2" onclick="editProduct(${product.id})">[EDIT]</a>
                <a href="javascript:void(0)" class="text-dark text-decoration-none" onclick="deleteProduct(${product.id})">[DELETE]</a>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function editProduct(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const newName = prompt('Enter product name:', product.name);
    if (newName === null) return;
    
    const newCost = prompt('Enter base cost:', product.base_cost);
    if (newCost === null) return;
    
    const updateData = {
        id: productId,
        name: newName,
        base_cost: parseFloat(newCost)
    };
    
    fetch(`${API_BASE}/inventory.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('Product updated successfully!', 'success');
            loadInventory();
        } else {
            showAlert('Error updating product: ' + (data.error || 'Unknown error'), 'danger');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('Error updating product', 'danger');
    });
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
    const productName = prompt('Enter product name:');
    if (!productName) return;
    
    const baseCost = prompt('Enter base cost:');
    if (!baseCost) return;
    
    const category = prompt('Enter category (optional):', 'General');
    
    const newProduct = {
        name: productName,
        base_cost: parseFloat(baseCost),
        category: category || 'General'
    };
    
    fetch(`${API_BASE}/inventory.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('Product added successfully!', 'success');
            loadInventory();
        } else {
            showAlert('Error adding product: ' + (data.error || 'Unknown error'), 'danger');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('Error adding product', 'danger');
    });
}

function addStockDetails() {
    alert('Stock Details feature coming soon!');
}

function editInventoryRow(element) {
    const row = element.closest('tr');
    const productId = row.dataset.productId;
    editProduct(productId);
}

// ============================================
// ORDERS FUNCTIONS
// ============================================

function loadOrders() {
    fetch(`${API_BASE}/orders.php`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to load orders');
            return response.json();
        })
        .then(data => {
            allOrders = data;
            displayOrders(data);
        })
        .catch(error => {
            console.error('Error loading orders:', error);
            showAlert('Error loading orders: ' + error.message, 'danger');
        });
}

function displayOrders(orders) {
    const tbody = document.querySelector('#ordersTable tbody');
    tbody.innerHTML = ''; // Clear existing rows
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">No orders found</td></tr>';
        return;
    }
    
    orders.forEach(order => {
        const row = document.createElement('tr');
        row.className = 'order-row';
        row.dataset.orderId = order.id;
        row.dataset.status = order.status || 'Pending';
        row.innerHTML = `
            <td class="px-4 py-3">ORD-${String(order.id).padStart(3, '0')}</td>
            <td>${order.first_name} ${order.last_name}</td>
            <td>₱${order.event_location || 'N/A'}</td>
            <td>Staff Pending</td>
            <td><span class="badge ${getStatusBadgeClass(order.status)}">${order.status || 'Pending'}</span></td>
            <td class="px-4 text-end">
                <a href="javascript:void(0)" class="text-dark text-decoration-none me-2" onclick="editOrder(${order.id})">[EDIT]</a>
                <a href="javascript:void(0)" class="text-dark text-decoration-none" onclick="deleteOrder(${order.id})">[DELETE]</a>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function getStatusBadgeClass(status) {
    switch(status) {
        case 'Pending': return 'bg-warning text-dark';
        case 'Confirmed': return 'bg-info';
        case 'In Production': return 'bg-primary';
        case 'Completed': return 'bg-success';
        default: return 'bg-secondary';
    }
}

function editOrder(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    const newStatus = prompt('Enter new status (Pending/Confirmed/In Production/Completed):', order.status);
    if (newStatus === null) return;
    
    const updateData = {
        id: orderId,
        status: newStatus
    };
    
    fetch(`${API_BASE}/orders.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('Order updated successfully!', 'success');
            loadOrders();
        } else {
            showAlert('Error updating order: ' + (data.error || 'Unknown error'), 'danger');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('Error updating order', 'danger');
    });
}

function deleteOrder(orderId) {
    if (!confirm('Are you sure you want to delete this order?')) return;
    
    fetch(`${API_BASE}/orders.php`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('Order deleted successfully!', 'success');
            loadOrders();
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
    const customerId = prompt('Enter customer ID:');
    if (!customerId) return;
    
    const eventLocation = prompt('Enter event location:');
    if (!eventLocation) return;
    
    const newOrder = {
        customer_id: parseInt(customerId),
        event_location: eventLocation,
        status: 'Pending'
    };
    
    fetch(`${API_BASE}/orders.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('Order added successfully!', 'success');
            loadOrders();
        } else {
            showAlert('Error adding order: ' + (data.error || 'Unknown error'), 'danger');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('Error adding order', 'danger');
    });
}

function addOrderDetails() {
    alert('Order Details feature coming soon!');
}

function editOrderRow(element) {
    const row = element.closest('tr');
    const orderId = row.dataset.orderId;
    editOrder(orderId);
}

function filterOrders(status) {
    const rows = document.querySelectorAll('#ordersTable tbody tr.order-row');
    
    rows.forEach(row => {
        if (status === 'All' || row.dataset.status === status) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
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
