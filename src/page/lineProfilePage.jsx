import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Loading from "../components/loading";
import Calendar from "../components/dayPicker/dayPick";
import { useTranslation } from "../locale/i18n";
import { logoutService } from "../service/authService";
import { getUserProfile, updateUserProfile } from "../service/userService";
import { describeRequestError } from "../utils/requestError";
import { isValidBirthDate, isValidPhoneNumber, normalizePhoneNumber } from "../utils/validator";

const inputClass = "mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const formatBirthDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const parseBirthDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
};

function LineProfilePage() {
  const t = useTranslation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ display_name: "", gender: "", birth_date: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getUserProfile().then((user) => {
      if (cancelled) return;
      setProfile(user);
      setForm({
        display_name: user.display_name || "",
        gender: user.gender || "",
        birth_date: user.birth_date?.slice(0, 10) || "",
        phone: user.phone || "",
      });
    }).catch((reason) => {
      if (!cancelled) setError(describeRequestError(reason).message);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    if (!form.display_name.trim() || !form.gender || !form.birth_date) {
      setError(t("請填寫顯示名稱、性別與出生日期。"));
      return;
    }
    if (!["male", "female", "other"].includes(form.gender) || !isValidBirthDate(form.birth_date)) {
      setError(t("請選擇有效的性別與出生日期。"));
      return;
    }
    if (!isValidPhoneNumber(form.phone)) {
      setError(t("請輸入有效的手機號碼"));
      return;
    }

    const data = {
      display_name: form.display_name.trim(),
      gender: form.gender,
      birth_date: form.birth_date,
    };
    const phone = normalizePhoneNumber(form.phone);
    if (phone || profile?.phone) data.phone = phone;

    setError("");
    setSaving(true);
    try {
      await updateUserProfile(data);
      navigate("/external/group", { replace: true });
    } catch (reason) {
      setError(describeRequestError(reason).message);
    } finally {
      setSaving(false);
    }
  };

  const handleReturnToLogin = async () => {
    if (signingOut || saving) return;
    setError("");
    setSigningOut(true);
    try {
      await logoutService();
      navigate("/", { replace: true });
    } catch (reason) {
      setError(describeRequestError(reason).message);
      setSigningOut(false);
    }
  };

  if (loading) return <Loading isLoading text={t("正在載入基本資料…")} />;

  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-100 to-blue-300 px-4 py-8">
      <section className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <h1 className="text-center text-2xl font-bold text-slate-900">{t("完成帳號設定")}</h1>
        {profile ? (
          <>
            <p className="mt-2 text-center text-sm text-slate-600">{t("請補上必填的基本資料，完成後即可前往臨打團。電話可以留空。")}</p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              <label className="block text-sm font-semibold text-slate-700">
                {t("顯示名稱")} <span className="text-red-600">*</span>
                <input name="display_name" value={form.display_name} onChange={handleChange} autoComplete="nickname" required maxLength={50} className={inputClass} />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-700">
                  {t("性別")} <span className="text-red-600">*</span>
                  <select name="gender" value={form.gender} onChange={handleChange} required className={inputClass}>
                    <option value="" disabled>{t("請選擇")}</option>
                    <option value="male">{t("男性")}</option>
                    <option value="female">{t("女性")}</option>
                    <option value="other">{t("其他")}</option>
                  </select>
                </label>
                <div>
                  <label htmlFor="line-profile-birth-date" className="block text-sm font-semibold text-slate-700">
                    {t("出生日期")} <span className="text-red-600">*</span>
                  </label>
                  <Calendar
                    buttonId="line-profile-birth-date"
                    placeholder={t("選擇出生日期")}
                    selectedDate={parseBirthDate(form.birth_date)}
                    showYearDropdown
                    maxDate={new Date()}
                    onDayPicked={({ date }) => setForm((current) => ({ ...current, birth_date: formatBirthDate(date) }))}
                  />
                </div>
              </div>
              <label className="block text-sm font-semibold text-slate-700">
                {t("電話")} <span className="font-normal text-slate-500">{t("（選填）")}</span>
                <input name="phone" type="tel" value={form.phone} onChange={handleChange} autoComplete="tel" className={inputClass} />
              </label>
              {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              <button type="submit" disabled={saving || signingOut} className="w-full rounded-lg bg-[#06C755] px-4 py-2.5 font-bold text-white transition hover:bg-[#05b94e] disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? t("儲存中...") : t("完成並前往臨打團")}
              </button>
            </form>
            <button type="button" onClick={handleReturnToLogin} disabled={saving || signingOut} className="mt-4 w-full rounded-lg px-4 py-2 text-center text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
              {t("回到登入")}
            </button>
          </>
        ) : (
          <>
            <p role="alert" className="mt-4 text-center text-sm text-red-700">{error}</p>
            <button type="button" onClick={() => navigate("/", { replace: true })} className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2.5 font-bold text-white">{t("回到登入")}</button>
          </>
        )}
      </section>
    </main>
  );
}

export default LineProfilePage;
