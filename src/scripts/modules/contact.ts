/**
 * Email is split into data-user / data-domain attributes in markup
 * to make naive scraping a bit harder. We assemble it client-side on
 * first interaction.
 */
function readAddress(el: HTMLElement): string | null {
    const user = el.getAttribute('data-user');
    const domain = el.getAttribute('data-domain');
    return user && domain ? `${user}@${domain}` : null;
}

function fallbackCopy(text: string): void {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'absolute';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch { /* noop */ }
    document.body.removeChild(ta);
}

export function initContact(): void {
    const contactBtn  = document.getElementById('contact-btn')  as HTMLAnchorElement | null;
    const contactMail = document.getElementById('contact-mail') as HTMLAnchorElement | null;
    const copyBtn     = document.getElementById('copy-btn')     as HTMLButtonElement | null;

    // Mailto on the obfuscated anchors.
    [contactBtn, contactMail].forEach((el) => {
        el?.addEventListener('click', (e) => {
            e.preventDefault();
            const email = readAddress(el);
            if (email) window.location.href = `mailto:${email}`;
        });
    });

    // Copy-to-clipboard with success state.
    if (!copyBtn || !contactBtn) return;

    let resetTimer: number | undefined;
    copyBtn.addEventListener('click', async () => {
        const email = readAddress(contactBtn);
        if (!email) return;

        const label = copyBtn.querySelector<HTMLElement>('.copy-btn__label');
        const defaultText = label?.dataset.default ?? 'Copy address';
        const copiedText  = label?.dataset.copied  ?? 'Copied';

        try {
            await navigator.clipboard.writeText(email);
        } catch {
            fallbackCopy(email);
        }

        copyBtn.classList.add('is-copied');
        if (label) label.textContent = copiedText;
        if (resetTimer) window.clearTimeout(resetTimer);
        resetTimer = window.setTimeout(() => {
            copyBtn.classList.remove('is-copied');
            if (label) label.textContent = defaultText;
        }, 1800);
    });
}

export function initFooterYear(): void {
    const el = document.getElementById('footer-year');
    if (el) el.textContent = String(new Date().getFullYear());
}
