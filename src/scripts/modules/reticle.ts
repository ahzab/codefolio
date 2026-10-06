import { gsap } from 'gsap';

/**
 * Targeting reticle (fine pointers only). Four corner brackets ride the
 * pointer with a live x / y readout; over a card, button or row they snap
 * open to frame it and read out its id and size, like an instrument locking
 * on. The native cursor stays: this is an overlay, not a replacement.
 */
const TARGETS = '.module, .btn, .note-row, .nav a, .socials a, .spec__row, .module__link, .brand, .readout__cell, .link-mono, .track__stage, .track__earlier-body, .viewswitch__opt, .machine__copy';
const IDLE = 26;

function labelFor(el: HTMLElement, w: number, h: number): string {
    const size = `${Math.round(w)}×${Math.round(h)}`;
    const id =
        el.querySelector('.module__bar .lbl')?.textContent ||
        el.querySelector('dt, .track__stage-no')?.textContent ||
        (el.matches('button, a') ? (el.textContent || '').replace(/[↗→⧉]/g, '') : '') ||
        el.className.split(' ')[0].split('__')[0];
    return `${id.trim().toUpperCase().slice(0, 28)} · ${size}`;
}

export function initReticle(): void {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const el = document.createElement('div');
    el.className = 'reticle';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<i></i><i></i><i></i><i></i><span class="reticle__lbl"></span>';
    document.body.append(el);
    const lbl = el.querySelector<HTMLElement>('.reticle__lbl')!;

    const qx = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3.out' });
    const qy = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3.out' });
    const qw = gsap.quickTo(el, 'width', { duration: 0.4, ease: 'power3.out' });
    const qh = gsap.quickTo(el, 'height', { duration: 0.4, ease: 'power3.out' });

    let target: HTMLElement | null = null;
    let px = 0, py = 0;

    const place = (): void => {
        if (target) {
            const r = target.getBoundingClientRect();
            const pad = 6;
            qx(r.left - pad); qy(r.top - pad);
            qw(r.width + pad * 2); qh(r.height + pad * 2);
            lbl.textContent = labelFor(target, r.width, r.height);
            // Keep the readout on screen: flip left near the right edge, above near the bottom.
            el.classList.toggle('is-flip-x', r.left + 220 > window.innerWidth);
            el.classList.toggle('is-flip-y', r.bottom + 34 > window.innerHeight);
        } else {
            qx(px - IDLE / 2); qy(py - IDLE / 2);
            qw(IDLE); qh(IDLE);
            lbl.textContent = `${Math.round(px)}, ${Math.round(py)}`;
            el.classList.toggle('is-flip-x', px + 120 > window.innerWidth);
            el.classList.toggle('is-flip-y', py + 50 > window.innerHeight);
        }
    };

    window.addEventListener('pointermove', (e) => {
        px = e.clientX; py = e.clientY;
        const hit = (e.target as HTMLElement).closest<HTMLElement>(TARGETS);
        // Prefer the innermost target (a link inside a card frames the link).
        if (hit !== target) {
            target = hit;
            el.classList.toggle('is-locked', !!target);
        }
        if (!el.classList.contains('is-on')) {
            gsap.set(el, { x: px - IDLE / 2, y: py - IDLE / 2, width: IDLE, height: IDLE });
            el.classList.add('is-on');
        }
        place();
    }, { passive: true });

    window.addEventListener('scroll', () => { if (target) place(); }, { passive: true });
    document.addEventListener('pointerleave', () => el.classList.remove('is-on'));
    window.addEventListener('blur', () => el.classList.remove('is-on'));
    document.addEventListener('pointerdown', () => {
        gsap.fromTo(el, { scale: 0.92 }, { scale: 1, duration: 0.35, ease: 'back.out(3)' });
    });
}
