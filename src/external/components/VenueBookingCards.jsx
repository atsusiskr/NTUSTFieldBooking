import { useTranslation, translate } from "../../locale/i18n";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../baseApi";
import { useAuthStore } from "../../store/authStore";
import { earliestBookingDate } from "../utils/bookingWindow";
import { formatDateTime } from "../../utils/dateTimeFormat";
import { bookingSlotKey, groupBookingSlots } from "../utils/bookingSelection";
import { describeRequestError } from "../../utils/requestError";

const HOURS = Array.from({ length: 24 }, (_, index) => index);
const hourText = (hour) => formatDateTime(hour, { input: "hour" }).time;
const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const priceText = (price) => Number.isFinite(Number(price)) ? `NT$ ${Number(price).toLocaleString("zh-TW")}` : translate("價格未提供");
const resourceLabel = (resource, index) => typeof resource?.name === "string" && resource.name.trim() ? resource.name.trim() : translate("第 {value0} 面", { value0: index + 1 });
const availabilityKey = (resourceId, date) => `${resourceId}:${dateKey(date)}`;
const AVAILABILITY_CACHE_MS = 30_000;
const AVAILABILITY_CONCURRENCY = 6;

function timeInMinutes(value, fallback) {
  const match = typeof value === "string" ? value.match(/^(\d{1,2}):(\d{2})/) : null;
  if (!match) return fallback;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours <= 24 && minutes < 60 ? hours * 60 + minutes : fallback;
}

function bookableHours(field) {
  if (!field || field.opening === false) return [];
  const opens = timeInMinutes(field.opening_hours_start, null);
  const closes = timeInMinutes(field.opening_hours_end, null);
  if (opens === null || closes === null || opens >= closes) return [];
  return HOURS.filter((hour) => hour * 60 >= opens && (hour + 1) * 60 < closes);
}

function parseBookingTime(value) {
  // The booking POST sends the selected wall-clock hour with a Z suffix.
  const wallTime = typeof value === "string" ? value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(?:Z|\+00:00)$/i) : null;
  if (wallTime) {
    return new Date(Number(wallTime[1]), Number(wallTime[2]) - 1, Number(wallTime[3]), Number(wallTime[4]), Number(wallTime[5]), Number(wallTime[6] || 0));
  }
  return new Date(value);
}

function slotIsBooked(bookings, resourceId, slotStart) {
  const slotEnd = new Date(slotStart);
  slotEnd.setHours(slotEnd.getHours() + 1);
  return bookings.some((booking) => {
    if (["cancelled", "rejected"].includes(booking.status)) return false;
    if (String(booking.resource_id ?? booking.resource?.id) !== String(resourceId)) return false;
    const start = parseBookingTime(booking.start_time);
    const end = parseBookingTime(booking.end_time);
    return Number.isFinite(start.getTime()) && Number.isFinite(end.getTime()) && start < slotEnd && end > slotStart;
  });
}

