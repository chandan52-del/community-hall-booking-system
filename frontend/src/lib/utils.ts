import type { Booking, Maintenance } from '../types/booking';

/** Bengaluru timezone — all dates in the app are interpreted here. */
export const TIMEZONE = 'Asia/Kolkata';

/** Today's date as YYYY-MM-DD in Bengaluru, regardless of the visitor's machine timezone. */
export const todayIST = (): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(new Date());

export const formatINR = (value: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

/** "2026-11-20" -> "20 Nov 2026" (parsed as a calendar date, no timezone shift). */
export const formatDate = (iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }): string => {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-IN', { ...opts, timeZone: 'UTC' });
};

/** "18:30" -> "6:30 pm" */
export const formatTime = (hhmm: string): string => {
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h)) return hhmm;
  const suffix = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m ?? 0).padStart(2, '0')} ${suffix}`;
};

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
};

export interface Conflict {
  kind: 'booking' | 'maintenance';
  label: string;
}

/**
 * Business rule (mirrors what the backend will enforce in Phase 3):
 *  - a hall cannot have two APPROVED bookings whose time ranges overlap on the same date
 *  - a hall cannot be booked on a date covered by Scheduled / In-Progress maintenance
 * Pending requests never block anything — the admin resolves them on approval.
 */
export const findConflicts = (
  candidate: Pick<Booking, 'id' | 'hallId' | 'eventDate' | 'startTime' | 'endTime'>,
  bookings: Booking[],
  maintenance: Maintenance[],
): Conflict[] => {
  const conflicts: Conflict[] = [];
  const start = toMinutes(candidate.startTime);
  const end = toMinutes(candidate.endTime);

  bookings.forEach((b) => {
    if (b.id === candidate.id || b.hallId !== candidate.hallId || b.status !== 'Approved') return;
    if (b.eventDate !== candidate.eventDate) return;
    // Two ranges overlap when each one starts before the other ends.
    if (start < toMinutes(b.endTime) && toMinutes(b.startTime) < end) {
      conflicts.push({
        kind: 'booking',
        label: `Approved booking ${b.id} (${formatTime(b.startTime)}–${formatTime(b.endTime)})`,
      });
    }
  });

  maintenance.forEach((m) => {
    if (m.hallId !== candidate.hallId) return;
    if (m.status !== 'Scheduled' && m.status !== 'In Progress') return;
    if (candidate.eventDate >= m.startDate && candidate.eventDate <= m.endDate) {
      conflicts.push({
        kind: 'maintenance',
        label: `Maintenance ${m.id}: ${formatDate(m.startDate)} – ${formatDate(m.endDate)}`,
      });
    }
  });

  return conflicts;
};

/** Is a hall blocked by active maintenance on a given date? */
export const maintenanceOn = (hallId: string, date: string, maintenance: Maintenance[]) =>
  maintenance.find(
    (m) => m.hallId === hallId && (m.status === 'Scheduled' || m.status === 'In Progress') && date >= m.startDate && date <= m.endDate,
  );

export const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');
