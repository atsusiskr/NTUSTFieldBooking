import { useTranslation } from "../locale/i18n";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import liff from "@line/liff";
import Loading from "../components/loading";
import { loginWithLineService } from "../service/authService";
import { consumeLineTransaction, getLineRedirectUri, startLineAuthorization } from "../service/lineAuthorization";
import { describeRequestError } from "../utils/requestError";
import { useSportStore } from "../store/sportStore";
import { getUserProfile } from "../service/userService";

function LineLoginPage() {
  const t = useTranslation();
  const navigate = useNavigate();
  const started = useRef(false);
  const sportId = useSportStore((state) => state.sportId);
  const setSportId = useSportStore((state) => state.setSportId);
  const [error, setError] = useState("");
  const [externalOpened, setExternalOpened] = useState(false);

  useEffect(() => {
    // React StrictMode may run this effect twice; the authorization code is single use.
    if (started.current) return;
    started.current = true;

    const completeLogin = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const returnedState = params.get("state");
      const lineError = params.get("error");

      if (!code && !lineError) {
        if (liff.isInClient()) {
          const liffId = process.env.REACT_APP_LIFF_ID;
          if (!liffId) throw new Error(t("缺少 REACT_APP_LIFF_ID 設定"));
          await liff.init({ liffId });
          liff.openWindow({ url: getLineRedirectUri(), external: true });
          setExternalOpened(true);
          return;
        }
        await startLineAuthorization();
        return;
      }

      // Remove the one-time code from browser history before calling the backend.
      window.history.replaceState(window.history.state, "", window.location.pathname);
      if (lineError) {
        consumeLineTransaction(returnedState);
        throw new Error(t("已取消 LINE 登入，請重新嘗試。"));
      }

      const { redirectUri, codeVerifier, nonce } = consumeLineTransaction(returnedState);
      const result = await loginWithLineService({ code, redirectUri, codeVerifier, nonce });
      if (!sportId) setSportId("badminton");
      let needsProfile = result.is_new_user === true;
      if (!needsProfile) {
        try {
          const profile = await getUserProfile();
          needsProfile = !profile?.gender || !profile?.birth_date;
        } catch {
          // Login succeeded; a profile lookup failure should not block returning users.
        }
      }
      navigate(needsProfile ? "/external/user" : "/external/group", {
        replace: true,
        state: needsProfile ? { completeLineProfile: true } : null,
      });
    };

    completeLogin().catch((reason) => {
      const failure = reason.response
        ? describeRequestError(reason, {
          401: { title: t("LINE 登入失敗"), message: t("LINE 授權驗證失敗。") },
          404: { title: t("LINE 登入失敗"), message: t("LINE 登入尚未在伺服器設定完成。") },
        })
        : { message: reason.message || t("目前無法使用 LINE 登入，請稍後再試。") };
      setError(failure.message);
    });
  }, [navigate, setSportId, sportId, t]);

  if (!error && !externalOpened) return <Loading isLoading text={t("正在透過 LINE 驗證身分…")} />;

  if (externalOpened) return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-100 to-blue-300 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
        <h1 className="text-xl font-bold text-gray-800">{t("請在外部瀏覽器完成 LINE 登入")}</h1>
        <a href={getLineRedirectUri()} target="_blank" rel="noopener noreferrer" className="mt-5 inline-block rounded-lg bg-[#06C755] px-5 py-2 font-semibold text-white">
          {t("開啟 LINE 登入")}
        </a>
      </div>
    </main>
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-100 to-blue-300 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
        <h1 className="text-xl font-bold text-gray-800">{t("LINE 登入失敗")}</h1>
        <p role="alert" className="mt-3 text-sm text-gray-600">{error}</p>
        <button type="button" onClick={() => navigate("/", { replace: true })} className="mt-6 rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700">
          {t("回到登入")}
        </button>
      </div>
    </main>
  );
}

export default LineLoginPage;
