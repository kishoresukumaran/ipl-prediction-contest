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
