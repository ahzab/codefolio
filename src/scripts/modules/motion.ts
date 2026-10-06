import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { isHoverDevice } from './env';

/**
 * Motion layer for the homepage, built on GSAP + ScrollTrigger. Loaded lazily
 * from index.ts after first paint and skipped under reduced motion, so it
 * never touches LCP and the page is complete without it: every effect starts
 * from the final markup and only animates things the reader hasn't seen yet.
 *
 * The theme is the instrument: labels decode like a readout, a signal pulse
 * runs through the pipeline, the career track draws as you scroll, and the
 * hero's dot grid lights up under the pointer.
 */
gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin);

const SCRAMBLE_CHARS = '01<>/#_[]=+';
const START = 'top 85%';

/** True when the element is already on screen (or above it) at init. */
const seen = (el: Element): boolean => el.getBoundingClientRect().top < window.innerHeight * 0.9;

const unseen = <T extends Element>(sel: string, root: ParentNode = document): T[] =>
    Array.from(root.querySelectorAll<T>(sel)).filter((el) => !seen(el));

/** Text decodes from noise to its real value, once, when it scrolls in. */
function decode(el: HTMLElement, duration = 0.9): void {
    const final = el.textContent || '';
    if (!final.trim() || el.children.length) return;
    gsap.to(el, {
        duration,
        ease: 'none',
        scrambleText: { text: final, chars: SCRAMBLE_CHARS, revealDelay: 0.25, speed: 0.6 },
        scrollTrigger: { trigger: el, start: START, once: true },
    });
}

function labels(): void {
    unseen<HTMLElement>('.sec__head .lbl, .split__head > .lbl, .contact > .shell > .lbl, .modules__group .lbl, .track__earlier > .lbl').forEach((el) => decode(el, 0.7));
    unseen<HTMLElement>('.sec__title').forEach((el) => decode(el, 1));
}

function modules(): void {
    const cards = unseen<HTMLElement>('.module');
    if (cards.length) {
        gsap.set(cards, { autoAlpha: 0, y: 28 });
        ScrollTrigger.batch(cards, {
            start: START,
            once: true,
            onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.09 }),
        });
    }

    // A signal pulse travels Issue → Merge, then lands on the green step. Loops while visible.
    document.querySelectorAll<HTMLElement>('.pipeline').forEach((pipe) => {
        const steps = Array.from(pipe.querySelectorAll<HTMLElement>('li')).slice(0, -1);
        if (!steps.length) return;
        const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.6, paused: true });
        steps.forEach((li, i) => {
            tl.to(li, { borderColor: '#ff3b30', color: '#ededed', duration: 0.18, ease: 'power1.out' }, i * 0.22)
              .to(li, { borderColor: '#3a3a3a', clearProps: 'color', duration: 0.5, ease: 'power1.in' }, i * 0.22 + 0.22);
        });
        const last = pipe.querySelector('li:last-child');
        if (last) tl.fromTo(last, { scale: 1 }, { scale: 1.08, duration: 0.14, yoyo: true, repeat: 1, ease: 'power2.out' }, steps.length * 0.22);
        ScrollTrigger.create({ trigger: pipe, start: 'top 95%', end: 'bottom 5%', onToggle: (self) => (self.isActive ? tl.play() : tl.pause()) });
    });

    // The check list runs like a test suite: each row ticks in, its status decodes.
    document.querySelectorAll<HTMLElement>('.checks').forEach((list) => {
        if (seen(list)) return;
        const rows = list.querySelectorAll<HTMLElement>('li');
        const tl = gsap.timeline({ scrollTrigger: { trigger: list, start: START, once: true } });
        rows.forEach((row, i) => {
            const status = row.querySelector<HTMLElement>('span:last-child');
            tl.from(row, { autoAlpha: 0, x: -10, duration: 0.35, ease: 'power2.out' }, i * 0.16);
            if (status) tl.to(status, { duration: 0.45, scrambleText: { text: status.textContent || '', chars: '.:/', speed: 0.8 } }, i * 0.16 + 0.1);
        });
    });
}

