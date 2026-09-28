// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Where the site is published. Until the client's Namecheap domain is connected,
// the site lives at https://jaredb650.github.io/sw_studios/. When the domain is
// ready: set SITE to 'https://<domain>', BASE to '/', and add public/CNAME
// (see README.md → "Connecting the domain").
const SITE = process.env.SITE_URL ?? 'https://jaredb650.github.io';
const BASE = process.env.BASE_PATH ?? '/sw_studios';

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'ignore',
  // Keep the pre-v7 whitespace behavior so inline elements written on separate
  // lines keep their spaces.
  compressHTML: true,
  integrations: [
    sitemap({ filter: (page) => !page.includes('/404') && !page.includes('/membresias') }),
  ],
  image: {
    // YouTube thumbnails are fetched at build time and served from the site.
    domains: ['i.ytimg.com'],
    layout: 'constrained',
    responsiveStyles: true,
  },
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Barlow Condensed',
      cssVariable: '--font-display',
      weights: [500, 600, 700, 800],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['Arial Narrow', 'Impact', 'sans-serif'],
    },
    {
      // Labels, dates and tags: one monospace everywhere, instead of each system's default.
      provider: fontProviders.google(),
      name: 'IBM Plex Mono',
      cssVariable: '--font-mono',
      weights: [400, 600],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['ui-monospace', 'Menlo', 'Consolas', 'monospace'],
    },
    {
      provider: fontProviders.google(),
      name: 'DM Sans',
      cssVariable: '--font-body',
      weights: [400, 500, 600, 700],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['Arial', 'sans-serif'],
    },
  ],
});
