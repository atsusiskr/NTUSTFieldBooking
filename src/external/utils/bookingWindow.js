export const BOOKING_LEAD_DAYS = 7;

export function earliestBookingDate(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + BOOKING_LEAD_DAYS);
}

export function isDateBookable(date, now = new Date()) {
  return date instanceof Date && !Number.isNaN(date.getTime()) && date >= earliestBookingDate(now);
}
