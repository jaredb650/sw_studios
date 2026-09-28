// Agenda page (src/views/Agenda.astro): the event-type filter and live counts.
// Multi-select type filter (Música, Taller, Clase…): shows events of any
// selected type, including the featured one. The selection is kept in the
// address (?tipo=taller,clase), and Back steps through earlier selections.
// Counts only include events that haven't ended (src/scripts/agenda.ts hides
// those between daily rebuilds). Without JavaScript the filter is hidden and
// everything shows.
import { hideEnded } from './agenda';

export function initAgendaFilter() {
  if (!document.querySelector('[data-type-filter], [data-live-count]')) return;
  hideEnded();
  const filter = document.querySelector<HTMLElement>('[data-type-filter]');
  const events = [...document.querySelectorAll<HTMLElement>('[data-upcoming] [data-type], [data-featured][data-type]')];
  const plural = (template: string, n: number) => {
    const many = template.replace(/^0 /, '');
    return `${n} ${n === 1 ? many.replace(/s$/, '') : many}`;
  };
  const live = () => events.filter((event) => !event.dataset.ended);
  const total = document.querySelector<HTMLElement>('[data-live-count]');
  if (total) total.textContent = plural(total.dataset.template!, live().length);
  
  if (filter) {
    const allChip = filter.querySelector<HTMLButtonElement>('[data-type-chip=""]')!;
    const chips = [...filter.querySelectorAll<HTMLButtonElement>('[data-type-chip]:not([data-type-chip=""])')];
    const known = new Set(chips.map((chip) => chip.dataset.typeChip!));
    const empty = document.querySelector<HTMLElement>('[data-type-empty]')!;
    const heading = document.querySelector<HTMLElement>('.agenda-title');
    const restCount = document.querySelector<HTMLElement>('[data-rest-count]');
    const setCount = (chip: HTMLElement, n: number) => {
      const count = chip.querySelector('.tag-count');
      if (count) count.textContent = String(n);
      chip.hidden = n === 0 && chip !== allChip;
    };
    setCount(allChip, live().length);
    chips.forEach((chip) => setCount(chip, live().filter((event) => event.dataset.type === chip.dataset.typeChip).length));
    let selected = new Set<string>();
    const fromUrl = () =>
      new Set((new URLSearchParams(location.search).get('tipo') ?? '').split(',').filter((type) => known.has(type)));
    const apply = () => {
      allChip.setAttribute('aria-pressed', String(selected.size === 0));
      chips.forEach((chip) => chip.setAttribute('aria-pressed', String(selected.has(chip.dataset.typeChip!))));
      let shown = 0;
      for (const event of events) {
        // Rows already hidden because they ended stay hidden.
        if (event.dataset.ended) continue;
        const match = selected.size === 0 || selected.has(event.dataset.type!);
        event.classList.toggle('is-filtered-out', !match);
        if (match) shown++;
      }
      empty.hidden = shown > 0;
      const featuredShown = events.some((event) => event.hasAttribute('data-featured') && !event.dataset.ended && !event.classList.contains('is-filtered-out'));
      if (heading) heading.textContent = (featuredShown ? heading.dataset.moreLabel : heading.dataset.allLabel) ?? heading.textContent;
      if (restCount) {
        const inGrid = events.filter((event) => !event.hasAttribute('data-featured') && !event.dataset.ended && !event.classList.contains('is-filtered-out')).length;
        restCount.textContent = plural(restCount.dataset.template!, inGrid);
      }
    };
    const choose = (next: Set<string>) => {
      selected = next;
      apply();
      const query = selected.size ? `?tipo=${[...selected].join(',')}` : '';
      history.pushState(null, '', location.pathname + query);
    };
    allChip.addEventListener('click', () => choose(new Set()));
    chips.forEach((chip) =>
      chip.addEventListener('click', () => {
        const next = new Set(selected);
        const type = chip.dataset.typeChip!;
        if (next.has(type)) next.delete(type);
        else next.add(type);
        choose(next);
      }),
    );
    window.addEventListener('popstate', () => {
      selected = fromUrl();
      apply();
    });
    selected = fromUrl();
    apply();
  }
}
