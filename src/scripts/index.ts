import { initContact, initFooterYear } from './modules/contact';
import { initHeaderClock } from './modules/clock';
import { initReveals } from './modules/reveals';
import { initScroll } from './modules/scroll';
import { initMobileNav } from './modules/nav';
import { initReadout } from './modules/readout';
import { initMachineView } from './modules/machine';
import { prefersReducedMotion } from './modules/env';

// Each module starts on its own: one failing on an odd browser must not take
// the rest (the view switch included) down with it.
[initMachineView, initMobileNav, initContact, initFooterYear, initHeaderClock, initReveals, initScroll, initReadout].forEach((init) => {
    try { init(); } catch (e) { console.error(e); }
});

// Motion layer (GSAP): fetched after first paint so it never competes with
// LCP, and not at all under reduced motion.
if (!prefersReducedMotion) {
    const loadMotion = () => import('./modules/motion').then((m) => m.initMotion());
    const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(loadMotion, { timeout: 2000 }) : setTimeout(loadMotion, 200));
    if (document.readyState === 'complete') idle();
    else window.addEventListener('load', idle, { once: true });
}
