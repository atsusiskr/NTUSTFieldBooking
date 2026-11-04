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
          {t("返回預約頁")}
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
      setSubmitError(t("找不到 resource_id（請重新選擇場地/球場後再試一次）"));
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
      setSubmitError(t("時段格式無法解析（請返回修改預約）"));
      return;
    }

    const token = localStorage.getItem("token")

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
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      alert(t("訂單已送出！請耐心等候審核。"));
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
          <span>{t("返回場地列表")}</span>
        </button>

        <h1 className="ml-6 text-2xl font-semibold text-gray-900">
          {t("資料填寫")}
        </h1>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto">
        {/* Two-column header venue details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-14 gap-y-2">
          {/* Left: venue */}
          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-3">{t("場地")}</label>
            <div className="w-full rounded-full border border-gray-300 bg-gray-50 px-6 py-3 text-gray-900">
              {venueName || ""}
            </div>
          </div>

          {/* Right: time */}
          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-3">{t("租借時間")}</label>
            <div className="w-full rounded-full border border-gray-300 bg-gray-50 px-6 py-3 flex items-center justify-between">
              <span className="text-gray-900">{normalizeYmd(date) || String(date || "")}</span>
              <span className="text-gray-900">{timeRange || ""}</span>
            </div>
          </div>

          {/* Purpose - full width */}
          <div className="md:col-span-2">
            <label className="block text-lg font-semibold text-gray-900 mb-3">{t("租借事由")}</label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder={t("請輸入事由")}
              className="w-full rounded-full border border-gray-300 bg-gray-50 px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Needs */}
          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-3">{t("租借需求")}</label>
            <input
              type="text"
              value={needs}
              onChange={(e) => setNeeds(e.target.value)}
              placeholder={t("請輸入需求")}
              className="w-full rounded-full border border-gray-300 bg-gray-50 px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Participants */}
          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-3">{t("活動人數")}</label>
            <input
              type="text"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              placeholder={t("請輸入人數")}
              className="w-full rounded-full border border-gray-300 bg-gray-50 px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 3 small inputs row */}
          <div className="md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-3">{t("負責人（領隊）")}</label>
                <input
                  type="text"
                  value={leader}
                  onChange={(e) => setLeader(e.target.value)}
                  placeholder={t("請輸入名字")}
                  className="w-full rounded-full border border-gray-300 bg-gray-50 px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-3">{t("申請人（含電話）")}</label>
                <input
                  type="text"
                  value={applicant}
                  onChange={(e) => setApplicant(e.target.value)}
                  placeholder={t("請輸入名字與電話")}
                  className="w-full rounded-full border border-gray-300 bg-gray-50 px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-3">{t("申請單位")}</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder={t("請輸入單位名稱")}
                  className="w-full rounded-full border border-gray-300 bg-gray-50 px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Card section */}
          <div className="md:col-span-2 my-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-3">{t("銀行代碼")}</label>
                <input
                  type="text"
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  placeholder={t("請輸入代碼")}
                  className="w-full rounded-full border border-gray-300 bg-gray-50 px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-lg font-semibold text-gray-900 mb-3">{t("信用卡號")}</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder={t("請輸入需求")}
                  className="w-full rounded-full border border-gray-300 bg-gray-50 px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-start-2">
                <label className="block text-lg font-semibold text-gray-900 mb-3">{t("安全碼")}</label>
                <input
                  type="password"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  placeholder={t("請輸入代碼")}
                  className="w-full rounded-full border border-gray-300 bg-gray-50 px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-3">{t("期限")}</label>
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
                    {t("借用須知")}
                  </span>
                </div>

                <div className="h-44 w-full overflow-auto p-4 text-sm leading-7 text-gray-800">
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>{t("申請借用場地時，請依本校運動場地管理辦法提出申請；場地借用申請表須先經總務所、管理單位審章同意，並請檢附參加人員名單及活動企劃。")}</li>
                    <li>{t("申請借用及使用場地時，請出示教職員工證或學生證（有效學籍之學生證）。")}</li>
                    <li>{t("如有特殊原因需取消使用時，本室有權利隨時通知申請人停止或改期借用，不得異議。")}</li>
                    <li>{t("使用與登記內容不符或有違本校運動場地管理辦法時，體育室得立即禁止使用者行為。")}</li>
                    <li>{t("未經體育室核准，不得於借用場地進行商業(收費)教學或訓練之行為。")}</li>
                    <li>{t("體育館暨游泳池嚴禁抽煙與進食，違者隨時停止其使用權利。")}</li>
                    <li>{t("請注意維護場內各種設備，倘有毀損情事，應負賠償責任。")}</li>
                    <li>{t("借用場地時，除應維持清潔外，活動後負責將垃圾帶離現場。")}</li>
                    <li>{t("校內單位借用，如在歸還時間內，未按時恢復原狀，停止日後借用之權利申請不得異議。")}</li>
                    <li>{t("體育課程教學優先，不得以任何理由要求讓場。")}</li>
                    <li>{t("基於活動安全之考量，借用者如改用瓦斯或明火烹煮，將暫停借用場地，並不得要求賠償。")}</li>
                    <li>{t("場地借用申請時，校內請於使用日期10-14天前；校外借用30-45天前。(但經簽請本校核准之活動或競賽不在此限。)")}</li>
                    <li>{t("校內借用使用時間：單次借用以三天(含六、日)。")}</li>
                    <li>{t("借用單位應自行負責使用者之活動安全，並符合主管機關安全法規。")}</li>
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
            {isSubmitting ? t("送出中...") : t("完成預約")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PayPage;
