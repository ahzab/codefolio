/**
 * Header live clock: Brussels time, HH:MM, ticks aligned to the minute
 * boundary so we don't drift by ~30s on average.
 */
export function initHeaderClock(): void {
    const el = document.getElementById('header-clock');
    if (!el) return;

    const fmt = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Brussels',
        hour12: false,
    });

    const tick = () => { el.textContent = fmt.format(new Date()); };

    tick();
    const msToNextMinute = 60_000 - (Date.now() % 60_000);
    window.setTimeout(() => {
        tick();
        window.setInterval(tick, 60_000);
    }, msToNextMinute);
}
