/**
 * Human / Machine view switch. A floating pill flips the homepage between the
 * designed page and a plain key/value readout of the same facts, the way a
 * crawler or an LLM would want them. The machine view is read from the live
 * DOM at switch time, so it can never drift from the human page.
 *
 * The choice sticks per browser (localStorage) and ?view=machine opens it
 * directly. No JS, no pill: the page is simply the human view.
 */
type Row = [key: string, value: string];
type Section = { title: string; rows: Row[] };

const STORAGE_KEY = 'codefolio_view';
const ORIGIN = 'https://www.codefolio.dev';

const clean = (s: string | null | undefined): string =>
    (s || '').replace(/[↗→⧉]/g, '').replace(/\s+/g, ' ').trim();

const text = (root: ParentNode, sel: string): string => clean(root.querySelector(sel)?.textContent);

const slugKey = (s: string): string =>
    clean(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const absolute = (href: string): string => new URL(href, ORIGIN).href.replace(/\.html$/, '');

function collect(): Section[] {
    const sections: Section[] = [];

    const contactLink = document.querySelector<HTMLElement>('#contact-btn');
    const email = contactLink ? `${contactLink.dataset.user}@${contactLink.dataset.domain}` : '';
    sections.push({
        title: 'operator',
        rows: [
            ['name', 'Abdel Ahzab'],
            ['role', 'Senior Full-Stack Engineer'],
            ['location', `Rabat, Morocco (${text(document, '.site-footer span:nth-child(2)')})`],
            ['languages', 'English, French, Arabic'],
            ['status', text(document, '.statusbar__status')],
            ['summary', `${text(document, '.hero__lede')} ${text(document, '.hero__sub')}`],
            ...(email ? [['email', email] as Row] : []),
        ],
    });

    sections.push({
        title: 'readout',
        rows: Array.from(document.querySelectorAll('.readout__cell')).map((cell) => [
            slugKey(text(cell, 'dt')),
            String(Number((cell.querySelector<HTMLElement>('[data-count]')?.dataset.count) || text(cell, 'dd'))),
        ]),
    });

    document.querySelectorAll('.module').forEach((mod) => {
        const links = Array.from(mod.querySelectorAll<HTMLAnchorElement>('.module__link'));
        sections.push({
            title: `module · ${text(mod, '.module__title')}`,
            rows: [
                ['state', text(mod, '.module__state')],
                ['summary', text(mod, '.module__text')],
                ['stack', text(mod, '.module__body > .lbl')],
                ...links.map((a): Row => [slugKey(a.textContent || 'link'), a.href]),
            ],
        });
    });

    sections.push({
        title: 'experience',
        rows: [
            ...Array.from(document.querySelectorAll('.track__stage')).map((stage): Row => [
                slugKey(text(stage, '.track__stage-no')),
                `${text(stage, '.track__name').replace(/· Now$/, '(now)')}. ${text(stage, '.track__text')} [${text(stage, '.track__content > .lbl:last-child')}]`,
            ]),
            ...Array.from(document.querySelectorAll('.track__earlier')).map((block): Row => [
                slugKey(text(block, ':scope > .lbl')),
                `${text(block, '.track__name')}. ${text(block, '.track__text')}`,
            ]),
        ],
    });

    sections.push({
        title: 'capabilities',
        rows: Array.from(document.querySelectorAll('.spec__row')).map((row): Row => [
            slugKey(text(row, 'dt')),
            text(row, 'dd'),
        ]),
    });

    sections.push({
        title: 'writing',
        rows: Array.from(document.querySelectorAll<HTMLAnchorElement>('.note-row')).map((a): Row => [
            text(a, '.lbl'),
            `${text(a, '.note-row__title')} ${absolute(a.getAttribute('href') || '')}`,
        ]),
    });

    sections.push({
        title: 'links',
        rows: Array.from(document.querySelectorAll<HTMLAnchorElement>('.socials a')).map((a): Row => [
            slugKey(a.textContent || ''),
            a.href,
        ]),
    });

    return sections.filter((s) => s.rows.length);
}

function toPlainText(sections: Section[]): string {
    const lines = ['codefolio.dev', ''];
    sections.forEach((s) => {
        const width = Math.max(...s.rows.map(([k]) => k.length)) + 2;
        lines.push(`# ${s.title}`);
        s.rows.forEach(([k, v]) => lines.push(k.padEnd(width) + v));
        lines.push('');
    });
    return lines.join('\n');
}

function render(panel: HTMLElement, sections: Section[]): void {
    const body = panel.querySelector('.machine__body')!;
    let line = 0;
    body.replaceChildren(
        ...sections.map((s) => {
            const block = document.createElement('section');
            block.className = 'machine__section';
            const h = document.createElement('h2');
            h.className = 'machine__title';
            h.textContent = `# ${s.title}`;
            h.style.setProperty('--line', String(line++));
            const dl = document.createElement('dl');
            dl.className = 'machine__rows';
            s.rows.forEach(([k, v]) => {
                const dt = document.createElement('dt');
                dt.textContent = k;
                const dd = document.createElement('dd');
                if (/^https?:\/\/\S+$/.test(v) || /^\S+@\S+$/.test(v)) {
                    const a = document.createElement('a');
                    a.href = v.includes('@') && !v.startsWith('http') ? `mailto:${v}` : v;
                    a.textContent = v;
                    dd.append(a);
                } else {
                    dd.textContent = v;
                }
                dt.style.setProperty('--line', String(line));
                dd.style.setProperty('--line', String(line++));
                dl.append(dt, dd);
            });
            block.append(h, dl);
            return block;
        })
    );
}

function buildPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.id = 'machine-view';
    panel.className = 'machine';
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-label', 'Machine view');
    panel.hidden = true;
    panel.innerHTML =
        '<div class="machine__inner">' +
        '<div class="machine__head"><span class="machine__id">codefolio.dev</span>' +
        '<button type="button" class="machine__copy" data-default="Copy as text" data-copied="Copied">Copy as text</button></div>' +
        '<div class="machine__body"></div>' +
        '</div>';
    return panel;
}

