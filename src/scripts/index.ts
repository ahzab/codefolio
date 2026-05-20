type Theme = 'light' | 'dark' | 'system';

const themeToggle = document.querySelector<HTMLElement>('.theme-toggle');
const themeButtons: Record<Theme, HTMLButtonElement | null> = {
    light: document.getElementById('btn-light') as HTMLButtonElement | null,
    dark: document.getElementById('btn-dark') as HTMLButtonElement | null,
    system: document.getElementById('btn-system') as HTMLButtonElement | null,
};
const contactBtn = document.getElementById('contact-btn') as HTMLAnchorElement | null;
const contactMail = document.getElementById('contact-mail') as HTMLAnchorElement | null;
const copyBtn = document.getElementById('copy-btn') as HTMLButtonElement | null;
const footerYear = document.getElementById('footer-year');

/* ── Theme ───────────────────────────────────────────── */
const setTheme = (theme: Theme) => {
    const isDark =
        theme === 'dark' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', theme);

    (Object.entries(themeButtons) as [Theme, HTMLButtonElement | null][]).forEach(([t, btn]) => {
        btn?.setAttribute('aria-pressed', String(t === theme));
    });

    themeToggle?.setAttribute('data-active', theme);

    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.content = isDark ? '#0a0a0a' : '#fafaf9';
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

/* ── Contact mailto (obfuscated) ─────────────────────── */
const openMailto = (el: HTMLElement) => {
    const user = el.getAttribute('data-user');
    const domain = el.getAttribute('data-domain');
    if (user && domain) {
        window.location.href = `mailto:${user}@${domain}`;
    }
};

[contactBtn, contactMail].forEach((el) => {
    el?.addEventListener('click', (e) => {
        e.preventDefault();
        openMailto(el);
    });
});

/* ── Copy email to clipboard ─────────────────────────── */
if (copyBtn && contactBtn) {
    let resetTimer: number | undefined;
    copyBtn.addEventListener('click', async () => {
        const user = contactBtn.getAttribute('data-user');
        const domain = contactBtn.getAttribute('data-domain');
        if (!user || !domain) return;
        const email = `${user}@${domain}`;
        const label = copyBtn.querySelector<HTMLElement>('.copy-btn__label');
        const defaultText = label?.dataset.default ?? 'Copy address';
        const copiedText = label?.dataset.copied ?? 'Copied';

        try {
            await navigator.clipboard.writeText(email);
        } catch {
            const ta = document.createElement('textarea');
            ta.value = email;
            ta.setAttribute('readonly', '');
            ta.style.position = 'absolute';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); } catch { /* noop */ }
            document.body.removeChild(ta);
        }

        copyBtn.classList.add('is-copied');
        if (label) label.textContent = copiedText;
        if (resetTimer) window.clearTimeout(resetTimer);
        resetTimer = window.setTimeout(() => {
            copyBtn.classList.remove('is-copied');
            if (label) label.textContent = defaultText;
        }, 1800);
    });
}

/* ── Footer year ─────────────────────────────────────── */
if (footerYear) {
    footerYear.textContent = String(new Date().getFullYear());
}

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Split-text on display heading ───────────────────── */
const splitDisplay = () => {
    const target = document.querySelector<HTMLElement>('[data-split]');
    if (!target) return;

    const walk = (node: Node, delayRef: { value: number }): Node[] => {
        const out: Node[] = [];
        node.childNodes.forEach((child) => {
            if (child.nodeType === Node.TEXT_NODE) {
                const text = child.textContent ?? '';
                const tokens = text.split(/(\s+)/);
                tokens.forEach((tok) => {
                    if (/^\s+$/.test(tok)) {
                        out.push(document.createTextNode(tok));
                    } else if (tok.length > 0) {
                        const word = document.createElement('span');
                        word.className = 'word';
                        const inner = document.createElement('span');
                        inner.className = 'word-inner';
                        inner.textContent = tok;
                        inner.style.transitionDelay = `${delayRef.value}s, ${delayRef.value}s`;
                        delayRef.value += 0.06;
                        word.appendChild(inner);
                        out.push(word);
                    }
                });
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                const el = child as HTMLElement;
                const clone = el.cloneNode(false) as HTMLElement;
                const children = walk(el, delayRef);
                children.forEach((c) => clone.appendChild(c));
                out.push(clone);
            } else {
                out.push(child.cloneNode(true));
            }
        });
        return out;
    };

    const delayRef = { value: 0.1 };
    const replacement = walk(target, delayRef);
    target.innerHTML = '';
    replacement.forEach((n) => target.appendChild(n));
};

if (!prefersReducedMotion) splitDisplay();

/* ── Scroll-triggered reveals ────────────────────────── */
const reveals = document.querySelectorAll<HTMLElement>('.reveal');
if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const io = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    io.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    reveals.forEach((el) => io.observe(el));
} else {
    reveals.forEach((el) => el.classList.add('in-view'));
}

/* ── Scroll progress & sticky header state ───────────── */
const progress = document.querySelector<HTMLElement>('.scroll-progress');
const header = document.querySelector<HTMLElement>('.site-header');

let ticking = false;
const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
        const doc = document.documentElement;
        const scrollTop = window.scrollY || doc.scrollTop;
        const scrollHeight = doc.scrollHeight - doc.clientHeight;
        const pct = scrollHeight > 0 ? Math.min(1, scrollTop / scrollHeight) : 0;
        if (progress) progress.style.width = `${pct * 100}%`;
        if (header) header.classList.toggle('is-scrolled', scrollTop > 4);
        ticking = false;
    });
};

window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ── Hero spotlight (cursor-tracked) ─────────────────── */
const hero = document.querySelector<HTMLElement>('[data-spotlight]');
if (hero && !prefersReducedMotion && window.matchMedia('(hover: hover)').matches) {
    let frame = 0;
    let active = false;
    const update = (x: number, y: number) => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
            const rect = hero.getBoundingClientRect();
            const mx = ((x - rect.left) / rect.width) * 100;
            const my = ((y - rect.top) / rect.height) * 100;
            hero.style.setProperty('--mx', `${mx}%`);
            hero.style.setProperty('--my', `${my}%`);
            frame = 0;
        });
    };
    hero.addEventListener('pointermove', (e) => {
        if (!active) {
            hero.classList.add('is-active');
            active = true;
        }
        update(e.clientX, e.clientY);
    });
    hero.addEventListener('pointerleave', () => {
        hero.classList.remove('is-active');
        active = false;
    });
}

/* ── Smooth in-page anchor ───────────────────────────── */
document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (!href || href === '#') return;
        if (href === '#top') {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        (target as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});
