type Theme = 'light' | 'dark' | 'system';

export function initTheme(): void {
    const toggle = document.querySelector<HTMLElement>('.theme-toggle');
    const buttons: Record<Theme, HTMLButtonElement | null> = {
        light: document.getElementById('btn-light') as HTMLButtonElement | null,
        dark: document.getElementById('btn-dark') as HTMLButtonElement | null,
        system: document.getElementById('btn-system') as HTMLButtonElement | null,
    };

    const apply = (theme: Theme) => {
        const isDark =
            theme === 'dark' ||
            (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement.classList.toggle('dark', isDark);
        localStorage.setItem('theme', theme);

        (Object.entries(buttons) as [Theme, HTMLButtonElement | null][]).forEach(([t, btn]) => {
            btn?.setAttribute('aria-pressed', String(t === theme));
        });

        toggle?.setAttribute('data-active', theme);

        const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
        if (meta) meta.content = isDark ? '#0a0a0d' : '#f4efe4';
    };

    const stored = (localStorage.getItem('theme') as Theme | null) ?? 'system';
    apply(stored);

    buttons.light?.addEventListener('click', () => apply('light'));
    buttons.dark?.addEventListener('click', () => apply('dark'));
    buttons.system?.addEventListener('click', () => apply('system'));

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if ((localStorage.getItem('theme') as Theme | null) === 'system') {
            apply('system');
        }
    });
}
