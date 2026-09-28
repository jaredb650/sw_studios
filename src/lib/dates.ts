// Puerto Rico observes Atlantic Standard Time all year (UTC−04:00, no DST).
export const TIME_ZONE = 'America/Puerto_Rico';
const OFFSET = '-04:00';

type Lang = 'es' | 'en';
const LOCALES: Record<Lang, string> = { es: 'es-PR', en: 'en-US' };

/** Builds a Date from a local YYYY-MM-DD day and optional "HH:MM" time. */
export function localDate(day: string, time = '00:00'): Date {
  return new Date(`${day}T${time}:00${OFFSET}`);
}

export function addDays(day: string, days: number): string {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function part(date: Date, options: Intl.DateTimeFormatOptions, lang: Lang = 'es'): string {
  return new Intl.DateTimeFormat(LOCALES[lang], { timeZone: TIME_ZONE, ...options }).format(date);
}

export const dayNumber = (date: Date) => part(date, { day: '2-digit' });
export const monthLong = (date: Date, lang: Lang = 'es') => part(date, { month: 'long' }, lang);
export const monthShort = (date: Date, lang: Lang = 'es') => part(date, { month: 'short' }, lang).replace('.', '');
export const weekday = (date: Date, lang: Lang = 'es') => part(date, { weekday: 'long' }, lang);
export const weekdayShort = (date: Date, lang: Lang = 'es') => part(date, { weekday: 'short' }, lang).replace('.', '');
export const year = (date: Date) => part(date, { year: 'numeric' });

/** "11:45 PM" — the 12-hour style used on local flyers, in both languages. */
export function clock(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('hour')}:${get('minute')} ${get('dayPeriod').toUpperCase()}`;
}

/** "sábado, 17 de octubre de 2026" / "Saturday, October 17, 2026" */
export const longDate = (date: Date, lang: Lang = 'es') =>
  part(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }, lang);

/** "sáb 17 oct 2026" / "Sat Oct 17 2026" — for tight spaces on phones. */
export const compactDate = (date: Date, lang: Lang = 'es') =>
  lang === 'en'
    ? `${weekdayShort(date, lang)} ${monthShort(date, lang)} ${Number(dayNumber(date))} ${year(date)}`
    : `${weekdayShort(date)} ${Number(dayNumber(date))} ${monthShort(date)} ${year(date)}`;

/** "17 oct 2026" / "Oct 17 2026" */
export const shortDate = (date: Date, lang: Lang = 'es') =>
  lang === 'en' ? `${monthShort(date, lang)} ${dayNumber(date)} ${year(date)}` : `${dayNumber(date)} ${monthShort(date)} ${year(date)}`;

/** ISO 8601 with the Puerto Rico offset, for <time datetime> and structured data. */
export function isoLocal(day: string, time?: string): string {
  return time ? `${day}T${time}:00${OFFSET}` : day;
}

/** A Date as ISO 8601 in Puerto Rico time, e.g. "2026-10-18T08:00:00-04:00". */
export function toLocalIso(date: Date): string {
  const local = new Date(date.getTime() - 4 * 60 * 60 * 1000);
  return `${local.toISOString().slice(0, 19)}${OFFSET}`;
}
