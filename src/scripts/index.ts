type Theme = 'light' | 'dark' | 'system';

const themeButtons: Record<Theme, HTMLButtonElement | null> = {
    light: document.getElementById('btn-light') as HTMLButtonElement | null,
    dark: document.getElementById('btn-dark') as HTMLButtonElement | null,
    system: document.getElementById('btn-system') as HTMLButtonElement | null,
};
const contactBtn = document.getElementById('contact-btn') as HTMLAnchorElement | null;

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Theme ─────────────────────────────────────────── */
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

/* ── Contact mailto ────────────────────────────────── */
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

/* ── Scroll-triggered reveals ──────────────────────── */
const revealTargets = document.querySelectorAll<HTMLElement>('[data-reveal]');

if (prefersReducedMotion) {
    revealTargets.forEach(el => el.classList.add('in-view'));
} else {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    revealTargets.forEach(el => observer.observe(el));
}

/* ── Email scramble on hover ───────────────────────── */
if (contactBtn && !prefersReducedMotion) {
    const finalText = contactBtn.getAttribute('data-text') ?? contactBtn.textContent ?? '';
    const pool = '!<>-_\\/[]{}—=+*^?#abcdef0123456789@.';
    let raf = 0;
    let running = false;

    const scramble = () => {
        if (running) return;
        running = true;
        const start = performance.now();
        const duration = 550;

        const frame = (now: number) => {
            const t = Math.min((now - start) / duration, 1);
            const revealed = Math.floor(finalText.length * t);
            let out = '';
            for (let i = 0; i < finalText.length; i++) {
                const ch = finalText[i];
                if (i < revealed || ch === ' ') {
                    out += ch;
                } else {
                    out += pool[Math.floor(Math.random() * pool.length)];
                }
            }
            contactBtn.textContent = out;
            if (t < 1) {
                raf = requestAnimationFrame(frame);
            } else {
                contactBtn.textContent = finalText;
                running = false;
            }
        };
        raf = requestAnimationFrame(frame);
    };

    const cancel = () => {
        cancelAnimationFrame(raf);
        contactBtn.textContent = finalText;
        running = false;
    };

    contactBtn.addEventListener('mouseenter', scramble);
    contactBtn.addEventListener('focus', scramble);
    contactBtn.addEventListener('mouseleave', cancel);
    contactBtn.addEventListener('blur', cancel);
}
