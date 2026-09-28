const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Prefixes a site path with the deploy base, e.g. "/archivo/" → "/sw_studios/archivo/". */
export function href(path: string): string {
  if (/^(https?:|mailto:|tel:|#)/.test(path)) return path;
  return `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Absolute URL for canonical links, Open Graph, and structured data. */
export function absolute(path: string): string {
  return new URL(href(path), import.meta.env.SITE).href;
}

const TICKET_HOSTS: Record<string, string> = {
  'posh.vip': 'Posh',
  'ra.co': 'Resident Advisor',
  'eventbrite.com': 'Eventbrite',
  'boletera.net': 'Boletera',
  'ticketera.com': 'Ticketera',
  'dice.fm': 'DICE',
  'shotgun.live': 'Shotgun',
  'bandsintown.com': 'Bandsintown',
  'instagram.com': 'Instagram',
  'songkick.com': 'Songkick',
  'patreon.com': 'Patreon',
};

/** A readable platform name for an external link, e.g. "Posh". */
export function platformName(url: string): string | undefined {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    const match = Object.keys(TICKET_HOSTS).find((key) => host === key || host.endsWith(`.${key}`));
    return match ? TICKET_HOSTS[match] : undefined;
  } catch {
    return undefined;
  }
}
