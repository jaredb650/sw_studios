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
  if (open) menu.querySelector('a')?.focus();
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
window.matchMedia('(min-width: 1181px)').addEventListener('change', (event) => event.matches && setMenu(false));

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

/* Motion toggle */
const toggle = document.querySelector<HTMLButtonElement>('.motion-toggle');
function applyMotion() {
  root.classList.toggle('motion-paused', paused);
  root.classList.toggle('motion-enabled', !paused);
  if (toggle) {
    toggle.hidden = false;
    toggle.textContent = (paused ? toggle.dataset.playLabel : toggle.dataset.pauseLabel) ?? toggle.textContent;
    toggle.setAttribute('aria-pressed', String(paused));
  }
  if (paused) finishLoader();
  // The hero video follows the motion setting too.
  document.querySelectorAll<HTMLVideoElement>('video[data-hero-video]').forEach((video) => {
    if (paused) video.pause();
    else video.play().catch(() => {});
  });
  requestUpdate();
}
toggle?.addEventListener('click', () => {
  paused = !paused;
  save('shipwreck-motion', paused ? 'paused' : 'enabled');
  applyMotion();
});
reduced.addEventListener('change', (event) => {
  paused = event.matches || read('shipwreck-motion') === 'paused';
  applyMotion();
});

/* Home intro: absent without JS, skipped on repeat visits, hard 2.6 s deadline. */
let loader: HTMLElement | undefined;
let loaderEnded = false;
let loaderTimer: number | undefined;
function finishLoader() {
  if (loaderEnded) return;
  loaderEnded = true;
  clearTimeout(loaderTimer);
  if (loader) {
    if (loader.contains(document.activeElement)) (document.activeElement as HTMLElement).blur();
    loader.classList.add('is-done');
    const done = loader;
    setTimeout(() => done.remove(), 850);
  }
  save('shipwreck-intro', 'seen');
  if (!paused && window.scrollY < 100 && hero) {
    root.classList.add('intro-enter');
    setTimeout(() => {
      root.classList.remove('intro-enter');
      requestUpdate();
    }, 1500);
  }
}

if (document.body.dataset.page === 'home' && !paused && !read('shipwreck-intro') && !location.hash && window.scrollY < 100) {
  // Intro: the logo fills while the page loads, then the seven souls pop in
  // and out one after another under it, then the home page is revealed.
  // Skippable (button, Tab, Escape) and capped by a hard deadline.
  const souls: string[] = JSON.parse(document.querySelector<HTMLElement>('[data-typewriter]')?.dataset.words ?? '[]');
  const SOUL_MS = 300;
  loader = document.createElement('div');
  loader.className = 'preloader';
  loader.innerHTML =
    `<div class="preloader-logo" aria-hidden="true"><span class="brand-mark"></span><span class="brand-mark loader-fill"></span></div><p class="loader-wordmark">SHIPWRECK STUDIOS_</p><p class="loader-souls" aria-hidden="true"><span></span></p><div class="loader-bottom"><span>${strings.place}</span><span class="loader-state" role="status">${strings.loading}</span><button class="loader-skip" type="button">${strings.skip} <i class="icon icon-arrow" aria-hidden="true"></i></button></div>`;
  document.body.append(loader);
  loaderTimer = window.setTimeout(finishLoader, 900 + souls.length * SOUL_MS + 1600);
  loader.querySelector('button')!.addEventListener('click', finishLoader);
  const skipKey = (event: KeyboardEvent) => {
    if (event.key === 'Tab' || event.key === 'Escape') {
      finishLoader();
      document.removeEventListener('keydown', skipKey);
    }
  };
  document.addEventListener('keydown', skipKey);
  const decode = (image?: HTMLImageElement | null) => (image?.decode ? image.decode() : Promise.resolve());
  const assets: Promise<unknown>[] = [document.fonts?.ready ?? Promise.resolve(), decode(document.querySelector<HTMLImageElement>('.poster img'))];
  let ready = 0;
  const active = loader;
  const tracked = assets.map((asset) =>
    Promise.resolve(asset)
      .catch(() => {})
      .then(() => {
        ready++;
        active.style.setProperty('--load', `${(ready / assets.length) * 100}%`);
        if (ready === assets.length) active.querySelector('.loader-state')!.textContent = strings.ready;
      }),
  );
  const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const soulSlot = active.querySelector<HTMLElement>('.loader-souls span')!;
  Promise.all([Promise.all(tracked), pause(900)])
    .then(async () => {
      active.classList.add('is-souls');
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
} else {
  loaderEnded = true;
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
    const original = link.firstChild!.textContent;
    link.firstChild!.textContent = `${link.dataset.copied ?? strings.copied} `;
    setTimeout(() => (link.firstChild!.textContent = original), 2000);
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