function buildSwitch(): HTMLElement {
    const pill = document.createElement('div');
    pill.className = 'viewswitch';
    pill.setAttribute('role', 'group');
    pill.setAttribute('aria-label', 'Page view');
    pill.innerHTML =
        '<span class="viewswitch__lbl" aria-hidden="true">View</span>' +
        '<span class="viewswitch__track">' +
        '<span class="viewswitch__thumb" aria-hidden="true"></span>' +
        '<button type="button" class="viewswitch__opt" data-view="human" aria-pressed="true"><span class="viewswitch__dot" aria-hidden="true"></span>Human</button>' +
        '<button type="button" class="viewswitch__opt" data-view="machine" aria-pressed="false" aria-controls="machine-view"><span class="viewswitch__dot" aria-hidden="true"></span>Machine</button>' +
        '</span>';
    return pill;
}

export function initMachineView(): void {
    const page = [document.querySelector('.site-top'), document.getElementById('main')].filter(
        (el): el is HTMLElement => !!el
    );
    if (!document.querySelector('.hero') || !page.length) return;

    const panel = buildPanel();
    const pill = buildSwitch();
    document.body.append(panel, pill);

    let plain = '';

    // The thumb slides under whichever option is pressed; the two labels differ in width.
    const thumb = pill.querySelector<HTMLElement>('.viewswitch__thumb')!;
    const moveThumb = (): void => {
        const on = pill.querySelector<HTMLElement>('[aria-pressed="true"]');
        if (!on) return;
        thumb.style.width = `${on.offsetWidth}px`;
        thumb.style.transform = `translateX(${on.offsetLeft}px)`;
    };
    moveThumb();
    window.addEventListener('resize', moveThumb);
    document.fonts?.ready.then(moveThumb);

    const set = (view: 'human' | 'machine', persist = true): void => {
        const machine = view === 'machine';
        if (machine) {
            const sections = collect();
            render(panel, sections);
            plain = toPlainText(sections);
            panel.scrollTop = 0;
        }
        panel.hidden = !machine;
        document.documentElement.classList.toggle('is-machine', machine);
        page.forEach((el) => el.toggleAttribute('inert', machine));
        pill.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((b) =>
            b.setAttribute('aria-pressed', String(b.dataset.view === view))
        );
        moveThumb();
        if (!persist) return;
        try {
            if (machine) localStorage.setItem(STORAGE_KEY, 'machine');
            else localStorage.removeItem(STORAGE_KEY);
        } catch { /* storage blocked */ }
        (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag?.('event', 'view_switch', { view });
    };

    pill.addEventListener('click', (e) => {
        const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-view]');
        if (btn) set(btn.dataset.view === 'machine' ? 'machine' : 'human');
    });

    // Escape goes back to the page; M flips the view from anywhere.
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !panel.hidden) set('human');
        if ((e.key === 'm' || e.key === 'M') && !e.metaKey && !e.ctrlKey && !e.altKey) {
            const t = e.target as HTMLElement;
            if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
            set(panel.hidden ? 'machine' : 'human');
        }
    });

    const copy = panel.querySelector<HTMLButtonElement>('.machine__copy')!;
    copy.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(plain);
            copy.textContent = copy.dataset.copied || 'Copied';
            window.setTimeout(() => { copy.textContent = copy.dataset.default || 'Copy as text'; }, 1600);
        } catch { /* clipboard blocked */ }
    });

    let initial: string | null = new URLSearchParams(location.search).get('view');
    if (!initial) {
        try { initial = localStorage.getItem(STORAGE_KEY); } catch { /* storage blocked */ }
    }
    if (initial === 'machine') set('machine', false);
}
