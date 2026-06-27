// Authentication Handler
// Manages sign-up, sign-in, session state, and the navbar account control.
// NOTE: Auth state is persisted client-side in localStorage under
// 'printokids_user'. Other modules (cart.js, my_account.js, booking)
// read window.authManager.currentUser — do not rename that property.

class AuthManager {
    constructor() {
        this.apiUrl = '../api/auth.php';
        this.accountPage = 'my_account.html';
        this.storageKey = 'printokids_user';
        this.currentUser = this.loadUserFromStorage();
        this.init();
    }

    init() {
        const signUpBtn = document.querySelector('#signUpModal .btn-success');
        const signInBtn = document.querySelector('#signInModal .btn-primary');

        if (signUpBtn) signUpBtn.addEventListener('click', () => this.handleSignUp());
        if (signInBtn) signInBtn.addEventListener('click', () => this.handleSignIn());

        this.updateUI();
    }

    // ---- Public helpers for other pages ------------------------------------

    /** Returns the logged-in customer object, or null. */
    getCurrentUser() {
        return this.currentUser;
    }

    /** True if a customer is signed in. */
    isLoggedIn() {
        return !!this.currentUser;
    }

    /**
     * Guard for protected pages (My Account, checkout, booking).
     * If not logged in, opens the sign-in modal (when present) or redirects
     * to the homepage, and returns false. Returns the user object otherwise.
     */
    requireAuth(redirectTo = 'index.html') {
        if (this.currentUser) return this.currentUser;

        const signInEl = document.getElementById('signInModal');
        if (signInEl && window.bootstrap) {
            this.showAlert('Please sign in to continue', 'warning');
            bootstrap.Modal.getOrCreateInstance(signInEl).show();
        } else {
            window.location.href = redirectTo;
        }
        return false;
    }

    // ---- Sign up -----------------------------------------------------------

