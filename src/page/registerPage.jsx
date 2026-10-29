import { useTranslation } from "../locale/i18n";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { InputElement } from "../components/inputElement";
import { useAuthPageTransition } from "../components/useAuthPageTransition";
import { registerService } from "../service/registerService";
import { validateRegister } from "../utils/validator";
import { errorPopup } from "../components/pop-up";
import Calendar from "../components/dayPicker/dayPick";
import { describeRequestError, requestErrorDetail } from "../utils/requestError";

const inputClassName = "mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const formatBirthDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

function RegisterPage() {
  const t = useTranslation();
  const [loading, setLoading] = useState(false);
  const [birthDate, setBirthDate] = useState("");
  const navigate = useNavigate();
  const { isLeaving, switchPage } = useAuthPageTransition();
  const today = new Date();

  const handleRegister = async (event) => {
    event.preventDefault();
    if (loading) return;

    const values = new FormData(event.currentTarget);
    const formData = {
      name: String(values.get("name") || "").trim(),
      username: String(values.get("username") || "").trim(),
      gender: String(values.get("gender") || ""),
      birth_date: String(values.get("birth_date") || ""),
      email: String(values.get("email") || "").trim(),
      password: String(values.get("password") || ""),
      confirmPassword: String(values.get("confirmPassword") || ""),
    };

    const validationError = validateRegister(formData, t);
    if (validationError) {
      errorPopup(t("registerPage.errorMessage.error"), validationError);
      return;
    }

    setLoading(true);
    try {
      await registerService.registerAccount({
        email: formData.email,
        username: formData.username,
        password: formData.password,
        display_name: formData.name,
        gender: formData.gender,
        birth_date: formData.birth_date,
      });
      navigate("/");
    } catch (error) {
      const duplicateName = /username|使用者名稱/i.test(requestErrorDetail(error));
      const failure = describeRequestError(error, {
        409: { title: t("registerPage.errorMessage.error"), message: duplicateName ? t("該使用者名稱已被使用") : t("registerPage.errorMessage.emailExist") },
      });
      errorPopup(failure.title, failure.message);
    } finally {
      setLoading(false);
    }
  };

  const labels = Object.fromEntries(
    ["name", "username", "gender", "birthDate", "email", "password", "confirmPassword"]
      .map((key) => [key, t(`registerPage.input.label.${key}`)])
  );
  const placeholders = Object.fromEntries(
    ["name", "username", "email", "password", "confirmPassword"]
      .map((key) => [key, t(`registerPage.input.placeholder.${key}`)])
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-100 to-blue-300 px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-5xl">

        <main className={`auth-card ${isLeaving ? "auth-card-leaving" : ""} mx-auto mt-6 w-full max-w-lg rounded-2xl border border-blue-100 bg-white p-6 shadow-xl sm:mt-8 sm:p-8`}>
          <h1 className="text-center text-2xl font-bold text-gray-800 leading-tight">
            {t("registerPage.title")}
          </h1>

          <form className="mt-6 space-y-6" onSubmit={handleRegister} noValidate>
            <section>
              <div className="mb-4 flex items-center gap-3">
                <h2 id="register-profile-heading" className="shrink-0 text-sm font-bold text-blue-700">
                  {t("基本資料")}
                  </h2>
                <div className="h-px flex-1 bg-blue-100" aria-hidden="true" />
              </div>
              <div className="space-y-4">
                <InputElement label={labels.name} name="name" type="text" placeholder={placeholders.name} autoComplete="nickname" required className={inputClassName} />
                <InputElement label={labels.username} name="username" type="text" placeholder={placeholders.username} autoComplete="username" required className={inputClassName} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="register-gender" className="block text-sm font-semibold text-slate-700">{labels.gender} <span className="text-red-600">*</span></label>
                    <select id="register-gender" name="gender" defaultValue="" required className={inputClassName}>
                      <option value="" disabled>{t("請選擇")}</option>
                      <option value="male">{t("男性")}</option>
                      <option value="female">{t("女性")}</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="register-birth-date" className="block text-sm font-semibold text-slate-700">{labels.birthDate} <span className="text-red-600">*</span></label>
                    <Calendar
                      buttonId="register-birth-date"
                      placeholder={t("選擇出生日期")}
                      showYearDropdown
                      maxDate={today}
                      onDayPicked={({ date }) => setBirthDate(formatBirthDate(date))}
                    />
                    <input type="hidden" name="birth_date" value={birthDate} readOnly />
                  </div>
                </div>
              </div>
            </section>

            {/* 填入登入資訊 */}
            <section>
              <div className="mb-4 flex items-center gap-3">
                <h2 id="register-account-heading" className="shrink-0 text-sm font-bold text-blue-700">
                  {t("登入資訊")}
                  </h2>
                <div className="h-px flex-1 bg-blue-100" aria-hidden="true" />
              </div>
              <div className="space-y-4">
                <InputElement label={labels.email} name="email" type="email" placeholder={placeholders.email} autoComplete="email" required className={inputClassName} />
                <InputElement label={labels.password} name="password" type="password" placeholder={placeholders.password} autoComplete="new-password" required className={inputClassName} />
                <InputElement label={labels.confirmPassword} name="confirmPassword" type="password" placeholder={placeholders.confirmPassword} autoComplete="new-password" required className={inputClassName} />
              </div>
            </section>

            <button type="submit" disabled={loading} className="min-h-11 w-full rounded-lg bg-blue-600 px-4 py-2.5 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? t("registerPage.button.registering") : t("建立帳號")}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            {t("已有帳號？")} <Link to="/" onClick={(event) => switchPage(event, "/")} className="font-semibold text-blue-700 hover:underline">{t("回到登入")}</Link>
          </p>
        </main>
      </div>
    </div>
  );
}

export default RegisterPage;