export default function VenueBookingCards({ fields, selectedDate, selectedVenueId = null, detailMode = false, sportFilter = null }) {
  const t = useTranslation();
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.userId);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [viewMode, setViewMode] = useState(detailMode ? "week" : "table");
  const [selection, setSelection] = useState([]);
  const [selectionError, setSelectionError] = useState("");
  const availabilityCache = useRef(new Map());
  const [availabilityByKey, setAvailabilityByKey] = useState({});
  const now = new Date();
  const firstBookableDate = earliestBookingDate(now);
  const focusedField = fields.find((field) => String(field.id) === String(selectedVenueId));
  const weekDates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + index);
    return date;
  });
  const availabilityRequests = (viewMode === "week" ? (focusedField ? [focusedField] : []) : fields)
    .filter((field) => bookableHours(field).length > 0)
    .flatMap((field) => field.resources.flatMap((resource) =>
      (viewMode === "week" ? weekDates : [selectedDate]).map((date) => ({ resourceId: resource.id, date: dateKey(date), key: availabilityKey(resource.id, date) }))
    ));
  const availabilityRequestKey = availabilityRequests.map(({ key }) => key).join("|");
  const availabilityLoading = availabilityRequests.some(({ key }) => !availabilityByKey[key]);
  const availabilityError = availabilityRequests.find(({ key }) => availabilityByKey[key]?.error);

  useEffect(() => {
    if (selectedVenueId == null) {
      if (!detailMode) setViewMode("table");
      return;
    }
    setViewMode("week");
  }, [selectedVenueId, detailMode]);

  useEffect(() => {
    let active = true;
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    setLoading(true);
    setError(false);
    if (!userId) {
      setBookings([]);
      setError(t("請先登入，才能確認自己的預約時段。"));
      setLoading(false);
      return () => { active = false; };
    }
    api.get("/bookings", {
      headers: localStorage.getItem("token") ? { Authorization: `Bearer ${localStorage.getItem("token")}` } : undefined,
      params: { user_id: userId, start_time: `${dateKey(start)}T00:00:00Z`, end_time: `${dateKey(end)}T00:00:00Z` },
    }).then((response) => {
      const items = response.data?.items ?? response.data;
      if (!Array.isArray(items)) throw new Error("Invalid bookings response");
      const ownBookings = items.filter((booking) => {
        const bookingUserId = booking.user_id ?? booking.user?.id;
        return bookingUserId == null || String(bookingUserId) === String(userId);
      });
      if (active) setBookings(ownBookings);
    }).catch((requestError) => {
      if (active) { setBookings([]); setError(describeRequestError(requestError).message); }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedDate, userId, t]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const currentTime = Date.now();
    const cached = {};
    const pending = [];
    for (const request of availabilityRequests) {
      const entry = availabilityCache.current.get(request.key);
      if (entry && currentTime - entry.fetchedAt < AVAILABILITY_CACHE_MS) cached[request.key] = entry;
      else pending.push(request);
    }
    setAvailabilityByKey(cached);

    let next = 0;
    async function worker() {
      while (active && next < pending.length) {
        const request = pending[next++];
        try {
          const response = await api.get(`/resources/${encodeURIComponent(request.resourceId)}/availability`, {
            params: { date: request.date }, signal: controller.signal,
          });
          if (!Array.isArray(response.data?.slots) || (response.data.date && response.data.date !== request.date)) {
            throw new Error("Invalid availability response");
          }
          if (!active) return;
          const entry = { slots: response.data.slots, fetchedAt: Date.now() };
          availabilityCache.current.set(request.key, entry);
          setAvailabilityByKey((previous) => ({ ...previous, [request.key]: entry }));
        } catch (requestError) {
          if (!active) return;
          setAvailabilityByKey((previous) => ({ ...previous, [request.key]: { error: describeRequestError(requestError).message } }));
        }
      }
    }
    Promise.all(Array.from({ length: Math.min(AVAILABILITY_CONCURRENCY, pending.length) }, () => worker()));
    return () => { active = false; controller.abort(); };
  // The request list is identified by resource and date, so unchanged views do not refetch.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availabilityRequestKey]);

  const slotStatus = (field, resource, hour, date = selectedDate) => {
    const slotStart = new Date(date);
    slotStart.setHours(hour, 0, 0, 0);
    if (!loading && !error && slotIsBooked(bookings, resource.id, slotStart)) return "我已預約";
    if (!bookableHours(field).includes(hour)) return "未開放";
    if (slotStart <= now) return "已過時段";
    if (slotStart < firstBookableDate) return "需提前 7 天";
    const key = availabilityKey(resource.id, date);
    const availability = availabilityByKey[key] ?? availabilityCache.current.get(key);
    if (!availability || availability.error) return "未確認";
    const slotEnd = new Date(slotStart);
    slotEnd.setHours(slotEnd.getHours() + 1);
    return availability.slots.some((slot) => {
      const start = parseBookingTime(slot.start_time);
      const end = parseBookingTime(slot.end_time);
      return Number.isFinite(start.getTime()) && Number.isFinite(end.getTime()) && start <= slotStart && end >= slotEnd;
    }) ? "可選擇" : "已被預約";
  };
  const isAvailable = (field, resource, hour, date = selectedDate) => slotStatus(field, resource, hour, date) === "可選擇";

  const hasAvailability = (field) => field.resources.some((resource) => bookableHours(field).some((hour) => isAvailable(field, resource, hour)));
  const visibleFields = availableOnly && !availabilityLoading && !availabilityError ? fields.filter(hasAvailability) : fields;
  const visibleHours = [...new Set(visibleFields.flatMap(bookableHours))].sort((a, b) => a - b);
  const focusedHours = bookableHours(focusedField);
  const bookingItems = groupBookingSlots(selection);
  const totalPrice = bookingItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const isSelected = (resource, hour, date) => selection.some((slot) =>
    bookingSlotKey(slot.resourceId, slot.date, slot.hour) === bookingSlotKey(resource.id, dateKey(date), hour)
  );

  function chooseHour(field, resource, hour, date = selectedDate) {
    const day = dateKey(date);
    const key = bookingSlotKey(resource.id, day, hour);
    const alreadySelected = selection.some((slot) => bookingSlotKey(slot.resourceId, slot.date, slot.hour) === key);
    if (!alreadySelected && !isAvailable(field, resource, hour, date)) return;
    setSelectionError("");
    setSelection((previous) => {
      if (previous.some((slot) => bookingSlotKey(slot.resourceId, slot.date, slot.hour) === key)) {
        return previous.filter((slot) => bookingSlotKey(slot.resourceId, slot.date, slot.hour) !== key);
      }
      return [...previous, {
        fieldId: field.id, fieldName: field.name,
        resourceId: resource.id,
        resourceName: resourceLabel(resource, field.resources.indexOf(resource)),
        date: day, hour, price: resource.price,
      }];
    });
  }

  function continueBooking() {
    if (!selection.length || !Number.isFinite(totalPrice)) return;
    const valid = selection.every((slot) => {
      const field = fields.find((item) => String(item.id) === String(slot.fieldId));
      const resource = field?.resources.find((item) => String(item.id) === String(slot.resourceId));
      const [year, month, day] = slot.date.split("-").map(Number);
      return field && resource && isAvailable(field, resource, slot.hour, new Date(year, month - 1, day));
    });
    if (!valid) {
      setSelectionError(t("部分已選時段目前無法預約，請取消該時段或清除選取後重新選擇。"));
      return;
    }
    navigate("/external/pay", { state: { bookingItems, totalPrice } });
  }

  return <section id="venue-booking-section" aria-label={t("場地與可預約時段")} className="mx-auto max-w-7xl scroll-mt-4 px-4 pb-36 sm:px-6">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">{detailMode ? t("預約時段") : t("選擇場地與時段")}</h2>
        <p className="mt-1 text-sm text-slate-600">{viewMode === "week" && focusedField ? translate("{value0}・{value1} 至 {value2}", { value0: focusedField.name, value1: formatDateTime(weekDates[0]).numericDate, value2: formatDateTime(weekDates[6]).numericDate }) : translate("{value0}・{value1} 個場地", { value0: formatDateTime(selectedDate).fullDate, value1: visibleFields.length })}</p>
        <p className="mt-1 text-xs text-slate-500">{t("可同時選擇不同場面與時段；再次點擊已選時段可取消。")}</p>
      </div>
      {!detailMode && <div className="flex flex-wrap gap-2">
        {viewMode !== "week" && <button type="button" aria-pressed={availableOnly} onClick={() => setAvailableOnly((value) => !value)}
          className={`rounded-full border px-4 py-2 text-sm font-semibold ${availableOnly ? "border-blue-700 bg-blue-50 text-blue-700" : "border-slate-300 bg-white text-slate-700"}`}>{t("只看可選時段")}</button>}
        <div role="group" aria-label={t("場地檢視方式")} className="flex overflow-hidden rounded-full border border-slate-300 bg-white text-sm font-semibold">
          <button type="button" aria-pressed={viewMode === "table"} onClick={() => setViewMode("table")}
            className={`px-4 py-2 ${viewMode === "table" ? "bg-blue-700 text-white" : "text-slate-700 hover:bg-slate-50"}`}>{t("多場地單日")}</button>
          {focusedField && <button type="button" aria-pressed={viewMode === "week"} onClick={() => setViewMode("week")}
            className={`border-l border-slate-200 px-4 py-2 ${viewMode === "week" ? "bg-blue-700 text-white" : "text-slate-700 hover:bg-slate-50"}`}>{t("單場地七日")}</button>}
          <button type="button" aria-pressed={viewMode === "cards"} onClick={() => setViewMode("cards")}
            className={`border-l border-slate-200 px-4 py-2 ${viewMode === "cards" ? "bg-blue-700 text-white" : "text-slate-700 hover:bg-slate-50"}`}>{t("卡片")}</button>
        </div>
      </div>}
    </div>
    {(loading || availabilityLoading) && <p role="status" className="mb-4 rounded-xl bg-blue-50 p-4 text-sm text-blue-800">{t("正在確認場地可預約時段…")}</p>}
    {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{t("無法確認我的預約時段：")}{error}</p>}
    {availabilityError && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{t("部分場地時段無法確認：")}{availabilityByKey[availabilityError.key].error}</p>}
    {selectionError && <p role="alert" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{selectionError}</p>}
    {!loading && !availabilityLoading && viewMode !== "week" && !visibleFields.length && <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">{availableOnly ? t("這個日期目前沒有符合條件的場地，試試其他日期。") : t("目前沒有場地資料。")}</p>}
    {viewMode === "table" && visibleFields.length > 0 && !visibleHours.length && <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">{t("目前沒有可顯示的營業時段。")}</p>}
    {viewMode === "week" && focusedField && !focusedHours.length && <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">{focusedField.opening === false ? t("此場地目前暫停開放。") : t("目前沒有可顯示的營業時段。")}</p>}
    {viewMode === "table" && visibleHours.length > 0 && <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-max border-collapse text-center text-sm">
        <thead><tr className="bg-blue-50">
          <th scope="col" className="sticky left-0 z-20 w-[76px] min-w-[76px] border-b border-r border-slate-200 bg-blue-50 px-1 py-4 text-slate-800 sm:w-32 sm:min-w-32 sm:px-3">{t("時段")}</th>
          {visibleFields.map((field) => <th id={`venue-${field.id}`} key={field.id} scope="col" className="min-w-44 border-b border-r border-slate-200 px-4 py-3 text-slate-900">
            <button type="button" onClick={() => navigate(`/external/${field.id}`, { state: { venueSportFilter: sportFilter } })} className="font-bold text-blue-800 hover:underline">{field.name}</button>
            <span className="mt-1 block text-xs font-normal text-slate-600">{field.resources.length} {t("面場地")}</span>
          </th>)}
        </tr></thead>
        <tbody>{visibleHours.map((hour) => <tr key={hour}>
          <th scope="row" aria-label={translate("{value0} 至 {value1}", { value0: hourText(hour), value1: hourText(hour + 1) })} className="sticky left-0 z-10 w-[76px] min-w-[76px] border-b border-r border-slate-200 bg-slate-50 px-1 py-2 font-semibold text-slate-800 sm:w-32 sm:min-w-32 sm:px-3 sm:py-3">
            <span className="flex flex-col items-center text-[11px] leading-4 sm:hidden"><span>{hourText(hour)}</span><span className="text-slate-500">{t("至")} {hourText(hour + 1)}</span></span>
            <span className="hidden whitespace-nowrap sm:inline">{hourText(hour)}–{hourText(hour + 1)}</span>
          </th>
          {visibleFields.map((field) => <td key={field.id} className="border-b border-r border-slate-200 px-3 py-2">
            {bookableHours(field).includes(hour) ? <div className="flex min-w-max justify-center gap-2">{field.resources.map((resource, index) => {
              const status = slotStatus(field, resource, hour);
              const available = status === "可選擇";
              const selected = isSelected(resource, hour, selectedDate);
              return <button key={resource.id} type="button" disabled={!available && !selected} onClick={() => chooseHour(field, resource, hour)} aria-pressed={selected}
                aria-label={translate("{value0}{value1} {value2} 至 {value3}，{value4}", { value0: field.name, value1: resourceLabel(resource, index), value2: hourText(hour), value3: hourText(hour + 1), value4: t(status) })}
                title={translate("{value0}・{value1} / 小時", { value0: resourceLabel(resource, index), value1: priceText(resource.price) })}
                className={`min-h-11 min-w-16 rounded-lg border px-3 py-1 font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${selected ? "border-blue-700 bg-blue-700 text-white" : available ? "border-blue-200 bg-blue-50 text-blue-800 hover:border-blue-600 hover:bg-blue-100" : status === "我已預約" ? "cursor-not-allowed border-amber-200 bg-amber-50 text-amber-800" : "cursor-not-allowed border-slate-100 bg-slate-100 text-slate-400"}`}>
                <span className="block">{resourceLabel(resource, index)}</span>{["需提前 7 天", "我已預約", "已被預約", "未確認"].includes(status) && <span className="block text-[10px] font-normal">{t(status)}</span>}
              </button>;
            })}</div> : <span className="text-xs text-slate-400">{t("非營業時間")}</span>}
          </td>)}
        </tr>)}</tbody>
      </table>
    </div>}
    {viewMode === "week" && focusedField && focusedHours.length > 0 && <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-max border-collapse text-center text-sm">
        <thead><tr className="bg-blue-50">
          <th scope="col" className="sticky left-0 z-20 w-[76px] min-w-[76px] border-b border-r border-slate-200 bg-blue-50 px-1 py-4 text-slate-800 sm:w-32 sm:min-w-32 sm:px-3">{t("時段")}</th>
          {weekDates.map((date) => <th key={dateKey(date)} scope="col" className="min-w-36 border-b border-r border-slate-200 px-3 py-3 text-slate-900">
            <span className="block font-bold">{formatDateTime(date).shortDate}</span>
          </th>)}
        </tr></thead>
        <tbody>{focusedHours.map((hour) => <tr key={hour}>
          <th scope="row" aria-label={translate("{value0} 至 {value1}", { value0: hourText(hour), value1: hourText(hour + 1) })} className="sticky left-0 z-10 w-[76px] min-w-[76px] border-b border-r border-slate-200 bg-slate-50 px-1 py-2 font-semibold text-slate-800 sm:w-32 sm:min-w-32 sm:px-3 sm:py-3">
            <span className="flex flex-col items-center text-[11px] leading-4 sm:hidden"><span>{hourText(hour)}</span><span className="text-slate-500">{t("至")} {hourText(hour + 1)}</span></span>
            <span className="hidden whitespace-nowrap sm:inline">{hourText(hour)}–{hourText(hour + 1)}</span>
          </th>
          {weekDates.map((date) => <td key={dateKey(date)} className="border-b border-r border-slate-200 px-2 py-2">
            <div className="flex min-w-max justify-center gap-2">{focusedField.resources.map((resource, index) => {
              const status = slotStatus(focusedField, resource, hour, date);
              const available = status === "可選擇";
              const selected = isSelected(resource, hour, date);
              return <button key={resource.id} type="button" disabled={!available && !selected} onClick={() => chooseHour(focusedField, resource, hour, date)} aria-pressed={Boolean(selected)}
                aria-label={translate("{value0} {value1} {value2} 至 {value3}，{value4}", { value0: formatDateTime(date).date, value1: resourceLabel(resource, index), value2: hourText(hour), value3: hourText(hour + 1), value4: t(status) })}
                title={translate("{value0}・{value1} / 小時", { value0: resourceLabel(resource, index), value1: priceText(resource.price) })}
                className={`min-h-11 min-w-20 rounded-lg border px-2 py-1 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${selected ? "border-blue-700 bg-blue-700 text-white" : available ? "border-blue-200 bg-blue-50 text-blue-800 hover:border-blue-600 hover:bg-blue-100" : status === "我已預約" ? "cursor-not-allowed border-amber-200 bg-amber-50 text-amber-800" : "cursor-not-allowed border-slate-100 bg-slate-100 text-slate-400"}`}>
                <span className="block">{resourceLabel(resource, index)}</span><span className="block text-[10px] font-normal">{t(status)}</span>
              </button>;
            })}</div>
          </td>)}
        </tr>)}</tbody>
      </table>
    </div>}
    {viewMode === "cards" && <div className="grid gap-5 lg:grid-cols-2">
      {visibleFields.map((field) => <article id={`venue-${field.id}`} key={field.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div><h3 className="text-xl font-bold text-slate-900">{field.name}</h3><p className="mt-2 text-sm text-slate-600">{field.location_info || t("位置未提供")}</p></div>
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${hasAvailability(field) ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
              {availabilityLoading ? t("確認中") : availabilityError ? t("部分未確認") : hasAvailability(field) ? t("有可選時段") : t("暫無空位")}
            </span>
          </div>
          <p className="mt-4 text-sm text-slate-600">{t("開放時間")} {formatDateTime(field.opening_hours_start).time}–{formatDateTime(field.opening_hours_end).time}　・　{field.resources.length} {t("面場地")}</p>
        </div>
        <div className="space-y-5 p-5 sm:p-6">
          {field.resources.map((resource, index) => <div key={resource.id}>
            <div className="mb-2 flex items-center justify-between gap-2"><h4 className="font-semibold">{resourceLabel(resource, index)}</h4><span className="text-sm text-slate-600">{priceText(resource.price)} {t("/ 小時")}</span></div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {bookableHours(field).map((hour) => {
                const status = slotStatus(field, resource, hour);
                const available = status === "可選擇";
                const selected = isSelected(resource, hour, selectedDate);
                return <button key={hour} type="button" disabled={!available && !selected} onClick={() => chooseHour(field, resource, hour)} aria-pressed={selected}
                  aria-label={translate("{value0} {value1} 至 {value2}，{value3}", { value0: resourceLabel(resource, index), value1: hourText(hour), value2: hourText(hour + 1), value3: t(status) })}
                  className={`min-h-11 rounded-lg border px-2 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${selected ? "border-blue-700 bg-blue-700 text-white" : available ? "border-blue-200 bg-blue-50 text-blue-800 hover:border-blue-600 hover:bg-blue-100" : status === "我已預約" ? "cursor-not-allowed border-amber-200 bg-amber-50 text-amber-800" : "cursor-not-allowed border-slate-100 bg-slate-100 text-slate-400"}`}><span className="block">{hourText(hour)}</span>{["需提前 7 天", "我已預約"].includes(status) && <span className="block text-[10px]">{t(status)}</span>}</button>;
              })}
            </div>
          </div>)}
          {!bookableHours(field).length && <p className="text-sm text-slate-500">{field.opening === false ? t("此場地暫停開放。") : t("目前沒有可顯示的營業時段。")}</p>}
          <button type="button" onClick={() => navigate(`/external/${field.id}`, { state: { venueSportFilter: sportFilter } })} className="text-sm font-semibold text-blue-700 hover:underline">{t("查看場地詳情 →")}</button>
        </div>
      </article>)}
    </div>}
    {selection.length > 0 && <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white px-4 py-3 shadow-2xl sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 sm:flex-nowrap">
        <div className="min-w-0 flex-1 text-sm"><p className="font-bold">{t("已選")} {selection.length} {t("個時段・")}{bookingItems.length} {t("筆預約")}</p><p className={selectionError ? "text-red-700" : "text-slate-600"}>{selectionError || t("可複選不同場面、日期及不連續時段")}</p></div>
        <strong className="text-lg text-blue-800">{priceText(totalPrice)}</strong>
        <button type="button" onClick={continueBooking} className="min-h-11 rounded-xl bg-blue-700 px-5 py-2 font-semibold text-white hover:bg-blue-800">{t("前往確認")}</button>
        <button type="button" onClick={() => { setSelection([]); setSelectionError(""); }} aria-label={t("清除選取")} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100">✕</button>
      </div>
    </div>}
  </section>;
}
