import { formatDateTime } from "../../utils/dateTimeFormat";

export const bookingSlotKey = (resourceId, date, hour) => `${resourceId}|${date}|${hour}`;

export function groupBookingSlots(slots) {
  const ordered = [...slots].sort((a, b) =>
    a.date.localeCompare(b.date) || String(a.fieldId).localeCompare(String(b.fieldId)) ||
    String(a.resourceId).localeCompare(String(b.resourceId)) || a.hour - b.hour
  );
  const groups = [];

  for (const slot of ordered) {
    const last = groups[groups.length - 1];
    if (last && last.date === slot.date && last.fieldId === slot.fieldId &&
      last.resourceId === slot.resourceId && last.endHour === slot.hour) {
      last.endHour += 1;
      last.hours += 1;
      last.totalPrice += Number(slot.price);
    } else {
      groups.push({
        fieldId: slot.fieldId,
        fieldName: slot.fieldName,
        resourceId: slot.resourceId,
        resourceName: slot.resourceName,
        date: slot.date,
        startHour: slot.hour,
        endHour: slot.hour + 1,
        hours: 1,
        totalPrice: Number(slot.price),
      });
    }
  }

  return groups.map(({ startHour, endHour, ...group }) => ({
    ...group,
    timeRange: `${formatDateTime(startHour, { input: "hour" }).time} - ${formatDateTime(endHour, { input: "hour" }).time}`,
  }));
}
