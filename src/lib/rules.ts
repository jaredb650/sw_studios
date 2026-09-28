import { getEntry } from 'astro:content';

export async function getRules() {
  const entry = await getEntry('pages', 'reglas');
  return entry && entry.data.items.length ? entry : undefined;
}

/** A short fingerprint of the rules text. Visitors who accepted an older
 *  version are asked again when the rules change. */
export function rulesVersion(items: { title: string; text: string }[]): string {
  let hash = 5381;
  for (const char of JSON.stringify(items)) hash = ((hash << 5) + hash + char.charCodeAt(0)) | 0;
  return (hash >>> 0).toString(36);
}
