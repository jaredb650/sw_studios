// Artist tags are the `disciplines` in each artist file, genres included. Every
// tag shows on the artist's card; tags that two or more artists share are also
// filters on the Artistas page, so reuse existing spellings. This list only groups roles into the two
// broad shortcut filters, Música and Arte visual. Add a role here (lowercase,
// accents optional) to include it in one of them.
export type ArtistCategory = 'musica' | 'arte';

export const ROLE_CATEGORIES: Record<string, ArtistCategory> = {
  dj: 'musica',
  productor: 'musica',
  productora: 'musica',
  'live act': 'musica',
  'en vivo': 'musica',
  musico: 'musica',
  musica: 'musica',
  cantante: 'musica',
  banda: 'musica',
  pintura: 'arte',
  muralismo: 'arte',
  ilustracion: 'arte',
  visuales: 'arte',
  vj: 'arte',
  instalacion: 'arte',
  escultura: 'arte',
  fotografia: 'arte',
  grabado: 'arte',
  'arte digital': 'arte',
  tatuaje: 'arte',
};
