import { useTranslation } from "../../locale/i18n";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../../baseApi";
import { describeRequestError } from "../../utils/requestError";

function PayPage() {
  const t = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [purpose, setPurpose] = useState("");
  const [needs, setNeeds] = useState("");
  const [participants, setParticipants] = useState("");
  const [leader, setLeader] = useState("");
  const [applicant, setApplicant] = useState("");
  const [unit, setUnit] = useState("");

  const [bankCode, setBankCode] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cvc, setCvc] = useState("");
  const [expiry, setExpiry] = useState("");

  const {
    venueName,
    venueKey,
    resourceId,
    date,
    timeRange,
  } = location.state || {};

  if (!location.state) {
    return (
      <div className="app-page flex items-center justify-center">
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg"
        >
          {t("internalPayPage.actions.backBooking")}
        </button>
      </div>
    );
  }

  const extractFirstUuid = (s) => {
    if (typeof s !== "string") return null;
    const m = s.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    return m ? m[0] : null;
  };

  const parseTimeRange = (range) => {
    if (range == null) return null;
    const s = String(range).replaceAll("～", "~");

    // Extract first two HH:mm tokens anywhere in the string
    const matches = s.match(/\b\d{1,2}:\d{2}\b/g);
    if (!matches || matches.length < 2) return null;

    return { start: matches[0], end: matches[1] };
  };

  const normalizeYmd = (d) => {
    if (!d) return null;

    // If it's a Date object
    if (d instanceof Date && !Number.isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    }

    const s = String(d).trim();

    // Try to extract YYYY-MM-DD or YYYY/MM/DD anywhere in the string
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

  const resolvedResourceId = resourceId ?? extractFirstUuid(venueKey);

  async function handlePayment() {
    setSubmitError(null);

    if (!resolvedResourceId) {
      setSubmitError(t("internalPayPage.errors.resourceIdPleaseRetrySelectVenueCourt"));
      return;
    }

    const tr = parseTimeRange(timeRange);
    const start_time = toBookingApiTime(date, tr?.start);
    const end_time = toBookingApiTime(date, tr?.end);

    console.log({
      resolvedResourceId,
      rawDate: date,
      rawTimeRange: timeRange,
      parsedDate: normalizeYmd(date),
      parsedTimeRange: tr,
      start_time,
      end_time,
    });

    if (!start_time || !end_time) {
      setSubmitError(t("internalPayPage.errors.timeSlotCannotPleaseBackBooking"));
      return;
    }


    try {
      setIsSubmitting(true);

      await api.post(
        "/bookings",
        {
          resource_id: resolvedResourceId,
          start_time,
          end_time,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      alert(t("internalPayPage.feedback.orderAlreadySubmitPleaseReview"));
      navigate(`/ntust/order`);
    } catch (e) {
      setSubmitError(describeRequestError(e).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="app-page px-6 py-6">
      {/* Top bar */}
      <div className="flex items-center mb-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          type="button"
        >
          <span aria-hidden>←</span>
          <span>{t("common.messages.backToVenues")}</span>
        </button>

        <h1 className="ml-6 text-2xl font-semibold text-gray-900">
          {t("internalPayPage.headings.dataFill")}
        </h1>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto">
        {/* Two-column header venue details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-14 gap-y-2">
          {/* Left: venue */}
          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-3">{t("common.labels.venue")}</label>
            <div className="w-full rounded-full border border-gray-300 bg-gray-50 px-6 py-3 text-gray-900">
              {venueName || ""}
            </div>
          </div>

          {/* Right: time */}
          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-3">{t("internalPayPage.labels.time")}</label>
            <div className="w-full rounded-full border border-gray-300 bg-gray-50 px-6 py-3 flex items-center justify-between">
              <span className="text-gray-900">{normalizeYmd(date) || String(date || "")}</span>
              <span className="text-gray-900">{timeRange || ""}</span>
            </div>
          </div>

          {/* Purpose - full width */}
          <div className="md:col-span-2">
            <label className="block text-lg font-semibold text-gray-900 mb-3">{t("internalPayPage.labels.rentalReason")}</label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder={t("internalPayPage.placeholders.pleaseEnter")}
              className="w-full rounded-full border border-gray-300 bg-gray-50 px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Needs */}
          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-3">{t("internalPayPage.labels.rentalNeeds")}</label>
            <input
              type="text"
              value={needs}
              onChange={(e) => setNeeds(e.target.value)}
              placeholder={t("internalPayPage.placeholders.enterNeeds")}
              className="w-full rounded-full border border-gray-300 bg-gray-50 px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Participants */}
          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-3">{t("internalPayPage.labels.peopleCount")}</label>
            <input
              type="text"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              placeholder={t("internalPayPage.placeholders.pleaseEnterPeopleCount")}
              className="w-full rounded-full border border-gray-300 bg-gray-50 px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 3 small inputs row */}
          <div className="md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-3">{t("internalPayPage.labels.people")}</label>
                <input
                  type="text"
                  value={leader}
                  onChange={(e) => setLeader(e.target.value)}
                  placeholder={t("internalPayPage.placeholders.enterName")}
                  className="w-full rounded-full border border-gray-300 bg-gray-50 px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-3">{t("internalPayPage.labels.applyPeoplePhone")}</label>
                <input
                  type="text"
                  value={applicant}
                  onChange={(e) => setApplicant(e.target.value)}
                  placeholder={t("internalPayPage.placeholders.pleaseEnterAndPhone")}
                  className="w-full rounded-full border border-gray-300 bg-gray-50 px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-3">{t("internalPayPage.labels.apply")}</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder={t("internalPayPage.placeholders.pleaseEnterName")}
                  className="w-full rounded-full border border-gray-300 bg-gray-50 px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Card section */}
          <div className="md:col-span-2 my-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-3">{t("internalPayPage.labels.bankCode")}</label>
                <input
                  type="text"
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  placeholder={t("internalPayPage.placeholders.enterCode")}
                  className="w-full rounded-full border border-gray-300 bg-gray-50 px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-lg font-semibold text-gray-900 mb-3">{t("internalPayPage.labels.cardNumber")}</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder={t("internalPayPage.placeholders.enterNeeds")}
                  className="w-full rounded-full border border-gray-300 bg-gray-50 px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-start-2">
                <label className="block text-lg font-semibold text-gray-900 mb-3">{t("internalPayPage.labels.securityCode")}</label>
                <input
                  type="password"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  placeholder={t("internalPayPage.placeholders.enterCode")}
                  className="w-full rounded-full border border-gray-300 bg-gray-50 px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-3">{t("internalPayPage.labels.expiration")}</label>
                <input
                  type="text"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  placeholder="YY/MM"
                  className="w-full rounded-full border border-gray-300 bg-gray-50 px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Terms box */}
          <div className="md:col-span-2">
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <div className="flex">
                <div className="w-14 shrink-0 border-r border-gray-300 flex items-center justify-center">
                  <span className="text-gray-800 font-semibold" style={{ writingMode: "vertical-rl" }}>
                    {t("internalPayPage.messages.rentalGuidelines")}
                  </span>
                </div>

                <div className="h-44 w-full overflow-auto p-4 text-sm leading-7 text-gray-800">
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>{t("internalPayPage.messages.applyVenuePleaseVenueApplyVenueApply")}</li>
                    <li>{t("internalPayPage.messages.applyAndVenuePleaseOrValid")}</li>
                    <li>{t("internalPayPage.messages.cancelNotificationApplyPeopleOr")}</li>
                    <li>{t("internalPayPage.messages.andContentOrVenueUser")}</li>
                    <li>{t("internalPayPage.messages.venueChargeOr")}</li>
                    <li>{t("internalPayPage.messages.and")}</li>
                    <li>{t("internalPayPage.messages.please")}</li>
                    <li>{t("internalPayPage.messages.venue")}</li>
                    <li>{t("internalPayPage.messages.timeApply")}</li>
                    <li>{t("internalPayPage.messages.sportsClassesTakePriority")}</li>
                    <li>{t("internalPayPage.messages.orPausedVenue")}</li>
                    <li>{t("internalPayPage.messages.venueApplyPleaseDateDayDayPlease")}</li>
                    <li>{t("internalPayPage.messages.timeSingleDay")}</li>
                    <li>{t("internalPayPage.messages.user")}</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        {submitError && (
          <div className="mt-6 border border-red-200 bg-red-50 text-red-700 rounded-lg px-4 py-2 text-sm">
            {submitError}
          </div>
        )}

        {/* Bottom button */}
        <div className="mt-8">
          <button
            onClick={handlePayment}
            disabled={isSubmitting}
            className={`w-full bg-blue-600 text-white font-semibold py-4 rounded-lg transition ${
              isSubmitting ? "opacity-60 cursor-not-allowed" : "hover:bg-blue-700"
            }`}
          >
            {isSubmitting ? t("common.actions.submitting") : t("common.actions.completeBooking")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PayPage;
