import { prefersReducedMotion, isHoverDevice } from './env';

/**
 * Track pointer position relative to a rectangle, expose as CSS vars
 * --mx / --my (percentages). One rAF per element.
 */
function bindPointerVars(el: HTMLElement): void {
    let frame = 0;
    el.addEventListener('pointermove', (e) => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
            const rect = el.getBoundingClientRect();
            const mx = ((e.clientX - rect.left) / rect.width) * 100;
            const my = ((e.clientY - rect.top) / rect.height) * 100;
            el.style.setProperty('--mx', `${mx}%`);
            el.style.setProperty('--my', `${my}%`);
            frame = 0;
        });
    });
}

function initHeroSpotlight(): void {
    const hero = document.querySelector<HTMLElement>('[data-spotlight]');
    if (!hero) return;

    let active = false;
    let frame = 0;
    const update = (x: number, y: number) => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
            const rect = hero.getBoundingClientRect();
            hero.style.setProperty('--mx', `${((x - rect.left) / rect.width) * 100}%`);
            hero.style.setProperty('--my', `${((y - rect.top)  / rect.height) * 100}%`);
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

function initCardSpotlights(): void {
    document.querySelectorAll<HTMLElement>('[data-tilt]').forEach(bindPointerVars);
}

/**
 * Buttons that subtly translate toward the cursor when hovered.
 * Strength is a fraction of the offset from element center.
 */
function initMagnetic(): void {
    const STRENGTH = 0.22;

    document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
        let rect: DOMRect | null = null;
        let frame = 0;

        const recalc = () => { rect = el.getBoundingClientRect(); };

        el.addEventListener('pointerenter', recalc);
        el.addEventListener('pointermove', (e) => {
            if (frame) return;
            frame = requestAnimationFrame(() => {
                if (!rect) rect = el.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const dx = (e.clientX - cx) * STRENGTH;
                const dy = (e.clientY - cy) * STRENGTH;
                el.style.transform = `translate(${dx}px, ${dy}px)`;
                frame = 0;
            });
        });
        el.addEventListener('pointerleave', () => {
            el.style.transform = '';
            rect = null;
        });
        window.addEventListener('resize', () => { rect = null; });
    });
}

export function initPointerEffects(): void {
    if (prefersReducedMotion || !isHoverDevice) return;
    initHeroSpotlight();
    initCardSpotlights();
    initMagnetic();
}
