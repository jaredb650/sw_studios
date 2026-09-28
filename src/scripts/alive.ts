// Shared plumbing for the home page's self-running pieces (hero typewriter,
// artist carousel) so they never stay frozen while visible.
//
// Browsers can suspend or drop a page's pending timers: when it goes to the
// back/forward cache and is restored, when a phone backgrounds the tab, or
// while the screen is locked. Instead of trusting that a timer will fire,
// each component exposes a `kick()` that checks its state and restarts
// whatever should be running. keepAlive() calls it on every event that can
// bring a page back, plus a one-second heartbeat as a safety net.

/** True when at least `ratio` of the element (or of the screen, for tall elements) is on screen. */
export function onScreen(element: Element, ratio = 0.25): boolean {
  if (document.hidden) return false;
  const rect = element.getBoundingClientRect();
  if (!rect.width || !rect.height) return false;
  const shown = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
  return shown > 0 && shown / Math.min(rect.height, window.innerHeight) >= ratio;
}

/** Calls `kick` whenever the page may have come back to life, and every second. */
export function keepAlive(kick: () => void, { onReturn }: { onReturn?: () => void } = {}) {
  const run = () => kick();
  // Back/forward cache restores, tab switches, app switches on phones.
  window.addEventListener('pageshow', () => {
    onReturn?.();
    kick();
  });
  window.addEventListener('pagehide', () => onReturn?.());
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) onReturn?.();
    kick();
  });
  window.addEventListener('focus', run);
  window.addEventListener('scroll', run, { passive: true });
  window.addEventListener('resize', run, { passive: true });
  window.setInterval(run, 1000);
}
