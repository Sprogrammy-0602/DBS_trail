(function () {
    const storageKey = 'app-theme';
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const saved = localStorage.getItem(storageKey);

    function applyTheme(theme) {
        const body = document.body;
        body.classList.add('app-theme');
        body.classList.remove('theme-dark', 'theme-light');
        body.classList.add(theme === 'light' ? 'theme-light' : 'theme-dark');
        const btn = document.getElementById('theme-toggle');
        if (btn) {
            btn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
            const icon = btn.querySelector('.icon');
            if (icon) icon.textContent = theme === 'light' ? '🌞' : '🌙';
        }
    }

    function currentTheme() {
        return document.body.classList.contains('theme-light') ? 'light' : 'dark';
    }

    function init() {
        const initial = saved ? saved : 'light';
        applyTheme(initial);
        const btn = document.getElementById('theme-toggle');
        if (btn) {
            btn.addEventListener('click', function () {
                const next = currentTheme() === 'light' ? 'dark' : 'light';
                localStorage.setItem(storageKey, next);
                applyTheme(next);
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

