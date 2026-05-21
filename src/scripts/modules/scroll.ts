import { prefersReducedMotion } from './env';

/**
 * Single rAF-throttled scroll handler that updates:
 *   - .scroll-progress width (top bar)
 *   - .site-header.is-scrolled (sticky-state styling)
 *   - --scroll-y on :root (read by parallax transforms in CSS)
 */
function initScrollDriver(): void {
    const progress = document.querySelector<HTMLElement>('.scroll-progress');
    const header   = document.querySelector<HTMLElement>('.site-header');
    const root     = document.documentElement;
    const parallaxOn = !prefersReducedMotion;

    let ticking = false;
    const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            const scrollTop = window.scrollY || root.scrollTop;
            const scrollHeight = root.scrollHeight - root.clientHeight;
            const pct = scrollHeight > 0 ? Math.min(1, scrollTop / scrollHeight) : 0;

            if (progress) progress.style.width = `${pct * 100}%`;
            if (header) header.classList.toggle('is-scrolled', scrollTop > 4);
            if (parallaxOn) root.style.setProperty('--scroll-y', String(scrollTop));

            ticking = false;
        });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
}

/**
 * Hijack same-page anchor links to use smooth scrolling. CSS
 * scroll-padding-top keeps the header from covering target sections.
 */
function initSmoothAnchors(): void {
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
}

export function initScroll(): void {
    initScrollDriver();
    initSmoothAnchors();
}
