import { useTranslation } from "../locale/i18n";
import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";

import Loading from "../components/loading";
import { loginService } from "../service/authService";
import { sportService } from "../service/sportService";
import { errorPopup } from "../components/pop-up";
import { functionIconMap } from "../constant/IconMap";
import { useAuthPageTransition } from "../components/useAuthPageTransition";
import { useSportStore } from "../store/sportStore";
import { describeRequestError } from "../utils/requestError";
import { isLineDemoMode } from "../config/lineMode";
import { startLineAuthorization } from "../service/lineAuthorization";


function LoginPage() {
  const t = useTranslation();
  const [filter, setFilter] = useState("");
  const [password, setPassword] = useState("");
  const [sport, setSport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const setSportId = useSportStore((state) => state.setSportId);
  const { isLeaving, switchPage } = useAuthPageTransition();

  useEffect(() => {
    setLoading(true);
    const getSportList = async () => {
      try {
        const data = await sportService.getSportList();
        setSport(data.items);
      } catch (error) {
        console.error("Error fetching sport list:", error);
        const failure = describeRequestError(error);
        errorPopup(failure.title, failure.message);
      } finally {
        setLoading(false);
      }
    }

    getSportList();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (!filter) {
      errorPopup(t("loginPage.errorMessage.error"), t("loginPage.errorMessage.requiredSportsType"));
      return;
    }

    setLoading(true);

    try {
      const form = new FormData(e.target);
      const email = form.get("email")?.trim();
      const password = form.get("password");

      if (!email || !password) {
        errorPopup(t("loginPage.errorMessage.error"), t("loginPage.errorMessage.invalidCredentials"));
        setLoading(false);
        return;
      }

      await loginService(email, password);
      setSportId(filter);
      navigate(`external/group`);

    } catch (error) {
      const failure = error?.message === "Invalid credentials" ? {
        title: t("loginPage.errorMessage.error"), message: t("loginPage.errorMessage.invalidCredentials"),
      } : describeRequestError(error, {
        400: { title: t("loginPage.errorMessage.error"), message: t("loginPage.errorMessage.invalidCredentials") },
        401: { title: t("loginPage.errorMessage.error"), message: t("loginPage.errorMessage.invalidCredentials") },
      });
      errorPopup(failure.title, failure.message);
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLineLogin = async () => {
    if (isLineDemoMode) {
      navigate("/line-login");
      return;
    }
    try {
      setSportId(filter || sport[0]?.id || "badminton");
      await startLineAuthorization();
    } catch (error) {
      errorPopup(t("LINE 登入失敗"), error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-100 to-blue-300">
      <Loading isLoading={loading} text={t("loginPage.loadingMessage")} />
      <div className="w-[80%] max-w-md" style={{ perspective: "1200px" }}>
        <div className={`auth-card ${isLeaving ? "auth-card-leaving" : ""} relative bg-white shadow-lg rounded-xl p-8 w-full max-w-md transition-transform duration-500 ease-in-out`}>
          <div className="flex flex-col items-center mb-4">
            <img
              src="/icon/logo.png"
              alt="Logo"
              className="w-14 h-14 mb-2"
            />
            <h1 className="text-2xl font-bold text-gray-800 leading-tight">
              {t("loginPage.title")}
            </h1>
          </div>

          <form className="space-y-5" onSubmit={(e) => handleLogin(e)}>
            <div>
              <label className="block text-start text-gray-600 mb-1" htmlFor="email">{t("loginPage.input.label.email")}</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder={t("loginPage.input.placeholder.email")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-start text-gray-600 mb-1" htmlFor="password">{t("loginPage.input.label.password")}</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  placeholder={t("loginPage.input.placeholder.password")}
                  className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((isVisible) => !isVisible)}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 grid w-11 place-items-center text-gray-500 transition hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-inset rounded-r-lg"
                >
                  {(password.length > 0) ? (showPassword ? (
                    <div>{functionIconMap.hide.icon}</div>
                  ) : (
                    <div>{functionIconMap.show.icon}</div>
                  )) : null}
                </button>
              </div>
            </div>

            {/* 球類選擇 */}
            <div className="w-full flex justify-center flex-wrap gap-4">
              {sport.map(sport => (
                <button
                  type="button"
                  key={sport.id}
                  onClick={() => setFilter(sport.id)}
                  className={`px-4 py-2 rounded-md text-white transition ${filter === sport.id ? "bg-blue-700" : "bg-blue-400 hover:bg-blue-600"}`}
                >
                  {sport.name}
                </button>
              ))}
            </div>
            <button
              type="submit"
              className={`w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition ${loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              disabled={loading}
            >
              {loading ? t("登入中...") : t("登入")}
            </button>
          </form>
          <div className="my-5 flex items-center gap-3 text-sm text-gray-400" aria-hidden="true">
            <div className="h-px flex-1 bg-gray-200" />
            {t("或")}
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          <button
            type="button"
            onClick={handleLineLogin}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#06C755] py-2 font-semibold text-white transition hover:bg-[#05b94e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06C755] focus-visible:ring-offset-2"
          >
            {isLineDemoMode ? t("體驗 LINE 登入／註冊（展示）") : t("使用 LINE 登入／註冊")}
          </button>
          {isLineDemoMode && <p className="mt-2 text-center text-xs text-gray-500">{t("展示模式不會建立真實帳號或登入系統。")}</p>}
          <p className="text-center text-sm text-gray-500 mt-4">
            {t("還沒有帳號？")}{" "}
            <Link to="/register" onClick={(event) => switchPage(event, "/register")} className="text-blue-500 hover:underline">
              {t("註冊帳號")}
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}

export default LoginPage;
