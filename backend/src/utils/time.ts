/**
 * Time utility for Asia/Kolkata (IST) timezone and dynamic greeting resolution.
 */

export interface KolkataTimeDetails {
  currentDate: string; // YYYY-MM-DD
  currentTime: string; // HH:mm (24-hour)
  timeFormatted: string; // hh:mm A (12-hour with AM/PM)
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  greeting: string;
}

/**
 * Returns date, time and dynamic greeting based on current IST time.
 * Follows strict greeting rules:
 * - 05:00 AM to 11:59 AM: Good morning
 * - 12:00 PM to 04:59 PM: Good afternoon
 * - 05:00 PM to 04:59 AM: Good evening
 */
export function getKolkataTimeDetails(now: Date = new Date()): KolkataTimeDetails {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const year = parts.find((p) => p.type === 'year')?.value ?? '2026';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  const hourStr = parts.find((p) => p.type === 'hour')?.value ?? '00';
  const minuteStr = parts.find((p) => p.type === 'minute')?.value ?? '00';

  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  const totalMinutes = hour * 60 + minute;

  const currentDate = `${year}-${month}-${day}`;
  const currentTime = `${hourStr.padStart(2, '0')}:${minuteStr.padStart(2, '0')}`;

  let timeOfDay: 'morning' | 'afternoon' | 'evening';
  let greeting: string;

  // 05:00 AM to 11:59 AM (300 <= totalMinutes < 720)
  if (totalMinutes >= 300 && totalMinutes < 720) {
    timeOfDay = 'morning';
    greeting = 'Hey, Namaste! Good morning. Welcome to our Community Hall Booking service. How may I help you today?';
  }
  // 12:00 PM to 04:59 PM (720 <= totalMinutes < 1020)
  else if (totalMinutes >= 720 && totalMinutes < 1020) {
    timeOfDay = 'afternoon';
    greeting = 'Hey, Namaste! Good afternoon. Welcome to our Community Hall Booking service. How may I help you today?';
  }
  // 05:00 PM to 04:59 AM (totalMinutes >= 1020 || totalMinutes < 300)
  else {
    timeOfDay = 'evening';
    greeting = 'Hey, Namaste! Good evening. Welcome to our Community Hall Booking service. How may I help you today?';
  }

  const hour12 = hour % 12 || 12;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const timeFormatted = `${String(hour12).padStart(2, '0')}:${minuteStr.padStart(2, '0')} ${ampm}`;

  return {
    currentDate,
    currentTime,
    timeFormatted,
    timeOfDay,
    greeting,
  };
}

export function getKolkataCurrentDate(): string {
  return getKolkataTimeDetails().currentDate;
}
