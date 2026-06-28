// ============================================================
// PrintoKids PH — Auth Manager  (fixed)
// Fixes applied:
//   - PHP session as source of truth (not localStorage)
//   - action sent in POST body, not URL query string
//   - reads signUpFirstName, signUpLastName, signUpPhone (matching index.html IDs)
//   - button selectors use IDs (signInSubmitBtn / signUpSubmitBtn)
//   - getUserId() method added (required by cart.js)
//   - phone field sent to register endpoint
//   - logout properly calls POST with action in body
// ============================================================

const API = window.API_ROOT || '../api';

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        await this.checkSession();
        this.bindButtons();
        this.updateUI();
    }

    // ── Session check (PHP session = source of truth) ──────
    async checkSession() {
        try {
            const res  = await fetch(`${API}/auth.php?action=check`);
            const data = await res.json();
            if (data.logged_in && data.user_type === 'customer') {
                this.currentUser = data;
            } else {
                this.currentUser = null;
            }
        } catch {
            this.currentUser = null;
        }
    }

    // ── Bind buttons by ID (safe, no ambiguous selectors) ──
    bindButtons() {
        document.getElementById('signInSubmitBtn')
            ?.addEventListener('click', () => this.handleSignIn());
        document.getElementById('signUpSubmitBtn')
            ?.addEventListener('click', () => this.handleSignUp());
        document.getElementById('logoutBtn')
            ?.addEventListener('click', () => this.handleLogout());

        document.getElementById('signInModal')
            ?.addEventListener('keydown', e => { if (e.key === 'Enter') this.handleSignIn(); });
        document.getElementById('signUpModal')
            ?.addEventListener('keydown', e => { if (e.key === 'Enter') this.handleSignUp(); });

        // Forgot password wiring
        document.getElementById('forgotPasswordLink')
            ?.addEventListener('click', e => { e.preventDefault(); this.showForgotPassword(); });
        document.getElementById('forgotBackBtn')
            ?.addEventListener('click', () => this.hideForgotPassword());
        document.getElementById('forgotSubmitBtn')
            ?.addEventListener('click', () => this.submitForgotPassword());
        document.getElementById('signInModal')
            ?.addEventListener('hidden.bs.modal', () => this.hideForgotPassword());
    }

    showForgotPassword() {
        document.getElementById('signInFields').style.display   = 'none';
        document.getElementById('signInFooter').style.display   = 'none';
        document.getElementById('forgotSection').style.display  = 'block';
        document.getElementById('forgotError').style.display    = 'none';
        document.getElementById('forgotSuccess').style.display  = 'none';
        document.getElementById('forgotEmail').value =
            document.getElementById('signInEmail')?.value || '';
    }

    hideForgotPassword() {
        document.getElementById('signInFields').style.display   = '';
        document.getElementById('signInFooter').style.display   = '';
        document.getElementById('forgotSection').style.display  = 'none';
        document.getElementById('forgotError').style.display    = 'none';
        document.getElementById('forgotSuccess').style.display  = 'none';
        const btn = document.getElementById('forgotSubmitBtn');
        if (btn) { btn.disabled = false; btn.style.display = ''; }
    }

    async submitForgotPassword() {
        const email  = document.getElementById('forgotEmail').value.trim();
        const errEl  = document.getElementById('forgotError');
        const okEl   = document.getElementById('forgotSuccess');
        const btn    = document.getElementById('forgotSubmitBtn');
        errEl.style.display = 'none';
        okEl.style.display  = 'none';

        if (!email) {
            errEl.textContent   = 'Please enter your email address.';
            errEl.style.display = 'block';
            return;
        }

        btn.disabled = true;

        try {
            const res  = await fetch(`${API}/auth.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'forgot_password', email, user_type: 'customer' }),
            });
            const data = await res.json();

            if (data.success && data.reset_url) {
                document.getElementById('forgotResetLink').href = data.reset_url;
                okEl.style.display   = 'block';
                btn.style.display    = 'none';
            } else if (data.success) {
                errEl.textContent   = 'No account found with that email address.';
                errEl.style.display = 'block';
                btn.disabled = false;
            } else {
                errEl.textContent   = data.error || 'Something went wrong. Please try again.';
                errEl.style.display = 'block';
                btn.disabled = false;
            }
        } catch {
            errEl.textContent   = 'Connection error. Make sure XAMPP is running.';
            errEl.style.display = 'block';
            btn.disabled = false;
        }
    }

    // ── Sign in ────────────────────────────────────────────
    async handleSignIn() {
        const email    = document.getElementById('signInEmail')?.value.trim();
        const password = document.getElementById('signInPassword')?.value;

        if (!email || !password) {
            this.showAlert('Email and password are required.', 'warning');
            return;
        }

        try {
            const res  = await fetch(`${API}/auth.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // action in the body — NOT the URL
                body: JSON.stringify({ action: 'login', email, password, user_type: 'customer' })
            });
            const data = await res.json();

            if (data.success) {
                this.currentUser = data.customer || data;
                this.updateUI();
                bootstrap.Modal.getInstance(document.getElementById('signInModal'))?.hide();
                this.clearForm('signInModal');
                this.showAlert(`Welcome back, ${this.currentUser.first_name || 'there'}!`, 'success');
            } else {
                this.showAlert(data.error || 'Login failed. Check your credentials.', 'danger');
            }
        } catch {
            this.showAlert('Connection error. Make sure XAMPP is running.', 'danger');
        }
    }

    // ── Sign up ────────────────────────────────────────────
    async handleSignUp() {
        const firstName       = document.getElementById('signUpFirstName')?.value.trim();
        const lastName        = document.getElementById('signUpLastName')?.value.trim();
        const email           = document.getElementById('signUpEmail')?.value.trim();
        const phone           = document.getElementById('signUpPhone')?.value.trim();
        const password        = document.getElementById('signUpPassword')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;
        const termsCheck      = document.getElementById('termsCheck')?.checked;

        if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
            this.showAlert('All fields are required.', 'warning');
            return;
        }
        if (!termsCheck) {
            this.showAlert('You must agree to the Terms of Service.', 'warning');
            return;
        }
        if (password !== confirmPassword) {
            this.showAlert('Passwords do not match.', 'danger');
            return;
        }
        if (password.length < 8) {
            this.showAlert('Password must be at least 8 characters.', 'warning');
            return;
        }

        try {
            const res  = await fetch(`${API}/auth.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'register',
                    first_name: firstName,
                    last_name: lastName,
                    email,
                    phone,
                    password,
                    password_confirm: confirmPassword
                })
            });
            const data = await res.json();

            if (data.success) {
                this.currentUser = data.customer || data;
                this.updateUI();
                bootstrap.Modal.getInstance(document.getElementById('signUpModal'))?.hide();
                this.clearForm('signUpModal');
                this.showAlert(`Welcome to PrintoKids PH, ${firstName}!`, 'success');
            } else {
                this.showAlert(data.error || 'Registration failed.', 'danger');
            }
        } catch {
            this.showAlert('Connection error. Make sure XAMPP is running.', 'danger');
        }
    }

    // ── Logout ─────────────────────────────────────────────
    async handleLogout() {
        try {
            await fetch(`${API}/auth.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'logout' })
            });
        } catch { /* ignore */ }

        this.currentUser = null;
        this.updateUI();
        this.showAlert('Logged out successfully.', 'success');
        if (window.cartManager) window.cartManager.clearCart();
    }

    // ── Update navbar UI ────────────────────────────────────
    updateUI() {
        const accountBtn    = document.getElementById('accountBtn');
        const logoutItem    = document.getElementById('logoutNavItem');
        const myAccountItem = document.getElementById('myAccountNavItem');
        const guestItems    = document.querySelectorAll('.guest-only');
        const authItems     = document.querySelectorAll('.auth-only');

        if (this.currentUser) {
            if (accountBtn) {
                accountBtn.textContent = `${this.currentUser.first_name || 'Account'}`;
                accountBtn.setAttribute('href', window.MY_ACCOUNT_URL || 'my_account/index.html');
                accountBtn.removeAttribute('data-bs-toggle');
                accountBtn.removeAttribute('data-bs-target');
            }
            if (logoutItem)    logoutItem.style.display    = '';
            if (myAccountItem) myAccountItem.style.display = '';
            guestItems.forEach(el => el.style.display = 'none');
            authItems.forEach(el  => el.style.display  = '');
        } else {
            if (accountBtn) {
                accountBtn.textContent = 'My Account';
                accountBtn.setAttribute('href', '#');
                accountBtn.setAttribute('data-bs-toggle', 'modal');
                accountBtn.setAttribute('data-bs-target', '#signInModal');
            }
            if (logoutItem)    logoutItem.style.display    = 'none';
            if (myAccountItem) myAccountItem.style.display = 'none';
            guestItems.forEach(el => el.style.display = '');
            authItems.forEach(el  => el.style.display  = 'none');
        }
    }

    // ── Public helpers used by other modules ───────────────
    isLoggedIn() { return !!this.currentUser; }

    getUserId() {
        if (!this.currentUser) return null;
        return this.currentUser.id
            || this.currentUser.customer?.id
            || null;
    }

    requireAuth(redirectTo = '../index.html') {
        if (this.currentUser) return this.currentUser;
        const signInEl = document.getElementById('signInModal');
        if (signInEl && window.bootstrap) {
            this.showAlert('Please sign in to continue.', 'warning');
            bootstrap.Modal.getOrCreateInstance(signInEl).show();
        } else {
            window.location.href = redirectTo;
        }
        return false;
    }

    // ── Utilities ──────────────────────────────────────────
    clearForm(modalId) {
        document.getElementById(modalId)
            ?.querySelectorAll('input')
            .forEach(i => { i.value = ''; if (i.type === 'checkbox') i.checked = false; });
    }

    showAlert(message, type = 'info') {
        const div = document.createElement('div');
        div.className = `alert alert-${type} alert-dismissible fade show pk-toast`;
        div.style.cssText = 'position:fixed;top:16px;right:16px;z-index:9999;min-width:280px;max-width:380px';
        div.innerHTML = `${this.escapeHtml(message)}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 5000);
    }

    escapeHtml(str) {
        const map = { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' };
        return String(str || '').replace(/[&<>"']/g, m => map[m]);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

