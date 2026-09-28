// Puerto Rico observes Atlantic Standard Time all year (UTC−04:00, no DST).
export const TIME_ZONE = 'America/Puerto_Rico';
const OFFSET = '-04:00';

const LOCALE = 'es-PR';

/** Builds a Date from a local YYYY-MM-DD day and optional "HH:MM" time. */
export function localDate(day: string, time = '00:00'): Date {
  return new Date(`${day}T${time}:00${OFFSET}`);
}

export function addDays(day: string, days: number): string {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function part(date: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, ...options }).format(date);
}

export const dayNumber = (date: Date) => part(date, { day: '2-digit' });
export const monthLong = (date: Date) => part(date, { month: 'long' });
export const monthShort = (date: Date) => part(date, { month: 'short' }).replace('.', '');
export const weekday = (date: Date) => part(date, { weekday: 'long' });
export const weekdayShort = (date: Date) => part(date, { weekday: 'short' }).replace('.', '');
export const year = (date: Date) => part(date, { year: 'numeric' });

/** "11:45 PM" — the 12-hour style used on local flyers. */
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

/** "sábado, 17 de octubre de 2026" */
export const longDate = (date: Date) =>
  part(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/** "sáb 17 oct 2026" — for tight spaces on phones. */
export const compactDate = (date: Date) => `${weekdayShort(date)} ${Number(dayNumber(date))} ${monthShort(date)} ${year(date)}`;

/** "17 oct 2026" */
export const shortDate = (date: Date) => `${Number(dayNumber(date))} ${monthShort(date)} ${year(date)}`;

/** ISO 8601 with the Puerto Rico offset, for <time datetime> and structured data. */
export function isoLocal(day: string, time?: string): string {
  return time ? `${day}T${time}:00${OFFSET}` : day;
}

/** A Date as ISO 8601 in Puerto Rico time, e.g. "2026-10-18T08:00:00-04:00". */
export function toLocalIso(date: Date): string {
  const local = new Date(date.getTime() - 4 * 60 * 60 * 1000);
  return `${local.toISOString().slice(0, 19)}${OFFSET}`;
}
