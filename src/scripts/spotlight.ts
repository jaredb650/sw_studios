// Artist spotlight carousel on the home page (src/components/ArtistSpotlight.astro).
// The countdown runs on a JavaScript clock (requestAnimationFrame): the bar's
// width is the time elapsed while running, and when it fills the next artist
// loads. Nothing depends on a CSS animation event or a single long timer, and
// kick() (see alive.ts) restarts the clock whenever it should be running, so
// the carousel can't stay frozen while it's on screen.
import { keepAlive, onScreen } from './alive';

const root = document.documentElement;
/** After browsing another row with the arrows or a swipe, resume after this long without interaction. */
const BROWSE_RESUME_MS = 6000;
/** A mouse resting on the card holds it only this long after it last moved. */
const READ_HOLD_MS = 8000;

export function initSpotlight() {
  document.querySelectorAll<HTMLElement>('[data-spotlight]').forEach((carousel) => {
    const stage = carousel.querySelector<HTMLElement>('[data-spot-stage]')!;
    const cards = [...carousel.querySelectorAll<HTMLAnchorElement>('[data-spot-card]')];
    const thumbs = [...carousel.querySelectorAll<HTMLAnchorElement>('[data-spot-thumb]')];
    const list = carousel.querySelector<HTMLElement>('[data-spot-thumbs]')!;
    const bar = carousel.querySelector<HTMLElement>('[data-spot-bar]')!;
    const toggle = carousel.querySelector<HTMLButtonElement>('[data-spot-toggle]')!;
    const prev = carousel.querySelector<HTMLButtonElement>('[data-spot-prev]')!;
    const next = carousel.querySelector<HTMLButtonElement>('[data-spot-next]')!;
    if (cards.length < 2) return;
    carousel.classList.add('is-live');
    prev.hidden = next.hidden = toggle.hidden = false;

    let current = 0;
    let elapsed = 0; // ms counted toward the current artist
    let lastFrame = 0;
    let raf = 0;
    let lastTickAt = 0; // last time the clock actually advanced
    // Stopped by the visitor (pause button) or by the site-wide motion setting.
    let stopped = root.classList.contains('motion-paused');
    // Whether the site-wide motion toggle (not the carousel's own button) stopped it.
    let stoppedByMotion = stopped;
    // Temporary holds; all are cleared whenever the page is shown again.
    let hovering = false; // a mouse is moving over the card
    let lastMove = 0;
    let focused = false; // the card has keyboard focus
    let browsing = false; // another row of the strip is being looked at
    let browseTimer = 0;

    const duration = () => {
      const value = getComputedStyle(carousel).getPropertyValue('--spot-duration').trim();
      const seconds = parseFloat(value) || 7;
      return (value.endsWith('ms') ? seconds / 1000 : seconds) * 1000;
    };
    const perPage = () => Number(getComputedStyle(list).getPropertyValue('--per-page')) || 5;
    const pageOf = (i: number) => Math.floor(i / perPage());
    const pages = () => Math.ceil(thumbs.length / perPage());
    const gap = () => parseFloat(getComputedStyle(list).columnGap) || 0;
    const showPage = (page: number, smooth = true) => {
      const target = (((page % pages()) + pages()) % pages()) * (list.clientWidth + gap());
      list.scrollTo({ left: target, behavior: smooth && !root.classList.contains('motion-paused') ? 'smooth' : 'instant' });
    };
    const currentPage = () => {
      // A partial last row can't scroll a full page, so "scrolled to the end" counts as the last page.
      const atEnd = list.scrollLeft > 0 && list.scrollLeft >= list.scrollWidth - list.clientWidth - 2;
      return atEnd ? pages() - 1 : Math.round(list.scrollLeft / (list.clientWidth + gap()));
    };

    const reading = () => focused || (hovering && performance.now() - lastMove < READ_HOLD_MS);
    const running = () => !stopped && !reading() && !browsing && !root.classList.contains('rules-pending') && onScreen(stage, 0.35);

    const paint = () => {
      const progress = Math.min(1, elapsed / duration());
      bar.style.transform = `scaleX(${progress})`;
      thumbs.forEach((thumb, i) => {
        const mini = thumb.querySelector<HTMLElement>('.spot-thumb-bar');
        if (mini) mini.style.transform = `scaleX(${i === current ? progress : 0})`;
      });
      carousel.classList.toggle('is-running', running());
    };

    function frame(now: number) {
      raf = 0;
      if (!running()) {
        lastFrame = 0;
        paint();
        return; // kick() starts the clock again when it can run.
      }
      // Cap each step so time spent frozen (tab in background) isn't counted.
      if (lastFrame) elapsed += Math.min(now - lastFrame, 100);
      lastFrame = now;
      lastTickAt = performance.now();
      if (elapsed >= duration()) show(current + 1);
      paint();
      raf = requestAnimationFrame(frame);
    }

    function kick() {
      paint();
      if (!running()) return;
      // Start the clock if it isn't going, or restart it if frames stopped arriving.
      if (!raf || performance.now() - lastTickAt > 1500) {
        if (raf) cancelAnimationFrame(raf);
        lastFrame = 0;
        lastTickAt = performance.now();
        raf = requestAnimationFrame(frame);
      }
    }

    function show(i: number, { manual = false } = {}) {
      current = (i + cards.length) % cards.length;
      elapsed = 0;
      cards.forEach((card, n) => (card.hidden = n !== current));
      thumbs.forEach((thumb, n) => (n === current ? thumb.setAttribute('aria-current', 'true') : thumb.removeAttribute('aria-current')));
      // Warm up the next photo so it's ready when the bar fills.
      const upcoming = cards[(current + 1) % cards.length].querySelector('img');
      if (upcoming) upcoming.loading = 'eager';
      stage.setAttribute('aria-live', manual || stopped ? 'polite' : 'off');
      endBrowsing();
      if (pageOf(current) !== currentPage()) showPage(pageOf(current));
      paint();
      kick();
    }

    function endBrowsing() {
      browsing = false;
      window.clearTimeout(browseTimer);
    }
    function startBrowsing() {
      browsing = true;
      window.clearTimeout(browseTimer);
      // Don't hold forever: after a pause, return to the current artist's row and continue.
      browseTimer = window.setTimeout(() => {
        endBrowsing();
        showPage(pageOf(current));
        kick();
      }, BROWSE_RESUME_MS);
    }

    thumbs.forEach((thumb, i) =>
      thumb.addEventListener('click', (event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey) return;
        event.preventDefault();
        // Choosing an artist stops the rotation so they stay on screen; the
        // pause button (now "Reanudar") starts it again.
        stoppedByMotion = false;
        setStopped(true);
        show(i, { manual: true });
      }),
    );
    const page = (delta: number) => {
      const target = (((currentPage() + delta) % pages()) + pages()) % pages();
      if (target !== pageOf(current)) startBrowsing();
      else endBrowsing();
      paint();
      showPage(target);
      kick();
    };
    prev.addEventListener('click', () => page(-1));
    next.addEventListener('click', () => page(1));
    // After a swipe settles: browsing if it shows another row, otherwise continue.
    let settle = 0;
    list.addEventListener('scroll', () => {
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        if (currentPage() !== pageOf(current)) {
          if (!browsing) startBrowsing();
        } else endBrowsing();
        kick();
      }, 160);
    }, { passive: true });

    const setStopped = (value: boolean) => {
      stopped = value;
      toggle.setAttribute('aria-label', (stopped ? toggle.dataset.playLabel : toggle.dataset.pauseLabel) ?? '');
      carousel.classList.toggle('is-stopped', stopped);
      stage.setAttribute('aria-live', stopped ? 'polite' : 'off');
      kick();
    };
    toggle.addEventListener('click', () => {
      stoppedByMotion = false;
      setStopped(!stopped);
    });

    // Hold while someone reads the card: a mouse actually moving over it (a
    // pointer left resting there stops holding after READ_HOLD_MS), or keyboard
    // focus. Touch taps and mouse clicks don't hold it.
    cards.forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        if (event.pointerType !== 'mouse') return;
        hovering = true;
        lastMove = performance.now();
        kick();
      });
      card.addEventListener('pointerleave', () => {
        hovering = false;
        kick();
      });
      card.addEventListener('focus', () => {
        focused = card.matches(':focus-visible');
        kick();
      });
      card.addEventListener('blur', () => {
        focused = false;
        kick();
      });
    });

    new IntersectionObserver(() => kick(), { threshold: [0, 0.35, 0.6] }).observe(stage);
    // Follow the site-wide motion toggle and the rules checkpoint.
    new MutationObserver(() => {
      const motionOff = root.classList.contains('motion-paused');
      if (motionOff && !stopped) {
        stoppedByMotion = true;
        setStopped(true);
      } else if (!motionOff && stopped && stoppedByMotion) {
        // Animations back on: resume if the toggle was what paused it.
        stoppedByMotion = false;
        setStopped(false);
      }
      kick();
    }).observe(root, { attributes: true, attributeFilter: ['class'] });
    // Re-page only when the width changes (a phone's toolbar collapsing while
    // scrolling changes only the height).
    let lastWidth = list.clientWidth;
    window.addEventListener('resize', () => {
      if (list.clientWidth === lastWidth) return;
      lastWidth = list.clientWidth;
      showPage(pageOf(current), false);
    });
    keepAlive(kick, {
      // Coming back to the page (Back button, tab switch): clear temporary holds.
      onReturn: () => {
        hovering = false;
        focused = false;
        endBrowsing();
        lastFrame = 0;
      },
    });

    setStopped(stopped);
    show(0);
  });
}
