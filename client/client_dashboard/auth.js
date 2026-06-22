// Authentication Handler
// Manages sign-up, sign-in, and session state

class AuthManager {
    constructor() {
        this.apiUrl = '../api/auth.php';
        this.currentUser = this.loadUserFromStorage();
        this.init();
    }

    init() {
        // Attach event listeners to form buttons
        const signUpBtn = document.querySelector('#signUpModal .btn-success');
        const signInBtn = document.querySelector('#signInModal .btn-primary');
        
        if (signUpBtn) {
            signUpBtn.addEventListener('click', () => this.handleSignUp());
        }
        if (signInBtn) {
            signInBtn.addEventListener('click', () => this.handleSignIn());
        }
        
        // Update UI based on login state
        this.updateUI();
    }

    /**
     * Handle Sign Up Form Submission
     */
    async handleSignUp() {
        const fullName = document.getElementById('fullName')?.value.trim();
        const email = document.getElementById('signUpEmail')?.value.trim();
        const password = document.getElementById('signUpPassword')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;
        const termsCheck = document.getElementById('termsCheck')?.checked;

        // Validation
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

        // Split full name into first and last
        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || 'User';

        try {
            const response = await fetch(`${this.apiUrl}?action=register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    email: email,
                    phone: '', // Optional for now
                    password: password,
                    password_confirm: confirmPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showAlert('Account created successfully! Welcome to PrintoKids PH', 'success');
                // Save user to localStorage
                this.saveUserToStorage(data.customer);
                this.currentUser = data.customer;
                this.updateUI();
                
                // Close modal
                const signUpModal = bootstrap.Modal.getInstance(document.getElementById('signUpModal'));
                if (signUpModal) signUpModal.hide();
                
                // Clear form
                this.clearForm('signUpModal');
            } else {
                this.showAlert(data.error || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Sign up error:', error);
            this.showAlert('An error occurred during registration', 'error');
        }
    }

    /**
     * Handle Sign In Form Submission
     */
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
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showAlert(`Welcome back, ${data.customer.first_name}!`, 'success');
                // Save user to localStorage
                this.saveUserToStorage(data.customer);
                this.currentUser = data.customer;
                this.updateUI();
                
                // Close modal
                const signInModal = bootstrap.Modal.getInstance(document.getElementById('signInModal'));
                if (signInModal) signInModal.hide();
                
                // Clear form
                this.clearForm('signInModal');
            } else {
                this.showAlert(data.error || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Sign in error:', error);
            this.showAlert('An error occurred during login', 'error');
        }
    }

    /**
     * Handle Logout
     */
    logout() {
        localStorage.removeItem('printokids_user');
        this.currentUser = null;
        this.updateUI();
        this.showAlert('Logged out successfully', 'success');
    }

    /**
     * Save user data to localStorage
     */
    saveUserToStorage(user) {
        localStorage.setItem('printokids_user', JSON.stringify(user));
    }

    /**
     * Load user data from localStorage
     */
    loadUserFromStorage() {
        const userData = localStorage.getItem('printokids_user');
        return userData ? JSON.parse(userData) : null;
    }

    /**
     * Update UI based on login state
     */
    updateUI() {
        const accountBtn = document.querySelector('[data-bs-target="#signInModal"]');
        
        if (this.currentUser && accountBtn) {
            // User is logged in
            accountBtn.textContent = `${this.currentUser.first_name}'s Account`;
            
            // Show logout button instead
            accountBtn.innerHTML = `
                ${this.currentUser.first_name}'s Account
                <small class="d-block" style="font-size: 0.7em;">
                    <a href="#" onclick="authManager.logout(); return false;">Logout</a>
                </small>
            `;
        } else if (accountBtn) {
            // User is not logged in
            accountBtn.textContent = 'My Account';
        }
    }

    /**
     * Show alert notification
     */
    showAlert(message, type = 'info') {
        // Create alert element
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} alert-dismissible fade show`;
        alertDiv.setAttribute('role', 'alert');
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        // Add to page
        const body = document.body;
        body.insertBefore(alertDiv, body.firstChild);

        // Auto-remove after 5 seconds
        setTimeout(() => alertDiv.remove(), 5000);
    }

    /**
     * Clear form fields
     */
    clearForm(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            const inputs = modal.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
            inputs.forEach(input => input.value = '');
        }
    }
}

// Initialize Auth Manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});
