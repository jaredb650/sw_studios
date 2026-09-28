// Site-wide behavior: mobile menu, motion preference, scroll effects, the
// once-per-session logo intro on the home page, and event-row helpers.
import { initAgenda } from './agenda';
import { initRules } from './rules';
import { strings } from './strings';
import { initTypewriter } from './typewriter';

const root = document.documentElement;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const read = (key: string) => {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
};
const save = (key: string, value: string) => {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* Storage is optional. */
  }
};
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

let paused = reduced.matches || read('shipwreck-motion') === 'paused';

/* Mobile menu */
const header = document.querySelector<HTMLElement>('.site-header');
const menuButton = document.querySelector<HTMLButtonElement>('.menu-button');
const menu = document.getElementById('menu');
function setMenu(open: boolean) {
  if (!menuButton || !menu) return;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.querySelector('.menu-label')!.textContent = (open ? menuButton.dataset.openLabel : menuButton.dataset.closedLabel) ?? '';
  // The menu is fixed to the viewport; start its links below wherever the
  // header currently sits (the preview banner can push it down).
  menu.style.paddingTop = open && header ? `${Math.round(header.getBoundingClientRect().bottom) + 24}px` : '';
  root.toggleAttribute('data-menu-open', open);
  // While the menu covers the page, the page behind it can't be reached with
  // Tab or a screen reader.
  document.querySelectorAll<HTMLElement>('main, .site-footer, .sample-banner, .skip').forEach((element) => (element.inert = open));
  // Focus the first link once the menu has become visible (it fades in).
  if (open) setTimeout(() => menu.querySelector<HTMLElement>('a')?.focus(), 60);
}
menuButton?.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
menu?.addEventListener('click', (event) => {
  if ((event.target as Element).closest('a')) setMenu(false);
});

// "Inicio" returns to the very top of the page rather than the hero's anchor offset.
document.addEventListener('click', (event) => {
  const link = (event.target as Element).closest<HTMLAnchorElement>('a[href="#inicio"]');
  if (!link) return;
  event.preventDefault();
  window.scrollTo({ top: 0, behavior: paused ? 'auto' : 'smooth' });
  history.replaceState(null, '', location.pathname + location.search);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && root.hasAttribute('data-menu-open')) {
    setMenu(false);
    menuButton?.focus();
  }
});
window.matchMedia('(min-width: 961px)').addEventListener('change', (event) => event.matches && setMenu(false));

/* Scroll-linked effects */
const hero = document.querySelector<HTMLElement>('.masthead');
const ribbon = document.querySelector<HTMLElement>('.type-ribbon');
const about = document.querySelector<HTMLElement>('.about');
const poster = document.querySelector<HTMLElement>('.featured .poster');
const featured = document.querySelector<HTMLElement>('.featured');
const culture = [...document.querySelectorAll<HTMLElement>('.culture-line')];
let frame = 0;

/* On the home page, highlight the nav item for the section in view. */
const spyLinks = document.body.dataset.page === 'home' ? [...document.querySelectorAll<HTMLAnchorElement>('.site-nav a[data-section]')] : [];
const spySections = spyLinks
  .map((link) => document.getElementById(link.dataset.section!))
  .filter((section): section is HTMLElement => Boolean(section));
function spy() {
  if (!spySections.length) return;
  // While the rules checkpoint is up, only the sections above it (hero, El espacio) count.
  const locked = root.classList.contains('rules-pending') ? document.querySelector('[data-gated]') : null;
  const visible = locked ? spySections.filter((section) => !locked.contains(section)) : spySections;
  const line = (header?.getBoundingClientRect().bottom ?? 0) + window.innerHeight * 0.25;
  let current = visible[0].id;
  for (const section of visible) if (section.getBoundingClientRect().top <= line) current = section.id;
  if (!locked && window.innerHeight + window.scrollY >= root.scrollHeight - 4) current = visible.at(-1)!.id;
  for (const link of spyLinks) {
    if (link.dataset.section === current) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  }
}

