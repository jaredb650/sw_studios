// Rules checkpoint. The <head> script in Base.astro adds `rules-pending` to
// <html> before first paint when the rules haven't been accepted in this
// visit; CSS then locks everything after the home page checkpoint. Accepting
// is kept in sessionStorage, so it carries across pages during the visit but
// a reload or a new visit asks again.

const KEY = 'shipwreck-rules';
const root = document.documentElement;

function remember(version: string) {
  try {
    sessionStorage.setItem(KEY, version);
  } catch {
    /* Storage unavailable: accepted for this page view only. */
  }
}

export function initRules(reducedMotion: () => boolean) {
  const gate = document.querySelector<HTMLElement>('[data-rules-gate]');
  if (!gate || !root.classList.contains('rules-pending')) return;
  const version = root.dataset.rulesVersion ?? '';
  const button = gate.querySelector<HTMLButtonElement>('[data-accept-rules]')!;

  // Every page except home: a dialog that can only be closed by accepting.
  if (gate instanceof HTMLDialogElement) {
    gate.addEventListener('cancel', (event) => event.preventDefault());
    gate.showModal();
    // Start at the title, not scrolled down to the button.
    gate.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
    gate.scrollTop = 0;
    button.addEventListener('click', () => {
      remember(version);
      root.classList.remove('rules-pending');
      gate.close();
    });
    return;
  }

  // Home: the checkpoint sits between the hero and the agenda.
  const locked = document.querySelector<HTMLElement>('[data-gated]');
  if (locked) locked.inert = true;
  let destination: string | undefined;
  const lockedTarget = (id: string) => {
    const element = id ? document.getElementById(id) : null;
    return element && locked?.contains(element) ? element : null;
  };
  const showGate = () => gate.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'instant' : 'smooth' });

  // A link to a locked section (nav, "Explora la agenda") leads to the checkpoint
  // first, and to the section once the rules are accepted.
  document.addEventListener(
    'click',
    (event) => {
      if (!root.classList.contains('rules-pending')) return;
      const link = (event.target as Element).closest<HTMLAnchorElement>('a[href*="#"]');
      if (!link) return;
      const url = new URL(link.href);
      if (url.pathname !== location.pathname) return;
      const id = decodeURIComponent(url.hash.slice(1));
      if (!lockedTarget(id)) return;
      event.preventDefault();
      destination = id;
      showGate();
    },
    true,
  );

  // Arriving with a link to a locked section, e.g. /#artistas.
  const initial = decodeURIComponent(location.hash.slice(1));
  if (lockedTarget(initial)) {
    destination = initial;
    history.replaceState(null, '', location.pathname + location.search);
    window.addEventListener('load', () => requestAnimationFrame(showGate), { once: true });
  }

  // Typing or following a fragment while locked, e.g. editing the URL to /#reglas.
  window.addEventListener('hashchange', () => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!root.classList.contains('rules-pending') || !lockedTarget(id)) return;
    destination = id;
    history.replaceState(null, '', location.pathname + location.search);
    showGate();
  });

  button.addEventListener('click', () => {
    remember(version);
    const open = () => {
      root.classList.remove('rules-pending');
      if (locked) locked.inert = false;
      gate.hidden = true;
      const target = document.getElementById(destination ?? 'agenda');
      if (target) {
        target.scrollIntoView({ block: 'start', behavior: 'instant' });
        const heading = target.querySelector<HTMLElement>('h2');
        if (heading) {
          heading.tabIndex = -1;
          heading.focus({ preventScroll: true });
        }
      }
      if (destination) history.replaceState(null, '', `#${destination}`);
      window.dispatchEvent(new Event('scroll'));
    };
    if (reducedMotion()) return open();
    gate.classList.add('is-leaving');
    setTimeout(open, 380);
  });
}
