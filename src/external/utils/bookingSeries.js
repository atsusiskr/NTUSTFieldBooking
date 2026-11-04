import { translate } from "../../locale/i18n";
const MINUTES_PER_DAY = 24 * 60;

const clockMinutes = (value) => {
  const match = typeof value === "string" ? value.match(/^(\d{2}):(\d{2})$/) : null;
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours <= 24 && minutes < 60 && (hours !== 24 || minutes === 0)
    ? hours * 60 + minutes : null;
};

export function createBookingSeriesPayload(prepared, termMonths, now = new Date()) {
  if (![3, 6, 12].includes(termMonths)) throw new Error(translate("請選擇有效的租期。"));
  if (!Array.isArray(prepared) || prepared.length === 0) throw new Error(translate("請先選擇場地與時段。"));

  const [first] = prepared;
  const resourceId = first?.item?.resourceId;
  const startTime = first?.tr?.start;
  const endTime = first?.tr?.end;
  const startsAt = clockMinutes(startTime);
  const endsAt = clockMinutes(endTime);
  if (!resourceId || startsAt === null || endsAt === null || startsAt >= endsAt || endsAt > MINUTES_PER_DAY ||
    startsAt % 30 !== 0 || endsAt % 30 !== 0) {
    throw new Error(translate("長期租用時段必須是有效的 30 分鐘間隔，請返回重新選擇。"));
  }

  const weekdays = new Set();
  let startDate = null;
  for (const entry of prepared) {
    if (!entry?.normalizedDate || !entry?.item?.resourceId || !entry?.tr ||
      String(entry.item.resourceId) !== String(resourceId) ||
      (first.item.venueId && entry.item.venueId && String(entry.item.venueId) !== String(first.item.venueId))) {
      throw new Error(translate("季租、半年租及年租只能選同一面場地，請返回調整選取項目。"));
    }
    if (entry.tr.start !== startTime || entry.tr.end !== endTime) {
      throw new Error(translate("同一筆長期預約須使用固定時段，請返回調整選取項目。"));
    }
    const [year, month, day] = entry.normalizedDate.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
      throw new Error(translate("預約日期格式不正確，請返回重新選擇。"));
    }
    if (startDate === null || entry.normalizedDate < startDate) startDate = entry.normalizedDate;
    weekdays.add(date.getDay());
  }

  const [year, month, day] = startDate.split("-").map(Number);
  const firstStart = new Date(year, month - 1, day, Math.floor(startsAt / 60), startsAt % 60);
  if (firstStart <= now) throw new Error(translate("長期預約的起始日期與時段須在未來，請返回重新選擇。"));

  return {
    resource_id: resourceId,
    term_months: termMonths,
    start_date: startDate,
    weekdays: [...weekdays].sort((a, b) => a - b),
    start_time: startTime,
    end_time: endTime,
  };
}

export function readBookingSeriesConflicts(data) {
  return Array.isArray(data?.conflicts)
    ? data.conflicts.filter((conflict) => conflict && (conflict.start_time || conflict.end_time))
    : [];
}
