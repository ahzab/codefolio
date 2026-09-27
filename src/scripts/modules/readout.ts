import { prefersReducedMotion } from './env';

/**
 * Dot-matrix readout: each [data-count] counts up from 00 to its value once,
 * the first time it scrolls into view. The markup already holds the final
 * value, so no-JS, reduced motion and crawlers all see the real number.
 */
export function initReadout(): void {
    const cells = document.querySelectorAll<HTMLElement>('[data-count]');
    if (!cells.length || prefersReducedMotion || !('IntersectionObserver' in window)) return;

    const pad = (n: number) => String(n).padStart(2, '0');

    const run = (el: HTMLElement) => {
        const target = Number(el.dataset.count);
        if (!Number.isFinite(target) || target <= 0) return;
        const step = Math.max(60, Math.round(700 / target));
        let n = 0;
        el.textContent = pad(0);
        const timer = window.setInterval(() => {
            n += 1;
            el.textContent = pad(n);
            if (n >= target) window.clearInterval(timer);
        }, step);
    };

    const io = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                io.unobserve(entry.target);
                run(entry.target as HTMLElement);
            });
        },
        { threshold: 0.6 }
    );
    cells.forEach((el) => io.observe(el));
}
