(function () {
    if (localStorage.getItem('pk-theme') === 'dark') {
        document.documentElement.classList.add('pk-dark');
    }
})();

document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('adminThemeToggleBtn');
    if (!btn) return;

    function updateIcon() {
        const isDark = document.documentElement.classList.contains('pk-dark');
        btn.textContent = isDark ? '☀️' : '🌙';
    }

    updateIcon();

    btn.addEventListener('click', function () {
        const isDark = document.documentElement.classList.toggle('pk-dark');
        localStorage.setItem('pk-theme', isDark ? 'dark' : 'light');
        updateIcon();
    });
});
