// Newsletter Signup Handler
// Manages email subscription for PrintoKids PH exclusive offers

class NewsletterManager {
    constructor() {
        this.apiUrl = '../api/newsletter.php';
        this.init();
    }

    init() {
        // Attach event listener to newsletter signup button
        const subscribeBtn = document.querySelector('#modal .modal-footer .btn-primary, #modal .modal-footer .btn-success');
        if (subscribeBtn) {
            subscribeBtn.addEventListener('click', () => this.handleSubscribe());
        }
    }

    /**
     * Handle Newsletter Subscription
     */
    async handleSubscribe() {
        // Get form values from the modal
        const nameInput = document.querySelector('#modal input[placeholder="Your name here"]');
        const emailInput = document.querySelector('#modal input[placeholder="Enter your email"]');
        const locationInput = document.querySelector('#modal textarea#address');

        const name = nameInput?.value.trim();
        const email = emailInput?.value.trim();
        const location = locationInput?.value.trim();

        // Validation
        if (!name || !email) {
            this.showAlert('Name and email are required', 'error');
            return;
        }

        // Email validation
        if (!this.validateEmail(email)) {
            this.showAlert('Please enter a valid email address', 'error');
            return;
        }

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    location: location
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showAlert(data.message + ' ' + (data.info || ''), 'success');
                
                // Clear form
                this.clearForm();
                
                // Close modal
                const modal = document.getElementById('modal');
                if (modal) {
                    const bootstrapModal = bootstrap.Modal.getInstance(modal);
                    if (bootstrapModal) {
                        bootstrapModal.hide();
                    }
                }
            } else {
                this.showAlert(data.error || 'Subscription failed', 'error');
            }
        } catch (error) {
            console.error('Newsletter subscription error:', error);
            this.showAlert('An error occurred. Please try again later.', 'error');
        }
    }

    /**
     * Validate email format
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Clear form fields
     */
    clearForm() {
        const nameInput = document.querySelector('#modal input[placeholder="Your name here"]');
        const emailInput = document.querySelector('#modal input[placeholder="Enter your email"]');
        const locationInput = document.querySelector('#modal textarea#address');

        if (nameInput) nameInput.value = '';
        if (emailInput) emailInput.value = '';
        if (locationInput) locationInput.value = '';
    }

    /**
     * Show alert notification
     */
    showAlert(message, type = 'info') {
        // Create alert element
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

        // Add to page
        document.body.appendChild(alertDiv);

        // Auto-remove after 5 seconds
        setTimeout(() => alertDiv.remove(), 5000);
    }
}

// Initialize Newsletter Manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.newsletterManager = new NewsletterManager();
});