function track(): void {
    const stages = document.querySelectorAll<HTMLElement>('.track__stage');
    stages.forEach((stage) => {
        const line = stage.querySelector<HTMLElement>('.track__line');
        const node = stage.querySelector<HTMLElement>('.track__node');
        const content = stage.querySelector<HTMLElement>('.track__content');
        if (seen(stage)) return;

        // The rail draws itself as the reader scrolls down the career: down the
        // page on mobile, left to right where the desktop lays it out in a row.
        if (line && getComputedStyle(line).display !== 'none') {
            const across = line.offsetWidth > line.offsetHeight;
            gsap.fromTo(line, across ? { scaleX: 0 } : { scaleY: 0 }, {
                ...(across ? { scaleX: 1 } : { scaleY: 1 }),
                ease: 'none',
                transformOrigin: across ? 'left center' : 'top center',
                scrollTrigger: { trigger: stage, start: 'top 75%', end: 'bottom 60%', scrub: 0.6 },
            });
        }
        const tl = gsap.timeline({ scrollTrigger: { trigger: stage, start: 'top 78%', once: true } });
        if (node) tl.from(node, { scale: 0, rotate: 45, duration: 0.45, ease: 'back.out(3)' });
        if (content) tl.from(content.children, { autoAlpha: 0, y: 14, duration: 0.5, stagger: 0.06, ease: 'power2.out' }, '<0.1');
    });

    // The current stage keeps a slow ping, the "you are here" light.
    const now = document.querySelector<HTMLElement>('.track__stage.is-now .track__node');
    if (now) now.classList.add('track__node--ping');

    unseen<HTMLElement>('.track__earlier').forEach((block) => {
        gsap.from(block.querySelector('.track__earlier-body'), {
            autoAlpha: 0, y: 16, duration: 0.6, ease: 'power2.out',
            scrollTrigger: { trigger: block, start: START, once: true },
        });
    });
}

function rows(): void {
    [['.spec__row', -18], ['.note-row', 0]].forEach(([sel, x]) => {
        const items = unseen<HTMLElement>(sel as string);
        if (!items.length) return;
        gsap.set(items, { autoAlpha: 0, x, y: x ? 0 : 16 });
        ScrollTrigger.batch(items, {
            start: START,
            once: true,
            onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, x: 0, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.07 }),
        });
    });

    // Writing arrows lean toward the reader on hover.
    if (isHoverDevice) {
        document.querySelectorAll<HTMLElement>('.note-row').forEach((row) => {
            const arrow = row.querySelector('.note-row__arrow');
            if (!arrow) return;
            row.addEventListener('mouseenter', () => gsap.to(arrow, { x: 6, duration: 0.3, ease: 'power3.out' }));
            row.addEventListener('mouseleave', () => gsap.to(arrow, { x: 0, duration: 0.4, ease: 'power3.out' }));
        });
    }
}

function contact(): void {
    const title = document.querySelector<HTMLElement>('.contact__title');
    if (!title || seen(title)) return;
    const words = Array.from(title.children) as HTMLElement[];
    const tl = gsap.timeline({ scrollTrigger: { trigger: title, start: 'top 80%', once: true } });
    words.forEach((word, i) => {
        // Only the leading text node scrambles; the blinking cursor span stays put.
        const textNode = Array.from(word.childNodes).find((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
        if (!textNode) return;
        const holder = document.createElement('span');
        holder.className = 'contact__word';
        holder.textContent = textNode.textContent;
        word.replaceChild(holder, textNode);
        tl.to(holder, { duration: 1.1, ease: 'none', scrambleText: { text: holder.textContent || '', chars: '01#/', revealDelay: 0.3, speed: 0.5 } }, i * 0.18);
    });
    tl.from(title.parentElement!.querySelector('.contact__side'), { autoAlpha: 0, y: 20, duration: 0.7, ease: 'power3.out' }, 0.3);
}

/** The hero's dot grid lights up in signal red under the pointer. Hover devices only. */
function heroLights(): void {
    const hero = document.querySelector<HTMLElement>('.hero');
    if (!hero || !isHoverDevice) return;
    const lights = document.createElement('div');
    lights.className = 'hero__lights';
    lights.setAttribute('aria-hidden', 'true');
    hero.prepend(lights);

    const x = gsap.quickTo(lights, '--lx', { duration: 0.6, ease: 'power3.out' });
    const y = gsap.quickTo(lights, '--ly', { duration: 0.6, ease: 'power3.out' });
    hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        x(e.clientX - r.left);
        y(e.clientY - r.top);
    });
    hero.addEventListener('pointerenter', () => gsap.to(lights, { opacity: 1, duration: 0.4 }));
    hero.addEventListener('pointerleave', () => gsap.to(lights, { opacity: 0, duration: 0.6 }));
}

/** Primary buttons lean toward the pointer. */
function magnetic(): void {
    if (!isHoverDevice) return;
    document.querySelectorAll<HTMLElement>('.btn--signal').forEach((btn) => {
        const x = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3.out' });
        const y = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3.out' });
        btn.addEventListener('pointermove', (e) => {
            const r = btn.getBoundingClientRect();
            x((e.clientX - (r.left + r.width / 2)) * 0.18);
            y((e.clientY - (r.top + r.height / 2)) * 0.3);
        });
        btn.addEventListener('pointerleave', () => { x(0); y(0); });
    });
}

export function initMotion(): void {
    if (!document.querySelector('.hero')) return;
    labels();
    modules();
    track();
    rows();
    contact();
    heroLights();
    magnetic();
    // Fonts settling can shift section offsets; re-measure once they're in.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
