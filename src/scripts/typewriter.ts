// Hero typewriter: "SHIPWRECK STUDIOS ES_" types each of the seven souls,
// holds it, erases it, and moves to the next, in a loop. The cursor blinks
// while idle. It rests while the hero is off screen or the tab is hidden,
// and when animations are off (footer toggle or reduced motion) it shows a
// whole soul without typing.
//
// It is a small state machine advanced by one timer at a time. kick() (see
// alive.ts) restarts it whenever it should be running but nothing is pending,
// or the pending step is overdue, so it can never stay frozen while visible.
import { keepAlive, onScreen } from './alive';

const TYPE_MS = 85;
const ERASE_MS = 45;
const HOLD_MS = 1700;
const GAP_MS = 380;
/** A pending step this late (ms) is treated as lost and restarted. */
const OVERDUE_MS = 900;

type State = 'hold' | 'erase' | 'gap' | 'type';

export function initTypewriter() {
  const found = document.querySelector<HTMLElement>('[data-typewriter]');
  const typed = found?.querySelector<HTMLElement>('[data-typed]');
  if (!found || !typed) return;
  const line: HTMLElement = found;
  const target: HTMLElement = typed;
  const words: string[] = JSON.parse(line.dataset.words ?? '[]');
  if (words.length < 2) return;

  const root = document.documentElement;
  const still = () => root.classList.contains('motion-paused');
  const canRun = () => !still() && onScreen(line, 0.1);

  // The first soul is already on the page; the loop starts by holding it.
  let index = 0;
  let word = words[0];
  let pos = word.length;
  let state: State = 'hold';
  let timer = 0;
  let dueAt = 0;

  const render = () => (target.textContent = word.slice(0, pos));
  const busy = (on: boolean) => line.classList.toggle('is-busy', on);

  function schedule(ms: number) {
    window.clearTimeout(timer);
    dueAt = performance.now() + ms;
    timer = window.setTimeout(step, ms);
  }

  /** Animations off: show a whole word and wait to be kicked again. */
  function settle() {
    window.clearTimeout(timer);
    timer = 0;
    word = words[index];
    pos = word.length;
    state = 'hold';
    render();
    busy(false);
    line.classList.remove('is-typing');
  }

  function step() {
    timer = 0;
    if (!canRun()) {
      if (still()) settle();
      return; // Rests until kick() sees it can run again.
    }
    line.classList.add('is-typing');
    switch (state) {
      case 'hold':
        busy(false);
        state = 'erase';
        schedule(HOLD_MS);
        break;
      case 'erase':
        busy(true);
        if (pos > 0) {
          pos--;
          render();
          schedule(ERASE_MS);
        } else {
          busy(false);
          state = 'gap';
          schedule(GAP_MS);
        }
        break;
      case 'gap':
        index = (index + 1) % words.length;
        word = words[index];
        pos = 0;
        state = 'type';
        schedule(0);
        break;
      case 'type':
        busy(true);
        if (pos < word.length) {
          pos++;
          render();
          schedule(TYPE_MS);
        } else {
          state = 'hold';
          schedule(0);
        }
        break;
    }
  }

  function kick() {
    if (still()) {
      if (state !== 'hold' || pos !== word.length || timer) settle();
      return;
    }
    if (!canRun()) return;
    // Nothing pending, or the pending step never fired (dropped timer): restart.
    if (!timer || performance.now() > dueAt + OVERDUE_MS) schedule(0);
  }

  new IntersectionObserver(() => kick(), { threshold: [0, 0.1] }).observe(line);
  new MutationObserver(kick).observe(root, { attributes: true, attributeFilter: ['class'] });
  keepAlive(kick);
  kick();
}
