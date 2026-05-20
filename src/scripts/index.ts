type Theme = 'light' | 'dark' | 'system';

const themeButtons: Record<Theme, HTMLButtonElement | null> = {
    light: document.getElementById('btn-light') as HTMLButtonElement | null,
    dark: document.getElementById('btn-dark') as HTMLButtonElement | null,
    system: document.getElementById('btn-system') as HTMLButtonElement | null,
};
const contactBtn = document.getElementById('contact-btn') as HTMLAnchorElement | null;
const timeEl = document.getElementById('local-time');

const setTheme = (theme: Theme) => {
    const isDark =
        theme === 'dark' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', theme);

    (Object.entries(themeButtons) as [Theme, HTMLButtonElement | null][]).forEach(([t, btn]) => {
        btn?.setAttribute('aria-pressed', String(t === theme));
    });
};

const currentTheme = (localStorage.getItem('theme') as Theme | null) ?? 'system';
setTheme(currentTheme);

themeButtons.light?.addEventListener('click', () => setTheme('light'));
themeButtons.dark?.addEventListener('click', () => setTheme('dark'));
themeButtons.system?.addEventListener('click', () => setTheme('system'));

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if ((localStorage.getItem('theme') as Theme | null) === 'system') {
        setTheme('system');
    }
});

if (contactBtn) {
    contactBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const user = contactBtn.getAttribute('data-user');
        const domain = contactBtn.getAttribute('data-domain');
        if (user && domain) {
            window.location.href = `mailto:${user}@${domain}`;
        }
    });
}

const updateTime = () => {
    if (!timeEl) return;
    const opts: Intl.DateTimeFormatOptions = {
        timeZone: 'Africa/Casablanca',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    };
    timeEl.textContent = new Intl.DateTimeFormat('en-GB', opts).format(new Date());
};

updateTime();
setInterval(updateTime, 30_000);
