// schema.org data so search engines can show events and venue details.
import { getImage } from 'astro:assets';
import { site } from '../data/site';
import { absolute } from './urls';
import { isoLocal, toLocalIso } from './dates';
import type { Event } from './events';
import { ui } from '../i18n/ui';
import { routePath } from '../i18n';

const address = {
  '@type': 'PostalAddress',
  streetAddress: site.address.street,
  addressLocality: site.address.city,
  addressRegion: site.address.region,
  addressCountry: site.address.country,
  ...(site.address.postalCode ? { postalCode: site.address.postalCode } : {}),
};

export function venueJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': ['MusicVenue', 'ArtGallery'],
    name: site.name,
    description: ui.site.description,
    url: absolute(routePath('home')),
    image: absolute('/og-default.jpg'),
    logo: absolute('/favicon.png'),
    address,
    sameAs: Object.values(site.socials).filter(Boolean),
    ...(site.contact.email ? { email: site.contact.email } : {}),
    ...(site.contact.phone ? { telephone: site.contact.phone } : {}),
  };
}

const STATUS = {
  scheduled: 'https://schema.org/EventScheduled',
  cancelled: 'https://schema.org/EventCancelled',
  postponed: 'https://schema.org/EventPostponed',
} as const;

/** Event data for real (non-sample) events only. */
export async function eventJsonLd(event: Event) {
  const { data } = event;
  const image = data.flyer ? new URL((await getImage({ src: data.flyer, width: 1200 })).src, import.meta.env.SITE).href : undefined;
  const performers = data.lineup.flatMap((line) =>
    line
      .split(/\s+b2b\s+|\s*\+\s*|\s*,\s*|\s*[()]\s*/i)
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => ({ '@type': 'PerformingGroup', name })),
  );
  const offerUrl = data.ticketUrl;
  const description = event.body;
  return {
    '@context': 'https://schema.org',
    '@type': data.lineup.length ? 'MusicEvent' : 'Event',
    name: data.title,
    startDate: isoLocal(data.date, data.start),
    endDate: toLocalIso(event.endsAt),
    eventStatus: STATUS[data.status],
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: { '@type': 'Place', name: site.name, address },
    url: absolute(`${routePath('agenda')}#evento-${event.id}`),
    inLanguage: 'es',
    ...(image ? { image: [image] } : {}),
    ...(description ? { description: description.replace(/\s+/g, ' ').trim().slice(0, 300) } : {}),
    ...(performers.length ? { performer: performers } : {}),
    organizer: (data.organizers.length ? data.organizers : [site.name]).map((name) => ({ '@type': 'Organization', name })),
    ...(offerUrl || data.admission === 'free'
      ? {
          offers: {
            '@type': 'Offer',
            ...(offerUrl ? { url: offerUrl } : {}),
            ...(data.admission === 'free' ? { price: 0, priceCurrency: 'USD' } : {}),
            availability: 'https://schema.org/InStock',
          },
        }
      : {}),
  };
}