function update() {
  frame = 0;
  const y = window.scrollY;
  const vh = window.innerHeight;
  const scrollable = root.scrollHeight - vh;
  root.style.setProperty('--scroll-progress', String(scrollable > 0 ? clamp(y / scrollable, 0, 1) : 0));
  header?.classList.toggle('is-scrolled', y > 30);
  spy();
  if (paused || document.hidden) return;
  const hr = hero?.getBoundingClientRect();
  if (hero && hr && hr.bottom > 0) hero.style.setProperty('--title-drift', `${clamp(-hr.top / hr.height, 0, 1) * -28}px`);
  const rr = ribbon?.getBoundingClientRect();
  if (ribbon && rr && rr.top < vh && rr.bottom > 0) {
    ribbon.style.setProperty('--ribbon-x', `${-50 - clamp((vh - rr.top) / (vh + rr.height), 0, 1) * 260}px`);
  }
  const ar = about?.getBoundingClientRect();
  if (about && ar && ar.top < vh && ar.bottom > 0) {
    const progress = clamp((vh - ar.top) / (vh + ar.height), 0, 1);
    about.style.setProperty('--about-turn', `${-12 + progress * 24}deg`);
    culture.forEach((line, i) => line.style.setProperty('--culture-x', `${(progress - 0.5) * (i === 1 ? -30 : 24)}px`));
  }
  if (poster && featured && window.innerWidth > 680) {
    const pr = featured.getBoundingClientRect();
    if (pr.top < vh && pr.bottom > 0) poster.style.setProperty('--poster-y', `${clamp((vh * 0.3 - pr.top) * 0.045, -14, 24)}px`);
  }
}
const requestUpdate = () => {
  if (!frame) frame = requestAnimationFrame(update);
};

/* Motion toggles: one in the footer, one in the home hero (reachable while the
   rules checkpoint is up). The visible label says what pressing it will do. */
const toggles = [...document.querySelectorAll<HTMLButtonElement>('.motion-toggle')];
function applyMotion() {
  root.classList.toggle('motion-paused', paused);
  root.classList.toggle('motion-enabled', !paused);
  for (const toggle of toggles) {
    toggle.hidden = false;
    const label = toggle.querySelector('[data-label]') ?? toggle;
    label.textContent = (paused ? toggle.dataset.playLabel : toggle.dataset.pauseLabel) ?? label.textContent;
    toggle.classList.toggle('is-paused', paused);
  }
  if (paused) finishLoader();
  // The hero video follows the motion setting too.
  document.querySelectorAll<HTMLVideoElement>('video[data-hero-video]').forEach((video) => {
    if (paused) video.pause();
    else video.play().catch(() => {});
  });
  requestUpdate();
}
for (const toggle of toggles) {
  toggle.addEventListener('click', () => {
    paused = !paused;
    save('shipwreck-motion', paused ? 'paused' : 'enabled');
    applyMotion();
  });
}
reduced.addEventListener('change', (event) => {
  paused = event.matches || read('shipwreck-motion') === 'paused';
  applyMotion();
});

/* Home intro (src/components/Preloader.astro). The <head> script turns it on
   before the first paint; this plays it: the logo fills while the fonts and the
   hero image load, the seven souls pop in and out, then the page is revealed.
   A wheel, tap, key or the skip button ends it early, and it never runs past
   INTRO_MAX_MS. */
const SOUL_MS = 220;
const INTRO_MAX_MS = 3400;
const loader = document.querySelector<HTMLElement>('[data-preloader]');
let loaderEnded = !root.classList.contains('intro') || !loader;
let loaderTimer: number | undefined;
const skipEvents = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;
function finishLoader() {
  if (loaderEnded) {
    root.classList.remove('intro');
    return;
  }
  loaderEnded = true;
  clearTimeout(loaderTimer);
  skipEvents.forEach((type) => window.removeEventListener(type, finishLoader, true));
  if (loader) {
    if (loader.contains(document.activeElement)) (document.activeElement as HTMLElement).blur();
    loader.classList.add('is-done');
    setTimeout(() => loader.remove(), 850);
  }
  root.classList.remove('intro');
  save('shipwreck-intro', 'seen');
  if (!paused && window.scrollY < 100 && hero) {
    root.classList.add('intro-enter');
    setTimeout(() => {
      root.classList.remove('intro-enter');
      requestUpdate();
    }, 1500);
  }
}

