import { prefersReducedMotion } from './env';

/**
 * Add .in-view to .reveal elements when they enter the viewport.
 * The CSS does the actual animation. We unobserve after the first
 * intersection so animations only play once.
 */
export function initReveals(): void {
    (window as unknown as { __revealReady?: boolean }).__revealReady = true;
    const reveals = document.querySelectorAll<HTMLElement>('.reveal');

    if (!('IntersectionObserver' in window) || prefersReducedMotion) {
        reveals.forEach((el) => el.classList.add('in-view'));
        return;
    }

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
    reveals.forEach((el) => {
        // Already on screen (or above it, after a restored scroll): no fade.
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('in-view');
        else io.observe(el);
    });

    // Print shows everything, whatever has scrolled into view.
    window.addEventListener('beforeprint', () => reveals.forEach((el) => el.classList.add('in-view')));
}
