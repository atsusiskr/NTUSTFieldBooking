import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import liff from "@line/liff";
import Loading from "../components/loading";
import { loginWithLineService, registerWithLineService } from "../service/authService";
import { useAuthStore } from "../store/authStore";
import { validateLineRegistration } from "../utils/validator";
import { errorPopup } from "../components/pop-up";
import { describeRequestError } from "../utils/requestError";

const formatBirthDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

function LineLoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [loading, setLoading] = useState(true);
  const [registrationToken, setRegistrationToken] = useState("");
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ displayName: "", username: "", gender: "", birthDate: "", email: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const authenticate = async () => {
      const liffId = process.env.REACT_APP_LIFF_ID;
      if (!liffId) throw new Error("缺少 REACT_APP_LIFF_ID 設定");

      await liff.init({ liffId });
      if (!liff.isLoggedIn()) {
        liff.login({ redirectUri: window.location.href });
        return;
      }

      const idToken = liff.getIDToken();
      if (!idToken) throw new Error("無法取得 LINE 身分驗證資訊，請重新開啟此頁面。");

      const result = await loginWithLineService(idToken);
      if (result.access_token && result.user) {
        setAuth(result);
        navigate("/external/group", { replace: true });
        return;
      }

      if (!result.registration_token) throw new Error("LINE 登入回應格式不正確");
      const lineProfile = await liff.getProfile();
      setProfile(lineProfile);
      setRegistrationToken(result.registration_token);
      setForm((current) => ({ ...current, displayName: lineProfile.displayName || "" }));
      setLoading(false);
    };

    authenticate().catch((error) => {
      console.error("LINE authentication failed:", error);
      errorPopup("LINE 登入失敗", error.message || "目前無法使用 LINE 登入，請稍後再試。");
      navigate("/", { replace: true });
    });
  }, [navigate, setAuth]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    const candidate = {
      name: form.displayName.trim(),
      username: form.username.trim(),
      gender: form.gender,
      birth_date: form.birthDate,
      email: form.email.trim(),
    };
    const validationError = validateLineRegistration(candidate);
    if (validationError) {
      errorPopup("資料尚未完成", validationError);
      return;
    }

    setSubmitting(true);
    try {
      await registerWithLineService({
        registrationToken,
        username: candidate.username,
        displayName: candidate.name,
        gender: candidate.gender,
        birthDate: candidate.birth_date,
        email: form.email.trim(),
      });
      navigate("/external/group", { replace: true });
    } catch (error) {
      const failure = describeRequestError(error, {
        409: { title: "註冊失敗", message: "此使用者名稱或 LINE 帳號已被使用。" },
      });
      errorPopup(failure.title, failure.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading isLoading text="正在透過 LINE 驗證身分…" />;

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-100 to-blue-300 px-4 py-8">
      <main className="mx-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-6 text-center">
          {profile?.pictureUrl && <img src={profile.pictureUrl} alt="LINE 大頭貼" className="mx-auto mb-3 h-16 w-16 rounded-full" />}
          <h1 className="text-2xl font-bold text-gray-800">完成帳號設定</h1>
          <p className="mt-2 text-sm text-gray-500">已確認 LINE 身分。再填寫以下資料即可建立帳號。</p>
        </div>
        <form onSubmit={handleRegister} className="space-y-4" noValidate>
          <label className="block text-sm font-semibold text-slate-700">顯示名稱 <span className="text-red-600">*</span>
            <input name="displayName" value={form.displayName} onChange={updateField} required className="mt-1.5 w-full rounded-lg border border-gray-300 px-4 py-2.5" />
          </label>
          <label className="block text-sm font-semibold text-slate-700">使用者名稱 <span className="text-red-600">*</span>
            <input name="username" value={form.username} onChange={updateField} required autoComplete="username" pattern="[A-Za-z0-9]+" className="mt-1.5 w-full rounded-lg border border-gray-300 px-4 py-2.5" />
            <span className="mt-1 block text-xs font-normal text-gray-500">僅限英文字母與數字。</span>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">性別 <span className="text-red-600">*</span>
              <select name="gender" value={form.gender} onChange={updateField} required className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5"><option value="" disabled>請選擇</option><option value="male">男性</option><option value="female">女性</option><option value="other">其他</option></select>
            </label>
            <label className="block text-sm font-semibold text-slate-700">出生日期 <span className="text-red-600">*</span>
              <input name="birthDate" type="date" value={form.birthDate} onChange={updateField} max={formatBirthDate(new Date())} required className="mt-1.5 w-full rounded-lg border border-gray-300 px-4 py-2.5" />
            </label>
          </div>
          <label className="block text-sm font-semibold text-slate-700">電子信箱 <span className="font-normal text-gray-500">（選填）</span>
            <input name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" className="mt-1.5 w-full rounded-lg border border-gray-300 px-4 py-2.5" />
          </label>
          <button type="submit" disabled={submitting || !registrationToken} className="w-full rounded-lg bg-[#06C755] py-2.5 font-bold text-white transition hover:bg-[#05b94e] disabled:cursor-not-allowed disabled:opacity-60">{submitting ? "建立帳號中…" : "以 LINE 建立帳號"}</button>
        </form>
        <button type="button" onClick={() => navigate("/")} className="mt-4 w-full text-sm font-semibold text-blue-700 hover:underline">改用帳號密碼登入</button>
      </main>
    </div>
  );
}

export default LineLoginPage;
