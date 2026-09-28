import { getCollection } from 'astro:content';
import { site } from '../data/site';

export type PlaceholderItem = { collection: string; id: string };

let cached: Promise<PlaceholderItem[]> | undefined;

/** Every entry still marked `placeholder: true`. While any exist, pages show a
 *  sample-content banner and ask search engines not to index them. */
export function getPlaceholders(): Promise<PlaceholderItem[]> {
  cached ??= (async () => {
    const found: PlaceholderItem[] = [];
    for (const name of ['events', 'artists', 'artworks', 'pages'] as const) {
      const entries = await getCollection(name);
      for (const entry of entries) {
        if (entry.data.placeholder && !('draft' in entry.data && entry.data.draft)) {
          found.push({ collection: name, id: entry.id });
        }
      }
    }
    if (site.patreon.placeholder) found.push({ collection: 'site', id: 'patreon' });
    return found;
  })();
  return cached;
}
