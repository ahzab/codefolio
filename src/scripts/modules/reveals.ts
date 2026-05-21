import { prefersReducedMotion } from './env';

/**
 * Add .in-view to .reveal elements when they enter the viewport.
 * The CSS does the actual animation. We unobserve after the first
 * intersection so animations only play once.
 */
export function initReveals(): void {
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
    reveals.forEach((el) => io.observe(el));
}
