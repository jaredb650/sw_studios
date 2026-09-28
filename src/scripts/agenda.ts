// The site rebuilds daily, so finished events move to the archive on their
// own. Between rebuilds this script keeps the agenda honest: it hides cards
// for events that have ended, relabels an ended Featured Event, and marks
// today's events.

import { strings } from './strings';

const TIME_ZONE = 'America/Puerto_Rico';
const dayKey = (date: Date) => date.toLocaleDateString('en-CA', { timeZone: TIME_ZONE });

export function initAgenda(now = new Date()) {
  const today = dayKey(now);
  const mark = (element: HTMLElement, starts: Date) => {
    if (starts > now && dayKey(starts) !== today) return;
    const chip = element.querySelector<HTMLElement>('[data-today]');
    if (chip) {
      chip.hidden = false;
      chip.textContent = starts <= now ? strings.now : strings.today;
    }
  };

  document.querySelectorAll<HTMLElement>('[data-upcoming] [data-ends]').forEach((card) => {
    if (new Date(card.dataset.ends!) <= now) card.hidden = true;
    else mark(card, new Date(card.dataset.starts!));
  });

  const featured = document.querySelector<HTMLElement>('[data-featured]');
  if (featured) {
    if (new Date(featured.dataset.ends!) <= now) {
      const status = featured.querySelector('[data-event-status]');
      if (status instanceof HTMLElement) status.textContent = status.dataset.pastLabel ?? status.textContent;
      // Keep the main button in place, as a greyed-out status like any ended event.
      const primary = featured.querySelector<HTMLElement>('[data-primary]');
      if (primary) {
        const ended = document.createElement('span');
        ended.className = 'button is-static';
        ended.dataset.primary = '';
        const label = document.createElement('span');
        label.textContent = (status as HTMLElement | null)?.dataset.endedLabel ?? '';
        ended.append(label);
        primary.replaceWith(ended);
      }
    } else {
      mark(featured, new Date(featured.dataset.starts!));
    }
  }

  const grid = document.querySelector<HTMLElement>('[data-upcoming] .event-grid');
  const empty = document.querySelector<HTMLElement>('[data-agenda-empty]');
  if (grid && empty && ![...grid.children].some((card) => !(card as HTMLElement).hidden)) empty.hidden = false;

  // An opened card spans the whole row, which can move it; keep it in view.
  document.querySelectorAll<HTMLDetailsElement>('details.event-card').forEach((card) => {
    card.addEventListener('toggle', () => {
      if (!card.open) return;
      const top = card.getBoundingClientRect().top;
      if (top < 80 || top > window.innerHeight * 0.6) card.scrollIntoView({ block: 'start' });
    });
  });

  initReadMore();

  // Open the event a shared link points to.
  const openFromHash = () => {
    if (!location.hash.startsWith('#evento-')) return;
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target instanceof HTMLDetailsElement) {
      target.open = true;
      target.scrollIntoView({ block: 'start' });
    }
  };
  openFromHash();
  window.addEventListener('hashchange', openFromHash);
}

/** Long descriptions are clamped to three lines; "Leer más" appears only when
 *  the text actually overflows. Measured whenever the text gets a size, e.g.
 *  when a closed card is opened. */
function initReadMore() {
  document.querySelectorAll<HTMLElement>('[data-clamp]').forEach((box) => {
    const text = box.querySelector<HTMLElement>('.event-description');
    const button = box.querySelector<HTMLButtonElement>('.read-more');
    if (!text || !button) return;
    const measure = () => {
      if (box.classList.contains('is-open') || !text.clientHeight) return;
      const overflowing = text.scrollHeight > text.clientHeight + 2;
      box.classList.toggle('is-truncated', overflowing);
      button.hidden = !overflowing;
    };
    new ResizeObserver(measure).observe(text);
    button.addEventListener('click', () => {
      const open = box.classList.toggle('is-open');
      box.classList.toggle('is-truncated', !open);
      button.textContent = (open ? button.dataset.less : button.dataset.more) ?? button.textContent;
      button.setAttribute('aria-expanded', String(open));
    });
  });
}
