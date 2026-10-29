import { useTranslation, translate } from "../locale/i18n";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { validateLineRegistration } from "../utils/validator";

const STORAGE_KEY = "ntust-line-demo-account";
const inputClass = "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100";
const formatBirthDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const readDemoAccount = () => {
  try {
    return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
};

function LineDemoPage() {
  const t = useTranslation();
  const navigate = useNavigate();
  const [account, setAccount] = useState(readDemoAccount);
  const [step, setStep] = useState("intro");
  const [completionType, setCompletionType] = useState("registration");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    displayName: t("LINE 體驗者"),
    username: "",
    gender: "",
    birthDate: "",
    email: "",
  });

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
  };

  const continueDemo = () => {
    setError("");
    setCompletionType(account ? "login" : "registration");
    setStep(account ? "complete" : "register");
  };

  const registerDemoAccount = (event) => {
    event.preventDefault();
    const data = {
      name: form.displayName.trim(),
      username: form.username.trim(),
      gender: form.gender,
      birth_date: form.birthDate,
      email: form.email.trim(),
    };
    const validationError = validateLineRegistration(data, t);
    if (validationError) {
      setError(validationError);
      return;
    }

    // The demo stores only a display label in this tab. It never creates an
    // application session or sends identity data to the production API.
    const demoAccount = { displayName: data.name, username: data.username };
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(demoAccount));
    } catch {
      // The screen can still be demonstrated when browser storage is disabled.
    }
    setAccount(demoAccount);
    setCompletionType("registration");
    setStep("complete");
  };

  const restartDemo = () => {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Keep the in-memory reset available when storage is disabled.
    }
    setAccount(null);
    setForm({ displayName: t("LINE 體驗者"), username: "", gender: "", birthDate: "", email: "" });
    setError("");
    setStep("intro");
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-100 to-blue-300 px-4 py-8">
      <main className="mx-auto w-full max-w-lg overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-xl">
        <div className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-center text-sm font-semibold text-amber-900" role="status">
          {t("開發展示模式 · 不會連接 LINE 或建立真實帳號")}
        </div>
        <div className="p-6 sm:p-8">
          {step === "intro" && (
            <div className="text-center">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-[#06C755] text-2xl font-black text-white" aria-hidden="true">L</div>
              <h1 className="text-2xl font-bold text-slate-800">{t("LINE 登入／註冊體驗")}</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {account ? translate("此分頁已有展示帳號「{value0}」，可以體驗再次登入。", { value0: account.displayName }) : t("按下方按鈕，模擬完成 LINE 授權後補填註冊資料。")}
              </p>
              <button type="button" onClick={continueDemo} className="mt-8 min-h-11 w-full rounded-lg bg-[#06C755] px-4 py-2.5 font-bold text-white transition hover:bg-[#05b94e]">
                {account ? t("模擬 LINE 登入") : t("模擬 LINE 授權，開始註冊")}
              </button>
              {account && <button type="button" onClick={restartDemo} className="mt-4 text-sm font-semibold text-blue-700 hover:underline">{t("重新體驗首次註冊")}</button>}
            </div>
          )}

          {step === "register" && (
            <div>
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-green-100 text-xl font-bold text-green-700" aria-hidden="true">L</div>
                <h1 className="text-2xl font-bold text-slate-800">{t("完成帳號設定")}</h1>
                <p className="mt-2 text-sm text-slate-500">{t("模擬 LINE 授權已完成，填寫必要資料即可預覽註冊結果。")}</p>
              </div>
              <form onSubmit={registerDemoAccount} className="space-y-4" noValidate>
                <label className="block text-sm font-semibold text-slate-700">{t("顯示名稱")} <span className="text-red-600">*</span>
                  <input name="displayName" value={form.displayName} onChange={updateField} required className={inputClass} />
                </label>
                <label className="block text-sm font-semibold text-slate-700">{t("使用者名稱")} <span className="text-red-600">*</span>
                  <input name="username" value={form.username} onChange={updateField} required autoComplete="username" className={inputClass} />
                  <span className="mt-1 block text-xs font-normal text-slate-500">{t("僅限英文字母與數字。")}</span>
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-slate-700">{t("性別")} <span className="text-red-600">*</span>
                    <select name="gender" value={form.gender} onChange={updateField} required className={inputClass}>
                      <option value="" disabled>{t("請選擇")}</option>
                      <option value="male">{t("男性")}</option>
                      <option value="female">{t("女性")}</option>
                      <option value="other">{t("其他")}</option>
                    </select>
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">{t("出生日期")} <span className="text-red-600">*</span>
                    <input name="birthDate" type="date" value={form.birthDate} onChange={updateField} max={formatBirthDate(new Date())} required className={inputClass} />
                  </label>
                </div>
                <label className="block text-sm font-semibold text-slate-700">{t("電子信箱")} <span className="font-normal text-slate-500">{t("（選填）")}</span>
                  <input name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" className={inputClass} />
                </label>
                {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
                <button type="submit" className="min-h-11 w-full rounded-lg bg-[#06C755] px-4 py-2.5 font-bold text-white transition hover:bg-[#05b94e]">{t("完成展示註冊")}</button>
              </form>
            </div>
          )}

          {step === "complete" && (
            <div className="text-center">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-green-100 text-3xl font-bold text-green-700" aria-hidden="true">✓</div>
              <h1 className="text-2xl font-bold text-slate-800">{completionType === "registration" ? t("註冊流程展示完成") : t("登入流程展示完成")}</h1>
              <p className="mt-3 text-sm text-slate-600">{t("歡迎，")}{account?.displayName}（{account?.username}）</p>
              <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-left text-sm leading-6 text-green-900">
                {t("正式串接後，此步會由後端建立或查找帳號、簽發系統登入憑證，並帶你進入臨打頁。")}
              </div>
              <button type="button" onClick={() => setStep("intro")} className="mt-6 min-h-11 w-full rounded-lg bg-[#06C755] px-4 py-2.5 font-bold text-white transition hover:bg-[#05b94e]">{t("再次體驗 LINE 登入")}</button>
              <button type="button" onClick={restartDemo} className="mt-4 text-sm font-semibold text-blue-700 hover:underline">{t("重新體驗首次註冊")}</button>
            </div>
          )}

          <button type="button" onClick={() => navigate("/")} className="mt-6 w-full text-center text-sm font-semibold text-slate-500 hover:text-blue-700">{t("返回登入頁")}</button>
        </div>
      </main>
    </div>
  );
}

export default LineDemoPage;
