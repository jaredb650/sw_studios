// Hero typewriter: "SHIPWRECK STUDIOS ES_" types each of the seven souls,
// holds it, erases it, and moves to the next, in a loop. The cursor blinks
// while idle. It pauses while the hero is off screen or the tab is hidden,
// and when animations are off (footer toggle or reduced motion) it simply
// shows the first soul without typing.

const TYPE_MS = 85;
const ERASE_MS = 45;
const HOLD_MS = 1700;
const GAP_MS = 380;

export function initTypewriter() {
  const line = document.querySelector<HTMLElement>('[data-typewriter]');
  const target = line?.querySelector<HTMLElement>('[data-typed]');
  if (!line || !target) return;
  const words: string[] = JSON.parse(line.dataset.words ?? '[]');
  if (words.length < 2) return;

  const root = document.documentElement;
  const still = () => root.classList.contains('motion-paused');
  let visible = true;
  let index = 0;
  let timer = 0;

  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      const tick = () => {
        // Hold the loop (without losing its place) while it can't be seen.
        if (!visible || document.hidden) timer = window.setTimeout(tick, 250);
        else timer = window.setTimeout(resolve, ms);
      };
      tick();
    });

  let running = false;
  async function loop() {
    running = true;
    line!.classList.add('is-typing');
    // The first soul is already on the page; start by holding it.
    let word = target!.textContent ?? words[0];
    while (!still()) {
      line!.classList.remove('is-busy');
      await wait(HOLD_MS);
      if (still()) break;
      line!.classList.add('is-busy');
      for (let i = word.length; i > 0 && !still(); i--) {
        target!.textContent = word.slice(0, i - 1);
        await wait(ERASE_MS);
      }
      line!.classList.remove('is-busy');
      await wait(GAP_MS);
      index = (index + 1) % words.length;
      word = words[index];
      line!.classList.add('is-busy');
      for (let i = 1; i <= word.length && !still(); i++) {
        target!.textContent = word.slice(0, i);
        await wait(TYPE_MS);
      }
    }
    // Animations switched off: settle on a whole word.
    target!.textContent = words[index];
    line!.classList.remove('is-typing', 'is-busy');
    running = false;
  }

  new IntersectionObserver(([entry]) => (visible = entry.isIntersecting)).observe(line);
  new MutationObserver(() => {
    if (!still() && !running) loop();
  }).observe(root, { attributes: true, attributeFilter: ['class'] });
  if (!still()) loop();
  window.addEventListener('pagehide', () => clearTimeout(timer));
}