if (!loaderEnded && loader) {
  const souls: string[] = JSON.parse(document.querySelector<HTMLElement>('[data-typewriter]')?.dataset.words ?? '[]');
  // If this script arrived late (slow connection), the visitor has already
  // waited: reveal the page instead of playing the souls.
  const late = performance.now() > 2500;
  const remaining = Math.max(400, INTRO_MAX_MS - performance.now());
  loaderTimer = window.setTimeout(finishLoader, late ? 300 : remaining);
  skipEvents.forEach((type) => window.addEventListener(type, finishLoader, { capture: true, passive: true }));
  const decode = (src?: string | null) => {
    if (!src) return Promise.resolve();
    const image = new Image();
    image.src = src;
    return image.decode ? image.decode() : Promise.resolve();
  };
  const heroPoster = document.querySelector<HTMLVideoElement>('video[data-hero-video]')?.poster;
  const assets: Promise<unknown>[] = [document.fonts?.ready ?? Promise.resolve(), decode(heroPoster)];
  let ready = 0;
  const state = loader.querySelector<HTMLElement>('.loader-state');
  const tracked = assets.map((asset) =>
    Promise.resolve(asset)
      .catch(() => {})
      .then(() => {
        ready++;
        loader.style.setProperty('--load', `${(ready / assets.length) * 100}%`);
        if (ready === assets.length && state) state.textContent = state.dataset.ready ?? '';
      }),
  );
  const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const soulSlot = loader.querySelector<HTMLElement>('.loader-souls span')!;
  if (!late) {
    Promise.all([Promise.all(tracked), pause(700)])
      .then(async () => {
        loader.classList.add('is-souls');
        for (const soul of souls) {
          if (loaderEnded) return;
          soulSlot.textContent = soul;
          soulSlot.classList.remove('pop');
          void soulSlot.offsetWidth; // restart the pop animation
          soulSlot.classList.add('pop');
          await pause(SOUL_MS);
        }
      })
      .then(finishLoader);
  }
}

/* Reveal on scroll */
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.08, rootMargin: '0px 0px -25px 0px' },
  );
  document.querySelectorAll<HTMLElement>('.section-heading, .about h2, .visit-info, [data-reveal]').forEach((element, i) => {
    element.setAttribute('data-reveal', '');
    element.style.setProperty('--reveal-delay', `${(i % 4) * 60}ms`);
    observer.observe(element);
  });
}

/* Share buttons on event rows: native share sheet when available, else copy the link. */
document.addEventListener('click', async (event) => {
  const link = (event.target as Element).closest<HTMLAnchorElement>('a[data-share]');
  if (!link) return;
  event.preventDefault();
  const url = link.href;
  try {
    if (navigator.share) {
      await navigator.share({ title: link.dataset.share, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    // Remember the label once, so a second click while it says "copied" can't overwrite it.
    link.dataset.label ??= link.firstChild!.textContent ?? '';
    link.firstChild!.textContent = `${link.dataset.copied ?? strings.copied} `;
    clearTimeout(Number(link.dataset.copyTimer));
    link.dataset.copyTimer = String(setTimeout(() => (link.firstChild!.textContent = link.dataset.label!), 2000));
  } catch {
    /* The visitor dismissed the share sheet. */
  }
});

initAgenda();
initTypewriter();

/* Seven values on the home page: when the two groups (4 + 3) wrap onto
   separate lines, hide the star between them so each line stands alone. */
document.querySelectorAll<HTMLElement>('[data-sevens]').forEach((row) => {
  const [first, second] = row.querySelectorAll<HTMLElement>('.sevens-group');
  if (!first || !second) return;
  const measure = () => {
    row.classList.remove('is-wrapped');
    if (second.offsetTop > first.offsetTop) row.classList.add('is-wrapped');
  };
  new ResizeObserver(measure).observe(row);
  document.fonts?.ready.then(measure);
});

window.addEventListener('scroll', requestUpdate, { passive: true });
window.addEventListener('resize', requestUpdate, { passive: true });
window.addEventListener('pageshow', (event) => {
  if (event.persisted) finishLoader();
  requestUpdate();
});
document.addEventListener('visibilitychange', requestUpdate);
applyMotion();
initRules(() => paused);
