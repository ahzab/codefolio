/**
 * Status-bar clock: Rabat time, HH:MM, ticking on the minute boundary so it
 * never drifts. The offset label is read from the zone itself, because
 * Morocco moves between UTC+1 and UTC+0 around Ramadan and a hard-coded
 * "UTC+1" would be wrong for a month a year.
 */
const ZONE = 'Africa/Casablanca';

export function initHeaderClock(): void {
    const el = document.getElementById('header-clock');
    if (!el) return;
    const offsetEl = document.getElementById('header-offset');

    const fmt = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: ZONE,
        hour12: false,
    });

    const offset = (): string | null => {
        try {
            const part = new Intl.DateTimeFormat('en-US', { timeZone: ZONE, timeZoneName: 'shortOffset' })
                .formatToParts(new Date())
                .find((p) => p.type === 'timeZoneName');
            return part ? part.value.replace('GMT', 'UTC') : null;
        } catch {
            return null;
        }
    };

    const tick = () => {
        el.textContent = fmt.format(new Date());
        const o = offset();
        if (offsetEl && o) offsetEl.textContent = o === 'UTC' ? 'UTC+0' : o;
    };

    tick();
    const msToNextMinute = 60_000 - (Date.now() % 60_000);
    window.setTimeout(() => {
        tick();
        window.setInterval(tick, 60_000);
    }, msToNextMinute);
}
