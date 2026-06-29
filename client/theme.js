// ── PrintoKids PH Theme Toggle ────────────────────────────
// Runs immediately to prevent flash of wrong theme
(function () {
    if (localStorage.getItem('pk-theme') === 'dark') {
        document.documentElement.classList.add('pk-dark');
    }
})();

document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('themeToggleBtn');
    if (!btn) return;

    function updateIcon() {
        const isDark = document.documentElement.classList.contains('pk-dark');
        btn.textContent = isDark ? '☀️' : '🌙';
        btn.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    }

    updateIcon();

    btn.addEventListener('click', function () {
        const isDark = document.documentElement.classList.toggle('pk-dark');
        localStorage.setItem('pk-theme', isDark ? 'dark' : 'light');
        updateIcon();
    });
});
