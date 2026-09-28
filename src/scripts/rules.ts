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

/** Fades the bottom of the rule list while more rules are hidden below. */
function scrollHint(list: HTMLElement | null) {
  if (!list) return;
  const update = () => {
    const scrollable = list.scrollHeight > list.clientHeight + 2;
    list.classList.toggle('is-scrollable', scrollable);
    list.classList.toggle('at-end', !scrollable || list.scrollTop + list.clientHeight >= list.scrollHeight - 4);
  };
  list.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
}

export function initRules(reducedMotion: () => boolean) {
  const gate = document.querySelector<HTMLElement>('[data-rules-gate]');
  if (!gate || !root.classList.contains('rules-pending')) return;
  const version = root.dataset.rulesVersion ?? '';
  const button = gate.querySelector<HTMLButtonElement>('[data-accept-rules]')!;
  const accept = () => {
    remember(version);
    root.classList.remove('rules-pending');
  };

  // Every page except home and the pages readable before accepting: a dialog
  // that can only be closed by accepting.
  if (gate.tagName === 'DIALOG') {
    const dialog = gate as HTMLDialogElement;
    // Browsers without <dialog> support (Safari before 15.4) skip the checkpoint
    // rather than lock the page.
    if (typeof dialog.showModal !== 'function') return accept();
    dialog.addEventListener('cancel', (event) => event.preventDefault());
    // Some browsers let a second Escape close the dialog anyway; reopen it
    // until the rules are accepted.
    dialog.addEventListener('close', () => {
      if (root.classList.contains('rules-pending')) dialog.showModal();
    });
    dialog.showModal();
    // Start at the title, not scrolled down to the button.
    dialog.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
    dialog.scrollTop = 0;
    scrollHint(dialog.querySelector<HTMLElement>('.rules'));
    button.addEventListener('click', () => {
      accept();
      dialog.close();
    });
    return;
  }

  // Home: the checkpoint sits between the hero and the agenda.
  const locked = document.querySelector<HTMLElement>('[data-gated]');
  if (locked) locked.inert = true;
  const label = button.querySelector('span')!;
  const defaultLabel = label.textContent;
  const places: Record<string, string> = JSON.parse(button.dataset.places ?? '{}');
  let destination: string | undefined;
  const setDestination = (id: string) => {
    destination = id;
    // Say where accepting leads, e.g. "Entendido: ver cómo llegar".
    const place = places[id] ?? places[id.split('-')[0]];
    label.textContent = place && button.dataset.acceptTo ? button.dataset.acceptTo.replace('{place}', place) : defaultLabel;
  };
  const lockedTarget = (id: string) => {
    const element = id ? document.getElementById(id) : null;
    return element && locked?.contains(element) ? element : null;
  };
  const heading = gate.querySelector<HTMLElement>('h2');
  const showGate = () => {
    gate.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'instant' : 'smooth' });
    // Move keyboard and screen reader focus along with the scroll.
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  };

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
      setDestination(id);
      showGate();
    },
    true,
  );

  // Arriving with a link to a locked section, e.g. /#artistas.
  const initial = decodeURIComponent(location.hash.slice(1));
  if (lockedTarget(initial)) {
    setDestination(initial);
    history.replaceState(null, '', location.pathname + location.search);
    window.addEventListener('load', () => requestAnimationFrame(showGate), { once: true });
  }

  // Typing or following a fragment while locked, e.g. editing the URL to /#reglas.
  window.addEventListener('hashchange', () => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!root.classList.contains('rules-pending') || !lockedTarget(id)) return;
    setDestination(id);
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
        const targetHeading = target.querySelector<HTMLElement>('h2, h3');
        if (targetHeading) {
          targetHeading.tabIndex = -1;
          targetHeading.focus({ preventScroll: true });
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
