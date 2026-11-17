import { useTranslation } from "../../locale/i18n";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Navbar from "../components/navbar";
import { successPopup, errorPopup } from "../../components/pop-up";
import { describeRequestError } from "../../utils/requestError";

function HostApplyPage() {
  const t = useTranslation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 表單狀態
  const [formData, setFormData] = useState({
    realName: "",
    phone: "",
    lineId: "",
    reason: "",
    agreeTerms: false,
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 基本防呆
    if (!formData.realName || !formData.phone || !formData.reason) {
      errorPopup(t("hostApplyPage.errors.error"), t("hostApplyPage.errors.pleaseFillRequired"));
      return;
    }
    if (!formData.agreeTerms) {
      errorPopup(t("hostApplyPage.errors.error"), t("hostApplyPage.errors.pleaseOrganizer"));
      return;
    }

    try {
      setIsSubmitting(true);

      // 這裡換成你真實的 API 呼叫
      // await api.post("/users/apply-host", formData);

      // 模擬網路延遲
      await new Promise(resolve => setTimeout(resolve, 1000));

      successPopup(t("hostApplyPage.feedback.submitSuccess"), t("hostApplyPage.feedback.applyAlreadySubmitDayReview"));
      navigate("/external/pickup");
    } catch (error) {
      const failure = describeRequestError(error);
      errorPopup(failure.title, failure.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-page pb-12 text-slate-900">
      <Navbar />

      <div className="flex justify-center items-start px-4 mt-8">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 space-y-6">

          {/* 標題區 */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">{t("hostApplyPage.headings.applyPickupGroup")}</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 區塊：基本資料 */}
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-gray-800 border-b pb-2">
                {t("hostApplyPage.headings.organizerData")}
              </h2>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  {t("hostApplyPage.labels.realName")}
                </label>
                <input
                  type="text"
                  name="realName"
                  value={formData.realName}
                  onChange={handleInputChange}
                  placeholder={t("hostApplyPage.placeholders.pleaseEnter")}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  {t("hostApplyPage.labels.phone")}
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder={t("hostApplyPage.placeholders.enterPhone")}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  LINE ID
                </label>
                <input
                  type="text"
                  name="lineId"
                  value={formData.lineId}
                  onChange={handleInputChange}
                  placeholder={t("hostApplyPage.placeholders.helpPlayersContactYou")}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 區塊：開團計畫 */}
            <div className="space-y-4 mt-6">
              <h2 className="text-base font-semibold text-gray-800 border-b pb-2">
                {t("hostApplyPage.headings.hostingPlan")}
              </h2>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  {t("hostApplyPage.labels.organizer")}
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder={t("hostApplyPage.placeholders.people")}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            {/* 條款與同意 */}
            <div className="bg-blue-50 rounded-lg p-4 text-sm text-gray-700">
              <p className="font-semibold mb-2">{t("hostApplyPage.messages.organizer")}</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>{t("hostApplyPage.messages.or")}</li>
                <li>{t("hostApplyPage.messages.organizerVenueFeeAndRefund")}</li>
                <li>{t("hostApplyPage.messages.permission")}</li>
              </ul>

              <div className="mt-4 flex items-start gap-2">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleInputChange}
                  className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="agreeTerms" className="text-sm font-medium text-gray-800 cursor-pointer">
                  {t("hostApplyPage.labels.alreadyDetailsOrganizer")}
                </label>
              </div>
            </div>

            {/* 按鈕區 */}
            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full bg-blue-600 text-white font-semibold py-3 rounded-lg transition ${isSubmitting ? "opacity-60 cursor-not-allowed" : "hover:bg-blue-700"}`}
              >
                {isSubmitting ? t("hostApplyPage.actions.submitReview") : t("hostApplyPage.actions.confirmSubmitApply")}
              </button>

              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-full border border-gray-300 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-100 transition"
              >
                {t("hostApplyPage.actions.cancelBack")}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}

export default HostApplyPage;
