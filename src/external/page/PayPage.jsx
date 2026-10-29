import { useTranslation, translate } from "../../locale/i18n";
import { useLocation, useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import api from "../../baseApi";
import { successPopup } from "../../components/pop-up";
import { earliestBookingDate, isDateBookable } from "../utils/bookingWindow";
import { formatDateTime } from "../../utils/dateTimeFormat";
import { createBookingSeriesPayload, readBookingSeriesConflicts } from "../utils/bookingSeries";
import { describeRequestError, requestErrorDetail } from "../../utils/requestError";

const TERM_MONTHS = { quarter: 3, half: 6, year: 12 };
const WEEKDAYS = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];

const clockMinutes = (value) => {
  const match = typeof value === "string" ? value.match(/^(\d{1,2}):(\d{2})/) : null;
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour <= 24 && minute < 60 ? hour * 60 + minute : null;
};

function PayPage() {
  const t = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [rentalPeriod, setRentalPeriod] = useState("single");
  const [completedBookings, setCompletedBookings] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const submittingRef = useRef(false);

  const {
    fieldName,
    fieldId,
    resourceName,
    resourceIdx,
    date,
    timeRange,
    hours,
    totalPrice,
  } = location.state || {};

  if (!location.state) {
    return (
      <div className="app-page flex items-center justify-center text-slate-900">
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg"
        >
          {t("返回預約頁")}
        </button>
      </div>
    );
  }

  const parseTimeRange = (range) => {
    if (range == null) return null;
    const s = String(range).replaceAll("～", "~");

    const matches = s.match(/\b\d{1,2}:\d{2}\b/g);
    if (!matches || matches.length < 2) return null;

    return { start: matches[0], end: matches[1] };
  };
  const normalizeYmd = (d) => {
    if (!d) return null;

    if (d instanceof Date && !Number.isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    }

    const s = String(d).trim();

    const m = s.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
    if (!m) return null;

    const y = m[1];
    const mo = String(m[2]).padStart(2, "0");
    const da = String(m[3]).padStart(2, "0");
    return `${y}-${mo}-${da}`;
  };

  const toBookingApiTime = (ymd, hhmm) => {
    const d = normalizeYmd(ymd);
    if (!d || !hhmm) return null;

    const parts = d.split("-");
    if (parts.length !== 3) return null;

    const y = Number(parts[0]);
    const mo = Number(parts[1]);
    const da = Number(parts[2]);

    const [hhRaw, mmRaw] = String(hhmm).split(":");
    const hh = Number(hhRaw);
    const mm = Number(mmRaw);

    if ([y, mo, da, hh, mm].some((n) => !Number.isInteger(n))) return null;
    if (hh > 23 || mm > 59) return null;

    const utc = new Date(Date.UTC(y, mo - 1, da, hh, mm));
    if (utc.getUTCFullYear() !== y || utc.getUTCMonth() + 1 !== mo || utc.getUTCDate() !== da) return null;
    return utc.toISOString().replace(".000Z", "Z");
  };

  const bookingItems = Array.isArray(location.state.bookingItems)
    ? location.state.bookingItems
    : [{ fieldId, fieldName, resourceId: resourceIdx, resourceName, date, timeRange, hours, totalPrice }];
  const payableTotal = bookingItems.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);
  const rentalOptions = [
    { value: "single", label: "單次預約", duration: "只預約上方時段" },
    { value: "quarter", label: "季租", duration: "3 個月" },
    { value: "half", label: "半年租", duration: "6 個月" },
    { value: "year", label: "整年租", duration: "12 個月" },
  ];
  const prepared = bookingItems.map((item) => {
    const tr = parseTimeRange(item.timeRange);
    const normalizedDate = normalizeYmd(item.date);
    return {
      item, tr, normalizedDate,
      payload: {
        resource_id: item.resourceId,
        start_time: toBookingApiTime(item.date, tr?.start),
        end_time: toBookingApiTime(item.date, tr?.end),
      },
    };
  });
  const isSeries = rentalPeriod !== "single";
  let seriesPayload = null;
  let seriesValidationError = "";
  if (isSeries) {
    try {
      seriesPayload = createBookingSeriesPayload(prepared, TERM_MONTHS[rentalPeriod]);
      if (completedBookings.length) seriesValidationError = t("已有部分單次預約送出，請先完成剩餘預約。");
    } catch (error) {
      seriesValidationError = error.message;
    }
  }

  async function handlePayment() {
    if (submittingRef.current) return;
    setSubmitError(null);
    setConflicts([]);
    if (!prepared.length || prepared.some(({ payload, tr, normalizedDate }) =>
      !payload.resource_id || !payload.start_time || !payload.end_time || !tr || !normalizedDate)) {
      setSubmitError(t("訂單資料不完整，請返回重新選擇場地與時段。"));
      return;
    }
    if (isSeries && seriesValidationError) {
      setSubmitError(seriesValidationError);
      return;
    }
    if (!isSeries && (!Number.isFinite(payableTotal) || bookingItems.some((item) => !Number.isFinite(Number(item.totalPrice))))) {
      setSubmitError(t("訂單金額無法確認，請返回重新選擇。"));
      return;
    }
    const token = localStorage.getItem("token");

    try {
      submittingRef.current = true;
      setIsSubmitting(true);
      const venueIds = [...new Set(prepared.map(({ item }) => item.fieldId).filter(Boolean))];
      const venueEntries = await Promise.all(venueIds.map(async (id) => {
        const { data } = await api.get(`/locations/${id}`);
        return [String(id), data];
      }));
      const venues = new Map(venueEntries);

      for (const { item, tr, normalizedDate, payload } of prepared) {
        const [year, month, day] = normalizedDate.split("-").map(Number);
        if (!isSeries && !isDateBookable(new Date(year, month - 1, day))) {
          setSubmitError(t("需提前 7 天預約，最早可選 {value0}。請返回重新選擇日期。", { value0: formatDateTime(earliestBookingDate()).numericDate }));
          return;
        }
        const venue = item.fieldId ? venues.get(String(item.fieldId)) : null;
        if (item.fieldId && !venue) {
          setSubmitError(t("無法確認「{value0}」的場地資料，請稍後再試。", { value0: item.fieldName }));
          return;
        }
        if (venue) {
          const opens = clockMinutes(venue.opening_hours_start);
          const closes = clockMinutes(venue.opening_hours_end);
          const startsAt = clockMinutes(tr.start);
          const endsAt = clockMinutes(tr.end);
          console.log("[預約場地] 營業時間檢查", { fieldId: item.fieldId, payload, opening: venue.opening,
            opening_hours_start: venue.opening_hours_start, opening_hours_end: venue.opening_hours_end });
          if (venue.opening === false || opens === null || closes === null || startsAt === null || endsAt === null ||
            startsAt < opens || endsAt > closes || startsAt >= endsAt) {
            setSubmitError(t("「{value0}・{value1}」{value2} 不在可預約時間內（營業時間 {value3}–{value4}）。請返回重新選擇。", { value0: item.fieldName, value1: item.resourceName, value2: item.timeRange, value3: formatDateTime(venue.opening_hours_start).time, value4: formatDateTime(venue.opening_hours_end).time }));
            return;
          }
        }
      }

      if (isSeries) {
        console.log("[季租預約] POST /booking-series", seriesPayload);
        try {
          await api.post("/booking-series", seriesPayload, { headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          } });
        } catch (error) {
          console.error("[季租預約] 送出失敗", { payload: seriesPayload,
            status: error?.response?.status, response: error?.response?.data, message: error?.message });
          if (error?.response?.status === 409) {
            const conflictingSlots = readBookingSeriesConflicts(error.response.data);
            setConflicts(conflictingSlots);
            setSubmitError(conflictingSlots.length
              ? t("以下日期與既有預約衝突，整筆長期預約未建立。請返回調整日期、場面或時段。")
              : t("所選長期時段與既有預約衝突，整筆長期預約未建立。請返回調整後再試。"));
          } else {
            setSubmitError(describeRequestError(error).message);
          }
          return;
        }
        await successPopup(t("長期預約已送出"), t("已送出 {value0} 個月的固定時段預約，請等候審核並依場地方通知於現場付款。", { value0: TERM_MONTHS[rentalPeriod] }));
        navigate("/external/order");
        return;
      }

      const completed = new Set(completedBookings);
      for (const { item, payload } of prepared) {
        const key = `${payload.resource_id}|${payload.start_time}|${payload.end_time}`;
        if (completed.has(key)) continue;
        console.log("[預約場地] POST /bookings", { fieldId: item.fieldId, payload });
        try {
          await api.post("/bookings", payload, { headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          } });
          completed.add(key);
          setCompletedBookings([...completed]);
        } catch (e) {
          console.error("[預約場地] 送出失敗", { fieldId: item.fieldId, payload,
            status: e?.response?.status, response: e?.response?.data, message: e?.message });
          const detail = requestErrorDetail(e);
          const message = /booking must fall within the location's opening hours/i.test(detail)
            ? t("所選時段不在場地可預約時間內，請返回重新選擇。")
            : describeRequestError(e).message;
          setSubmitError(completed.size
            ? translate("已有 {value0} 筆預約成功送出，其餘尚未完成。{value1} 再次送出時會略過已成功的項目。", { value0: completed.size, value1: message })
            : message);
          return;
        }
      }

      await successPopup(t("預約已送出"), t("已送出 {value0} 筆預約，請耐心等候審核，並依場地方通知於現場付款。", { value0: prepared.length }));
      navigate(`/external/order`);
    } catch (e) {
      console.error("[預約場地] 訂單確認失敗", { status: e?.response?.status, message: e?.message });
      setSubmitError(describeRequestError(e).message);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <div className="app-page flex justify-center items-start px-4 py-8 text-slate-900">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-6 space-y-6">

        {/* 標題 */}
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-800">{t("確認預約")}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t("請確認以下訂單資訊")}
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-gray-700">{t("預約項目（")}{bookingItems.length} {t("筆）")}</h2>
          <ul className="max-h-80 space-y-3 overflow-y-auto">
            {bookingItems.map((item, index) => <li key={`${item.resourceId}-${item.date}-${item.timeRange}-${index}`} className="rounded-lg border border-gray-200 p-4 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <strong className="text-gray-800">{item.fieldName}・{item.resourceName || t("場地")}</strong>
                <span className="font-semibold text-blue-700">NT$ {Number(item.totalPrice).toLocaleString("zh-TW")}</span>
              </div>
              <p className="mt-2 text-gray-600">{item.date}　{item.timeRange}　·　{item.hours} {t("小時")}</p>
            </li>)}
          </ul>
        </div>

        <fieldset className="space-y-3 rounded-lg border border-gray-200 p-4">
          <legend className="px-1 font-semibold text-gray-800">{t("預約方式與租期")}</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {rentalOptions.map((option) => <label key={option.value} className={`cursor-pointer rounded-lg border p-3 text-sm ${rentalPeriod === option.value ? "border-blue-600 bg-blue-50 text-blue-800" : "border-gray-200 text-gray-700"}`}>
              <input type="radio" name="rentalPeriod" value={option.value} checked={rentalPeriod === option.value} disabled={isSubmitting || completedBookings.length > 0} onChange={() => { setRentalPeriod(option.value); setSubmitError(null); setConflicts([]); }} className="mr-2 accent-blue-600" />
              <span className="font-semibold">{t(option.label)}</span>
              <span className="mt-1 block text-xs">{t(option.duration)}</span>
            </label>)}
          </div>
          {isSeries ? <div className="space-y-2 text-sm text-slate-700">
            {seriesValidationError ? <p role="alert" className="text-red-700">{seriesValidationError}</p> : <p role="status">
              {t("自 {date} 起，每{days} {time}，連續 {months} 個月。", {
                date: formatDateTime(seriesPayload.start_date).numericDate,
                days: seriesPayload.weekdays.map((day) => t(WEEKDAYS[day])).join(t("、每")),
                time: `${seriesPayload.start_time}–${seriesPayload.end_time}`,
                months: seriesPayload.term_months,
              })}
            </p>}
            <p className="text-xs leading-5 text-slate-500">{t("每筆長期預約固定同一面場地與同一時段；如有任一日期衝突，整筆都不會建立。")}</p>
          </div> : null}
        </fieldset>

        {/* 總金額 */}
        <div className="flex justify-between items-center bg-blue-50 rounded-lg px-4 py-3">
          <span className="text-gray-600 font-medium">{isSeries ? t("所選時段參考金額") : t("現場應付金額")}</span>
          <span className="text-xl font-bold text-blue-600">
            {Number.isFinite(payableTotal) ? `NT$ ${payableTotal.toLocaleString("zh-TW")}` : t("待確認")}
          </span>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
          <h2 className="font-semibold">{t("付款方式：現場付款")}</h2>
          <p className="mt-2 leading-6">{isSeries
            ? t("送出後會一次建立整段租期的預約並等待審核，此頁不會線上扣款。上方僅為本次所選時段的參考金額，長期租期的實際總額請依場地方通知於現場支付。")
            : t("送出後會建立預約並等待審核，此頁不會線上扣款。請依場地方通知，在現場支付上方金額。")}</p>
        </div>

        {completedBookings.length > 0 && <p role="status" className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{t("已成功送出")} {completedBookings.length} / {bookingItems.length} {t("筆預約。")}</p>}
        {submitError && (
          <div role="alert" className="border border-red-200 bg-red-50 text-red-700 rounded-lg px-4 py-2 text-sm">
            {submitError}
            {conflicts.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5">
              {conflicts.map((conflict, index) => {
                const start = formatDateTime(conflict.start_time);
                const end = formatDateTime(conflict.end_time);
                return <li key={`${conflict.start_time}-${index}`}>{start.numericDate} {start.time}–{end.numericDate !== start.numericDate ? `${end.numericDate} ` : ""}{end.time}</li>;
              })}
            </ul>}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handlePayment}
            disabled={isSubmitting || Boolean(seriesValidationError)}
            className={`w-full bg-blue-600 text-white font-semibold py-3 rounded-lg transition ${isSubmitting || seriesValidationError ? "opacity-60 cursor-not-allowed" : "hover:bg-blue-700"}`}
          >
            {isSubmitting ? t("送出中...") : completedBookings.length ? t("重試剩餘預約") : isSeries ? t("送出{period}", { period: t(rentalOptions.find((option) => option.value === rentalPeriod)?.label) }) : t("送出預約")}
          </button>

          <button
            onClick={() => navigate(-1)}
            className="w-full border border-gray-300 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-100 transition"
          >
            {t("返回修改預約")}
          </button>
        </div>


      </div>
    </div>
  );
}

export default PayPage;
