// Mobile nav: toggle the hamburger menu, close it on link click, Escape, or resize to desktop.
export function initMobileNav(): void {
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('mobile-nav');
  if (!toggle || !menu) return;

  const setOpen = (open: boolean): void => {
    toggle.setAttribute('aria-expanded', String(open));
    if (open) menu.removeAttribute('hidden');
    else menu.setAttribute('hidden', '');
  };

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      (toggle as HTMLElement).focus();
    }
  });

  // If the viewport grows to desktop, make sure the panel is closed/reset.
  const mq = window.matchMedia('(min-width: 768px)');
  mq.addEventListener('change', (e) => {
    if (e.matches) setOpen(false);
  });
}