    async handleSignUp() {
        const fullName = document.getElementById('fullName')?.value.trim();
        const email = document.getElementById('signUpEmail')?.value.trim();
        const password = document.getElementById('signUpPassword')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;
        const termsCheck = document.getElementById('termsCheck')?.checked;

        if (!fullName || !email || !password || !confirmPassword) {
            this.showAlert('All fields are required', 'error');
            return;
        }
        if (!termsCheck) {
            this.showAlert('You must agree to the Terms of Service', 'error');
            return;
        }
        if (password !== confirmPassword) {
            this.showAlert('Passwords do not match', 'error');
            return;
        }
        if (password.length < 6) {
            this.showAlert('Password must be at least 6 characters', 'error');
            return;
        }

        const nameParts = fullName.split(/\s+/);
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || 'User';

        try {
            const response = await fetch(`${this.apiUrl}?action=register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    email: email,
                    phone: '',
                    password: password,
                    password_confirm: confirmPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showAlert('Account created! Welcome to PrintoKids PH', 'success');
                this.setSession(data.customer);
                this.closeModal('signUpModal');
                this.clearForm('signUpModal');
            } else {
                this.showAlert(data.error || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Sign up error:', error);
            this.showAlert('An error occurred during registration', 'error');
        }
    }

    // ---- Sign in -----------------------------------------------------------

    async handleSignIn() {
        const email = document.getElementById('signInEmail')?.value.trim();
        const password = document.getElementById('signInPassword')?.value;

        if (!email || !password) {
            this.showAlert('Email and password are required', 'error');
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}?action=login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, password: password })
            });

            const data = await response.json();

            if (response.ok) {
                this.showAlert(`Welcome back, ${data.customer.first_name}!`, 'success');
                this.setSession(data.customer);
                this.closeModal('signInModal');
                this.clearForm('signInModal');
            } else {
                this.showAlert(data.error || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Sign in error:', error);
            this.showAlert('An error occurred during login', 'error');
        }
    }

    // ---- Logout ------------------------------------------------------------

    async logout() {
        // Best-effort server-side logout; client state is the source of truth.
        try {
            await fetch(`${this.apiUrl}?action=logout`, { method: 'POST' });
        } catch (e) {
            /* ignore network errors on logout */
        }
        localStorage.removeItem(this.storageKey);
        this.currentUser = null;
        this.updateUI();
        this.showAlert('Logged out successfully', 'success');
    }

    // ---- Session persistence ----------------------------------------------

    setSession(user) {
        this.currentUser = user;
        localStorage.setItem(this.storageKey, JSON.stringify(user));
        this.updateUI();
    }

    loadUserFromStorage() {
        try {
            const userData = localStorage.getItem(this.storageKey);
            return userData ? JSON.parse(userData) : null;
        } catch (e) {
            return null;
        }
    }

    // ---- Navbar account control -------------------------------------------

    /**
     * Swaps the navbar "My Account" button between two states:
     *  - logged out: opens the sign-in modal (original behaviour)
     *  - logged in:  links to the account page, with an inline Logout action
     */
    updateUI() {
        const accountBtn = document.querySelector('.navbar [data-bs-target="#signInModal"]')
            || document.getElementById('accountNavBtn');
        if (!accountBtn) return;

        if (this.currentUser) {
            // Detach the modal trigger so the button no longer opens sign-in.
            accountBtn.removeAttribute('data-bs-toggle');
            accountBtn.removeAttribute('data-bs-target');
            accountBtn.innerHTML =
                `${this.escapeHtml(this.currentUser.first_name)}'s Account`;
            accountBtn.onclick = () => { window.location.href = this.accountPage; };

            this.renderLogoutLink(accountBtn);
        } else {
            // Restore sign-in behaviour.
            accountBtn.setAttribute('data-bs-toggle', 'modal');
            accountBtn.setAttribute('data-bs-target', '#signInModal');
            accountBtn.onclick = null;
            accountBtn.textContent = 'My Account';
            this.removeLogoutLink();
        }
    }

    renderLogoutLink(accountBtn) {
        this.removeLogoutLink();
        const li = document.createElement('li');
        li.className = 'nav-item';
        li.id = 'logoutNavItem';
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-outline-danger';
        btn.textContent = 'Logout';
        btn.addEventListener('click', () => this.logout());
        li.appendChild(btn);
        // Insert right after the account button's <li>, if present.
        const parentLi = accountBtn.closest('li') || accountBtn.parentElement;
        if (parentLi && parentLi.parentElement) {
            parentLi.parentElement.insertBefore(li, parentLi.nextSibling);
        }
    }

    removeLogoutLink() {
        document.getElementById('logoutNavItem')?.remove();
    }

    // ---- Shared UI utilities ----------------------------------------------

    closeModal(modalId) {
        const el = document.getElementById(modalId);
        if (el && window.bootstrap) {
            bootstrap.Modal.getInstance(el)?.hide();
        }
    }

    clearForm(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        modal
            .querySelectorAll('input[type="text"], input[type="email"], input[type="password"]')
            .forEach(input => (input.value = ''));
        modal
            .querySelectorAll('input[type="checkbox"]')
            .forEach(cb => (cb.checked = false));
    }

    escapeHtml(text) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }

    showAlert(message, type = 'info') {
        const variant =
            type === 'error' ? 'danger' :
            type === 'success' ? 'success' :
            type === 'warning' ? 'warning' : 'info';

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${variant} alert-dismissible fade show`;
        alertDiv.setAttribute('role', 'alert');
        alertDiv.style.position = 'fixed';
        alertDiv.style.top = '20px';
        alertDiv.style.right = '20px';
        alertDiv.style.zIndex = '9999';
        alertDiv.style.minWidth = '300px';
        alertDiv.innerHTML =
            `${this.escapeHtml(message)}` +
            `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;

        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 5000);
    }
}

// Initialize Auth Manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});
