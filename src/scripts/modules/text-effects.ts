import { prefersReducedMotion } from './env';

/**
 * Walk the heading and wrap every word in <span class="word"><span
 * class="word-inner">…</span></span>. The inner span is what gets
 * translated up from below as the hero enters view. Each word picks up
 * a slightly later transition-delay so words enter in sequence.
 *
 * Rotator subtree is preserved verbatim , it manages its own animation.
 */
function splitDisplayHeading(target: HTMLElement): void {
    const walk = (node: Node, delay: { value: number }): Node[] => {
        const out: Node[] = [];
        node.childNodes.forEach((child) => {
            if (child.nodeType === Node.TEXT_NODE) {
                const tokens = (child.textContent ?? '').split(/(\s+)/);
                tokens.forEach((tok) => {
                    if (/^\s+$/.test(tok)) {
                        out.push(document.createTextNode(tok));
                    } else if (tok.length > 0) {
                        const word = document.createElement('span');
                        word.className = 'word';
                        const inner = document.createElement('span');
                        inner.className = 'word-inner';
                        inner.textContent = tok;
                        inner.style.transitionDelay = `${delay.value}s, ${delay.value}s`;
                        delay.value += 0.05;
                        word.appendChild(inner);
                        out.push(word);
                    }
                });
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                const el = child as HTMLElement;
                if (el.classList.contains('rotator')) {
                    out.push(el.cloneNode(true));
                    return;
                }
                const clone = el.cloneNode(false) as HTMLElement;
                walk(el, delay).forEach((c) => clone.appendChild(c));
                out.push(clone);
            } else {
                out.push(child.cloneNode(true));
            }
        });
        return out;
    };

    const replacement = walk(target, { value: 0.1 });
    target.innerHTML = '';
    replacement.forEach((n) => target.appendChild(n));
}

function initSplitText(): void {
    const target = document.querySelector<HTMLElement>('[data-split]');
    if (target) splitDisplayHeading(target);
}

/**
 * Cycle through the words listed in data-rotate on the rotator span,
 * driving the .is-in / .is-out classes that the CSS animates.
 */
function initRotator(): void {
    const rotator = document.querySelector<HTMLElement>('.rotator');
    if (!rotator) return;

    let words: string[] = [];
    try {
        words = JSON.parse(rotator.getAttribute('data-rotate') ?? '[]');
    } catch {
        words = [];
    }

    const wordEl = rotator.querySelector<HTMLElement>('.rotator__word');
    if (!wordEl || words.length < 2) return;

    let i = 0;
    rotator.classList.add('is-in');
    window.setInterval(() => {
        rotator.classList.remove('is-in');
        rotator.classList.add('is-out');
        window.setTimeout(() => {
            i = (i + 1) % words.length;
            wordEl.textContent = words[i];
            rotator.classList.remove('is-out');
            // Force reflow so the transition replays cleanly.
            void rotator.offsetWidth;
            rotator.classList.add('is-in');
        }, 380);
    }, 2600);
}

export function initTextEffects(): void {
    if (prefersReducedMotion) return;
    initSplitText();
    initRotator();
}
