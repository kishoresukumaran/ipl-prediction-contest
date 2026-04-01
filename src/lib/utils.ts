import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert IST match time to Irish time (Europe/Dublin).
 * Match times are stored as "19:30" or "15:30" in IST (UTC+5:30).
 * Returns formatted time string in Irish timezone (GMT/IST depending on DST).
 */
export function matchTimeToIrish(matchDate: string, istTime: string): string {
  // Build a Date in IST (UTC+5:30)
  const utcDate = new Date(`${matchDate}T${istTime}:00+05:30`);
  return utcDate.toLocaleTimeString('en-IE', {
    timeZone: 'Europe/Dublin',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Get a full Date object for a match in UTC, given date and IST time.
 */
export function matchDateTimeUTC(matchDate: string, istTime: string): Date {
  return new Date(`${matchDate}T${istTime}:00+05:30`);
}

/**
 * Convert a UTC/ISO timestamp to a datetime-local input value in Irish time.
 * Returns "YYYY-MM-DDTHH:MM" formatted in Europe/Dublin timezone.
 * Used by the admin predictions page for the datetime-local input.
 */
export function toIrishDatetimeLocal(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Dublin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find(p => p.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

/**
 * Format a UTC/ISO prediction timestamp for display in Irish time.
 * Returns a human-readable string like "Mar 29, 2:15 PM".
 */
export function predictionTimeToIrish(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleString('en-US', {
    timeZone: 'Europe/Dublin',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
