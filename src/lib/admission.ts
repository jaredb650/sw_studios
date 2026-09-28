import type { Event } from './events';
import { platformName } from './urls';
import { ui } from '../i18n/ui';
import { pick, type Lang } from '../i18n';

export type AdmissionInfo = {
  /** Short badge text for agenda cards. */
  chip: string;
  /** Full sentence for the event details. */
  label: string;
  /**
   * The main button, always present in the same spot. With a `url` it's an
   * active link (tickets, RSVP); without one it's a greyed-out status that
   * doesn't link anywhere (free entry, pay at the door, coming soon, ended).
   */
  primary: { label: string; url?: string };
};

export function admissionInfo(event: Event, { past = false, lang = 'es' as Lang } = {}): AdmissionInfo {
  const t = ui[lang].event;
  const { admission, ticketUrl, status } = event.data;
  const price = pick(event.data, 'price', lang);
  const platform = ticketUrl ? platformName(ticketUrl) : undefined;
  const info = ((): AdmissionInfo => {
    switch (admission) {
      case 'tickets':
        return {
          chip: price ?? t.tickets,
          label: price ? t.ticketsWithPrice(price) : t.ticketsOnSale,
          primary: { label: platform ? t.ticketsOn(platform) : t.buyTickets, url: ticketUrl },
        };
      case 'free':
        return {
          chip: t.free,
          label: t.freeEntry,
          primary: ticketUrl ? { label: t.rsvp, url: ticketUrl } : { label: t.freeEntry },
        };
      case 'door': {
        const label = price ? t.payAtDoorPrice(price) : t.payAtDoor;
        return {
          chip: price ? t.atDoorPrice(price) : t.atDoor,
          label,
          primary: ticketUrl ? { label: t.moreInfo, url: ticketUrl } : { label },
        };
      }
      case 'soon':
        return { chip: t.soon, label: t.infoSoon, primary: { label: t.ticketsSoon } };
    }
  })();
  if (past) info.primary = { label: t.eventEnded };
  else if (status === 'cancelled') info.primary = { label: t.eventCancelled };
  else if (status === 'postponed' && !info.primary.url) info.primary = { label: t.eventPostponed };
  return info;
}
