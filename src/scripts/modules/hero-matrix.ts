import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * The hero name as a live dot matrix. Doto draws every letter from separate
 * square dots, so after first paint we rasterise the name off-screen, find
 * each dot (connected components), and redraw them on a canvas as particles
 * sitting exactly where the text was. The text itself stays in the DOM (SEO,
 * selection, screen readers) and only turns transparent.
 *
 *  - a red scan passes over the name once it goes live
 *  - the pointer (or a dragging finger) pushes dots away and heats them red
 *  - a click / tap sends a shockwave out from that point
 *  - scrolling the hero away dissolves the name upward into drifting data
 *  - now and then a single dot glitches, so it reads as a running instrument
 *
 * The loop sleeps when nothing moves, and stops when the hero is off screen.
 */
type Dot = {
    hx: number; hy: number; w: number; h: number;   // home (CSS px, canvas space)
    x: number; y: number; vx: number; vy: number;   // live position + velocity
    heat: number;                                   // 0 white … 1 signal red
    sx: number; sy: number; spin: number;           // scatter vector for the scroll dissolve
};

const SIGNAL = [255, 59, 48];
const INK = [237, 237, 237];
const PAD = 160; // canvas bleed around the name, room for dots to fly

function findDots(name: HTMLElement): Dot[] {
    const box = name.getBoundingClientRect();
    // Rasterise at a large size: on a phone the gaps between Doto's dots are
    // under a pixel and would merge the dots into blocks.
    const fontSize = parseFloat(getComputedStyle(name).fontSize) || 100;
    const k = Math.max(1, 280 / fontSize);
    const w = Math.ceil(box.width * k);
    const h = Math.ceil(box.height * k);
    if (!w || !h) return [];

    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    const ctx = off.getContext('2d', { willReadFrequently: true });
    if (!ctx) return [];
    ctx.scale(k, k);

    // Draw each line exactly where CSS put it: same face, size, tracking, and
    // the baseline from the half-leading model CSS uses for a line box.
    name.querySelectorAll<HTMLElement>(':scope > span').forEach((line) => {
        const cs = getComputedStyle(line);
        const r = line.getBoundingClientRect();
        ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        if ('letterSpacing' in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#fff';
        const m = ctx.measureText(line.textContent || '');
        const lineH = parseFloat(cs.lineHeight) || r.height;
        const content = m.fontBoundingBoxAscent + m.fontBoundingBoxDescent;
        const baseline = r.top - box.top + (lineH - content) / 2 + m.fontBoundingBoxAscent;
        ctx.fillText(line.textContent || '', r.left - box.left, baseline);
    });

    // Connected components over the alpha channel: one component = one dot.
    const { data } = ctx.getImageData(0, 0, w, h);
    const seen = new Uint8Array(w * h);
    const stack: number[] = [];
    const dots: Dot[] = [];
    for (let i = 0; i < w * h; i++) {
        if (seen[i] || data[i * 4 + 3] < 128) continue;
        let minX = w, minY = h, maxX = 0, maxY = 0, area = 0;
        stack.push(i);
        seen[i] = 1;
        while (stack.length) {
            const p = stack.pop()!;
            const px = p % w, py = (p - px) / w;
            area++;
            if (px < minX) minX = px; if (px > maxX) maxX = px;
            if (py < minY) minY = py; if (py > maxY) maxY = py;
            const n = [p - 1, p + 1, p - w, p + w];
            for (let k = 0; k < 4; k++) {
                const q = n[k];
                if (q < 0 || q >= w * h || seen[q]) continue;
                if ((k === 0 && px === 0) || (k === 1 && px === w - 1)) continue;
                if (data[q * 4 + 3] < 128) continue;
                seen[q] = 1;
                stack.push(q);
            }
        }
        if (area < 6 * k * k) continue;
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
        const dist = 120 + Math.random() * 420;
        const hx = minX / k + PAD, hy = minY / k + PAD;
        dots.push({
            hx, hy, w: (maxX - minX + 1) / k, h: (maxY - minY + 1) / k,
            x: hx, y: hy, vx: 0, vy: 0, heat: 0,
            sx: Math.cos(angle) * dist, sy: Math.sin(angle) * dist, spin: (Math.random() - 0.5) * 2,
        });
    }
    return dots;
}

export function initHeroMatrix(): void {
    const hero = document.querySelector<HTMLElement>('.hero');
    const name = document.querySelector<HTMLElement>('.hero__name');
    if (!hero || !name) return;
    // Only with the real dot face loaded; a fallback font has no dots to find.
    if (document.fonts && !document.fonts.check('900 40px Doto')) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'hero__matrix';
    canvas.setAttribute('aria-hidden', 'true');
    hero.append(canvas);
    const ctx = canvas.getContext('2d')!;

    let dots: Dot[] = [];
    let ox = 0, oy = 0;             // canvas origin inside .hero
    let pointer = { x: -9999, y: -9999, active: false };
    let dissolve = 0;               // 0 … 1, scrubbed by scroll
    let running = false;
    let visible = true;
    let sweep = -1;                 // scan line x while the intro runs

    const layout = (): void => {
        const fresh = findDots(name);
        if (!fresh.length) return;
        // Keep heat/positions across a resize where the dot count matches.
        if (dots.length === fresh.length) fresh.forEach((d, i) => { d.heat = dots[i].heat; });
        dots = fresh;
        const hb = hero.getBoundingClientRect();
        const nb = name.getBoundingClientRect();
        ox = nb.left - hb.left - PAD;
        oy = nb.top - hb.top - PAD;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const cw = nb.width + PAD * 2, ch = nb.height + PAD * 2;
        canvas.width = Math.round(cw * dpr);
        canvas.height = Math.round(ch * dpr);
        canvas.style.width = `${cw}px`;
        canvas.style.height = `${ch}px`;
        canvas.style.left = `${ox}px`;
        canvas.style.top = `${oy}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        name.classList.add('is-matrix');
        wake();
    };

    const draw = (): void => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const ease = dissolve * dissolve * (3 - 2 * dissolve);
        const alpha = 1 - ease * 0.9;
        for (const d of dots) {
            const t = Math.min(1, d.heat);
            const r = INK[0] + (SIGNAL[0] - INK[0]) * t;
            const g = INK[1] + (SIGNAL[1] - INK[1]) * t;
            const b = INK[2] + (SIGNAL[2] - INK[2]) * t;
            ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${alpha})`;
            if (ease > 0.01) {
                // Dissolving dots shrink and tilt as they drift off.
                const s = 1 - ease * 0.55;
                ctx.save();
                ctx.translate(d.x + d.w / 2, d.y + d.h / 2);
                ctx.rotate(d.spin * ease);
                ctx.fillRect((-d.w / 2) * s, (-d.h / 2) * s, d.w * s, d.h * s);
                ctx.restore();
            } else {
                ctx.fillRect(d.x, d.y, d.w, d.h);
            }
        }
        if (sweep >= 0) {
            const grad = ctx.createLinearGradient(sweep - 60, 0, sweep, 0);
            grad.addColorStop(0, 'rgba(255,59,48,0)');
            grad.addColorStop(1, 'rgba(255,59,48,0.55)');
            ctx.fillStyle = grad;
            ctx.fillRect(sweep - 60, PAD - 20, 60, canvas.height / (ctx.getTransform().a || 1) - PAD * 2 + 40);
            ctx.fillStyle = 'rgba(255,59,48,0.9)';
            ctx.fillRect(sweep, PAD - 20, 1, canvas.height / (ctx.getTransform().a || 1) - PAD * 2 + 40);
        }
    };

    const R = Math.min(140, window.innerWidth * 0.22);
    const step = (): void => {
        const ease = dissolve * dissolve * (3 - 2 * dissolve);
        let energy = 0;
        for (const d of dots) {
            let tx = d.hx + d.sx * ease;
            let ty = d.hy + d.sy * ease;
            if (pointer.active && ease < 0.5) {
                const dx = d.hx + d.w / 2 - pointer.x;
                const dy = d.hy + d.h / 2 - pointer.y;
                const dist = Math.hypot(dx, dy);
                if (dist < R) {
                    const f = (1 - dist / R) ** 2;
                    tx += (dx / (dist || 1)) * f * 70;
                    ty += (dy / (dist || 1)) * f * 70;
                    d.heat = Math.max(d.heat, f * 1.4);
                }
            }
            if (sweep >= 0 && Math.abs(d.hx + d.w / 2 - sweep) < 18) {
                d.heat = 1;
                d.vy -= 1.6;
            }
            d.vx += (tx - d.x) * 0.12;
            d.vy += (ty - d.y) * 0.12;
            d.vx *= 0.74;
            d.vy *= 0.74;
            d.x += d.vx;
            d.y += d.vy;
            d.heat *= 0.955;
            energy += Math.abs(d.vx) + Math.abs(d.vy) + d.heat + Math.abs(tx - d.x) * 0.1;
        }
        draw();
        if (energy < 0.05 * dots.length / 10 && !pointer.active && sweep < 0) sleep();
    };

    const wake = (): void => {
        if (running || !visible) return;
        running = true;
        gsap.ticker.add(step);
    };
    const sleep = (): void => {
        if (!running) return;
        running = false;
        gsap.ticker.remove(step);
        draw();
    };

    const local = (e: PointerEvent) => {
        const r = canvas.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    hero.addEventListener('pointermove', (e) => {
        pointer = { ...local(e), active: true };
        wake();
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { pointer.active = false; });
    hero.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') pointer.active = false; });
    hero.addEventListener('pointercancel', () => { pointer.active = false; });

    // Shockwave from the click point.
    hero.addEventListener('pointerdown', (e) => {
        if ((e.target as HTMLElement).closest('a, button')) return;
        const p = local(e);
        // The shockwave scales with the name, so a phone gets a ripple, not an explosion.
        const nameW = name.getBoundingClientRect().width;
        const reach = Math.min(520, nameW * 0.6);
        const kick = Math.min(38, nameW / 24);
        for (const d of dots) {
            const dx = d.hx + d.w / 2 - p.x;
            const dy = d.hy + d.h / 2 - p.y;
            const dist = Math.hypot(dx, dy) || 1;
            const f = Math.max(0, 1 - dist / reach);
            d.vx += (dx / dist) * f * kick;
            d.vy += (dy / dist) * f * kick;
            d.heat = Math.max(d.heat, f * 1.2);
        }
        wake();
    });

    // Dissolve from the first pixel of scroll until the hero has left the screen.
    ScrollTrigger.create({
        trigger: hero,
        start: () => `top ${hero.offsetTop}px`,
        end: 'bottom top',
        onUpdate: (self) => { dissolve = self.progress; wake(); },
    });
    new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) wake(); else sleep();
    }).observe(hero);

    // A single dot glitches now and then.
    window.setInterval(() => {
        if (!visible || !dots.length || document.hidden) return;
        const d = dots[(Math.random() * dots.length) | 0];
        d.heat = 1;
        d.vx += (Math.random() - 0.5) * 10;
        wake();
    }, 2600);

    let resizeTimer = 0;
    window.addEventListener('resize', () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(layout, 150);
    });

    layout();

    // Power-on scan across the name.
    const width = canvas.width / (Math.min(window.devicePixelRatio || 1, 2));
    const scan = { x: PAD - 40 };
    gsap.to(scan, {
        x: width - PAD + 40,
        duration: 1.3,
        delay: 0.2,
        ease: 'power2.inOut',
        onStart: wake,
        onUpdate: () => { sweep = scan.x; wake(); },
        onComplete: () => { sweep = -1; },
    });
}
